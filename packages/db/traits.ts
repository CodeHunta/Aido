// Shared read helpers for API routes (and later the worker).
// Computes display-ready traits from DB rows. Money in kobo.
import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  dividends,
  factorScores,
  financials,
  investorProfiles,
  pricesDaily,
  recommendations,
  stocks,
} from "./schema";

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

export interface StockTraits {
  ticker: string;
  name: string;
  sector: string;
  categories: string[];
  asset: string;
  closeKobo: number | null;
  asOf: string | null;
  source: string | null;
  volatility: number | null;
  avgDailyValueKobo: number | null;
  dividendYield: number | null;
  score: number | null;
  action: string | null;
  confidence: string | null;
  factors: Record<string, number> | null;
}

export async function getTraits(ticker: string): Promise<StockTraits | null> {
  const s = (await db.select().from(stocks).where(eq(stocks.ticker, ticker)))[0];
  if (!s) return null;
  const px = await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ticker)).orderBy(pricesDaily.date);
  const closes = px.map((p) => p.closeKobo ?? 0).filter((c) => c > 0);
  const rets: number[] = [];
  for (let k = 1; k < closes.length; k++) rets.push(closes[k]! / closes[k - 1]! - 1);
  const divs = await db.select().from(dividends).where(eq(dividends.ticker, ticker)).orderBy(desc(dividends.payDate));
  const rec = (
    await db.select().from(recommendations).where(eq(recommendations.ticker, ticker)).orderBy(desc(recommendations.asOf)).limit(1)
  )[0];
  const last = closes[closes.length - 1] ?? null;
  const lastRow = px[px.length - 1];
  const lastDate = lastRow?.date ?? null;
  return {
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
    categories: s.categories,
    asset: s.asset,
    closeKobo: last,
    asOf: lastDate,
    source: lastRow?.source ?? null,
    volatility: rets.length > 5 ? stdev(rets) * Math.sqrt(252) : null,
    avgDailyValueKobo:
      closes.length > 0 ? px.reduce((a, p, k) => a + Number(p.volume ?? 0) * (closes[k] ?? 0), 0) / px.length : null,
    dividendYield: divs[0]?.dpsKobo && last ? divs[0].dpsKobo / last : null,
    score: rec?.score ?? null,
    action: rec?.action ?? null,
    confidence: rec?.confidence ?? null,
    factors: (rec?.thesis as { factors?: Record<string, number> } | null)?.factors ?? null,
  };
}

export async function listTickers(): Promise<string[]> {
  return (await db.select({ ticker: stocks.ticker }).from(stocks).orderBy(stocks.ticker)).map((r) => r.ticker);
}

// Bulk loader: the whole universe in ~5 queries instead of hundreds.
// Dashboard, Explore and Picks use this — per-ticker getTraits stays for
// single-stock pages where a few queries are cheap.
export async function listTraits(): Promise<StockTraits[]> {
  const [allStocks, allPrices, latestRecs, latestDivs] = await Promise.all([
    db.select().from(stocks).orderBy(stocks.ticker),
    db.select().from(pricesDaily).orderBy(pricesDaily.ticker, pricesDaily.date),
    db
      .selectDistinctOn([recommendations.ticker], {
        ticker: recommendations.ticker,
        score: recommendations.score,
        action: recommendations.action,
        confidence: recommendations.confidence,
        thesis: recommendations.thesis,
        asOf: recommendations.asOf,
      })
      .from(recommendations)
      .orderBy(recommendations.ticker, desc(recommendations.asOf)),
    db
      .selectDistinctOn([dividends.ticker], { ticker: dividends.ticker, dpsKobo: dividends.dpsKobo })
      .from(dividends)
      .orderBy(dividends.ticker, desc(dividends.payDate)),
    db.select().from(financials),
  ]);
  const pricesByTicker = new Map<string, { date: string; close: number; volume: number; source: string | null }[]>();
  for (const p of allPrices) {
    const arr = pricesByTicker.get(p.ticker) ?? [];
    arr.push({ date: p.date, close: p.closeKobo ?? 0, volume: Number(p.volume ?? 0), source: p.source ?? null });
    pricesByTicker.set(p.ticker, arr);
  }
  const recByTicker = new Map(latestRecs.map((r) => [r.ticker, r]));
  const divByTicker = new Map(latestDivs.map((d) => [d.ticker, d.dpsKobo]));

  return allStocks.map((s) => {
    const series = pricesByTicker.get(s.ticker) ?? [];
    const closes = series.map((p) => p.close).filter((c) => c > 0);
    const rets: number[] = [];
    for (let k = 1; k < closes.length; k++) rets.push(closes[k]! / closes[k - 1]! - 1);
    const last = closes[closes.length - 1] ?? null;
    const lastRow = series[series.length - 1];
    const div = divByTicker.get(s.ticker);
    const rec = recByTicker.get(s.ticker);
    return {
      ticker: s.ticker,
      name: s.name,
      sector: s.sector,
      categories: s.categories,
      asset: s.asset,
      closeKobo: last,
      asOf: lastRow?.date ?? null,
      source: lastRow?.source ?? null,
      volatility: rets.length > 5 ? stdev(rets) * Math.sqrt(252) : null,
      avgDailyValueKobo:
        closes.length > 0 ? series.reduce((a, p, k) => a + p.volume * (closes[k] ?? 0), 0) / series.length : null,
      dividendYield: div != null && last ? Number(div) / last : null,
      score: rec?.score ?? null,
      action: rec?.action ?? null,
      confidence: rec?.confidence ?? null,
      factors: (rec?.thesis as { factors?: Record<string, number> } | null)?.factors ?? null,
    };
  });
}

export async function getProfile(userId: string) {
  return (await db.select().from(investorProfiles).where(eq(investorProfiles.userId, userId)))[0] ?? null;
}

export async function getFinancial(ticker: string) {
  return (await db.select().from(financials).where(eq(financials.ticker, ticker)))[0] ?? null;
}

export async function getFactorHistory(ticker: string) {
  return db.select().from(factorScores).where(eq(factorScores.ticker, ticker)).orderBy(factorScores.asOf);
}

export async function getThesis(ticker: string) {
  return (
    await db.select().from(recommendations).where(eq(recommendations.ticker, ticker)).orderBy(desc(recommendations.asOf)).limit(1)
  )[0] ?? null;
}

export async function recentPrices(ticker: string, n: number) {
  const rows = await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ticker)).orderBy(desc(pricesDaily.date)).limit(n);
  return rows.reverse();
}
