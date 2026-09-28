// Scores the whole NGX universe from DB data and stores factor_scores + recommendations.
// Run: pnpm --filter @aido/worker score
import { desc, eq } from "drizzle-orm";
import { db, dividends, factorScores, financials, pricesDaily, recommendations, stocks } from "@aido/db";
import { scoreStock } from "@aido/scoring";

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : null);

async function main() {
  const all = await db.select().from(stocks);
  // Peer P/Es per sector for the valuation factor
  const peBySector = new Map<string, number[]>();
  const finByTicker = new Map<string, (typeof financials.$inferSelect)[]>();
  for (const s of all) {
    const fin = await db.select().from(financials).where(eq(financials.ticker, s.ticker));
    finByTicker.set(s.ticker, fin);
  }
  // P/Es are computed below once market caps are known.
  const latestClose = new Map<string, number>();
  const mcapOf = new Map<string, number>();
  const seriesByTicker = new Map<string, { date: string; close: number; volume: number }[]>();
  for (const s of all) {
    const series = await db
      .select()
      .from(pricesDaily)
      .where(eq(pricesDaily.ticker, s.ticker))
      .orderBy(pricesDaily.date);
    seriesByTicker.set(
      s.ticker,
      series.map((p) => ({ date: p.date, close: p.closeKobo ?? 0, volume: Number(p.volume ?? 0) })),
    );
    const last = series[series.length - 1];
    if (last?.closeKobo) {
      latestClose.set(s.ticker, last.closeKobo);
      if (last.marketCapKobo) mcapOf.set(s.ticker, Number(last.marketCapKobo));
    }
  }
  const peMap = new Map<string, number | null>();
  for (const s of all) {
    const fin = finByTicker.get(s.ticker)?.[0];
    const mcap = mcapOf.get(s.ticker);
    peMap.set(s.ticker, fin?.earningsKobo && fin.earningsKobo > 0 && mcap ? mcap / fin.earningsKobo : null);
    const pe = peMap.get(s.ticker);
    if (pe != null) peBySector.set(s.sector, [...(peBySector.get(s.sector) ?? []), pe]);
  }

  let scored = 0;
  for (const s of all) {
    const series = seriesByTicker.get(s.ticker) ?? [];
    const closes = series.map((p) => p.close).filter((c) => c > 0);
    const rets: number[] = [];
    for (let k = 1; k < closes.length; k++) rets.push(closes[k]! / closes[k - 1]! - 1);
    const mom = (n: number) =>
      closes.length > n && closes[closes.length - 1 - n]! > 0
        ? closes[closes.length - 1]! / closes[closes.length - 1 - n]! - 1
        : null;
    const avgVal =
      closes.length > 0
        ? series.reduce((a, p, k) => a + p.volume * (closes[k] ?? 0), 0) / series.length
        : null;
    const fin = finByTicker.get(s.ticker)?.[0];
    const divs = await db.select().from(dividends).where(eq(dividends.ticker, s.ticker)).orderBy(desc(dividends.payDate));
    const latestDiv = divs[0];
    const close = latestClose.get(s.ticker) ?? null;
    const result = scoreStock({
      ticker: s.ticker,
      pe: peMap.get(s.ticker) ?? null,
      peerMedianPe: median(peBySector.get(s.sector) ?? []),
      historyMedianPe: null, // single FY so far — engine degrades honestly
      dividendYield: latestDiv?.dpsKobo && close ? latestDiv.dpsKobo / close : null,
      roe: fin?.roe ?? null,
      profitMargin: fin?.profitMargin ?? null,
      debtToEquity: fin?.debtToEquity != null ? Number(fin.debtToEquity) : null,
      payoutRatio: fin?.payoutRatio != null ? Number(fin.payoutRatio) : null,
      fcfPositive: fin?.fcfKobo != null ? fin.fcfKobo > 0 : null,
      financialsAgeMonths: fin ? 9 : null,
      revenueGrowth: null,
      earningsGrowth: null,
      momentum3m: mom(63),
      momentum12m: mom(Math.min(250, closes.length - 1)),
      volatility: rets.length > 5 ? stdev(rets) * Math.sqrt(252) : null,
      avgDailyValueKobo: avgVal,
      speculativeFlag: s.categories.some((c) => c === "speculative" || c === "high-risk"),
    });

    const asOf = series[series.length - 1]?.date ?? new Date().toISOString().slice(0, 10);
    await db
      .insert(factorScores)
      .values({
        ticker: s.ticker,
        asOf,
        fundamental: result.factors.fundamental,
        valuation: result.factors.valuation,
        growth: result.factors.growth,
        marketBehaviour: result.factors.market,
        dividend: result.factors.dividend,
        riskInverse: result.factors.riskInverse,
        confidence: result.confidence,
        engineVersion: result.engineVersion,
        inputsHash: `${asOf}`,
      })
      .onConflictDoNothing();
    await db.insert(recommendations).values({
      id: `${s.ticker}-${asOf}-v1`,
      ticker: s.ticker,
      action: result.action,
      score: result.score,
      confidence: result.confidence,
      why: result.why,
      keyRisk: result.keyRisk,
      thesis: {
        factors: result.factors,
        whyNow: result.whyNow,
        contradictory: result.contradictory,
        whatWouldChange: result.whatWouldChange,
      },
      inputsSnapshot: { asOf, pe: peMap.get(s.ticker) ?? null },
      engineVersion: result.engineVersion,
    }).onConflictDoNothing();
    scored++;
  }
  console.log(`Scored ${scored} stocks with engine v1.`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
