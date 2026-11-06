// Scores the whole NGX universe from real DB data and stores factor_scores + recommendations.
// Only audited/filing-extracted financials and dividends are used; sample rows are ignored
// so a company without real data shows "unavailable" instead of a made-up score.
// Run: pnpm --filter @aido/worker score
import { desc, eq } from "@aido/db/drizzle";
import { db, dividends, factorScores, financials, pricesDaily, recommendations, stocks } from "@aido/db";
import { scoreStock } from "@aido/scoring";

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : null);

const SAMPLE = "seed-sample";

function real<T extends { sourceType: string }>(rows: T[]): T[] {
  return rows.filter((r) => r.sourceType !== SAMPLE);
}

function monthsSince(iso: string): number {
  const end = new Date(`${iso}T00:00:00Z`).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((Date.now() - end) / (30.44 * 24 * 60 * 60 * 1000)));
}

function growth(current: number | null | undefined, prior: number | null | undefined): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}

function dividendDate(d: typeof dividends.$inferSelect): number {
  const raw = d.payDate ?? d.declDate ?? d.qualDate;
  return raw ? new Date(`${raw}T00:00:00Z`).getTime() : 0;
}

function dividendPeriod(d: typeof dividends.$inferSelect): number {
  const year = d.period?.match(/\d{4}/);
  return year ? Number(year[0]) : 0;
}

async function main() {
  const all = await db.select().from(stocks);

  // Load each ticker's real financials (newest first) and dividends.
  const finByTicker = new Map<string, (typeof financials.$inferSelect)[]>();
  const divByTicker = new Map<string, (typeof dividends.$inferSelect)[]>();
  // Older statements are treated as unavailable: a 2022 figure against a 2026
  // price would look current when it is not.
  const minYear = new Date().getFullYear() - 2;
  for (const s of all) {
    const fin = await db
      .select()
      .from(financials)
      .where(eq(financials.ticker, s.ticker))
      .orderBy(desc(financials.periodEnd));
    finByTicker.set(
      s.ticker,
      real(fin).filter((f) => Number(f.periodEnd.slice(0, 4)) >= minYear),
    );
    const div = await db.select().from(dividends).where(eq(dividends.ticker, s.ticker)).orderBy(desc(dividends.declDate));
    divByTicker.set(
      s.ticker,
      real(div).filter((d) => dividendPeriod(d) >= minYear),
    );
  }

  // Price history and latest close per ticker.
  const latestClose = new Map<string, number>();
  const latestMcap = new Map<string, number>();
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
    if (last?.closeKobo) latestClose.set(s.ticker, last.closeKobo);
    for (let k = series.length - 1; k >= 0; k--) {
      const mcap = series[k]!.marketCapKobo;
      if (mcap) {
        latestMcap.set(s.ticker, Number(mcap));
        break;
      }
    }
  }

  // Trailing P/E from price and reported EPS (both in kobo), so no market-cap
  // guess is involved. Fall back to market cap when EPS is missing.
  const peMap = new Map<string, number | null>();
  for (const s of all) {
    const fin = finByTicker.get(s.ticker)?.[0];
    const close = latestClose.get(s.ticker) ?? null;
    let pe: number | null = null;
    if (close && fin?.epsKobo && fin.epsKobo > 0) pe = close / fin.epsKobo;
    if (pe == null) {
      const mcap = latestMcap.get(s.ticker);
      if (fin?.earningsKobo && fin.earningsKobo > 0 && mcap) pe = mcap / fin.earningsKobo;
    }
    // A P/E far outside any plausible range means the EPS unit is wrong (for
    // example, a report in US cents). Treat it as unavailable rather than
    // feeding a 1000x figure into valuation.
    if (pe != null && (pe < 0.5 || pe > 200)) pe = null;
    peMap.set(s.ticker, pe);
  }
  const peBySector = new Map<string, number[]>();
  for (const s of all) {
    const pe = peMap.get(s.ticker);
    if (pe != null && pe > 0 && pe < 200) peBySector.set(s.sector, [...(peBySector.get(s.sector) ?? []), pe]);
  }

  let scored = 0;
  let noSignal = 0;
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

    const fins = finByTicker.get(s.ticker) ?? [];
    // Skip rows where parsing produced no usable profit or revenue; the next
    // period is usually the last good audited statement.
    const usable = fins.filter((f) => f.revenueKobo != null || f.earningsKobo != null);
    const fin = usable[0];
    const prior = usable[1];
    const divs = (divByTicker.get(s.ticker) ?? []).filter((d) => d.dpsKobo != null);
    // Most recent fiscal period first, then the newest declared/pay date.
    const latestDiv = divs.sort((a, b) => dividendPeriod(b) - dividendPeriod(a) || dividendDate(b) - dividendDate(a))[0];
    const close = latestClose.get(s.ticker) ?? null;
    const dividendYield = latestDiv && close ? (latestDiv.dpsKobo ?? 0) / close : null;

    const result = scoreStock({
      ticker: s.ticker,
      pe: peMap.get(s.ticker) ?? null,
      peerMedianPe: median(peBySector.get(s.sector) ?? []),
      historyMedianPe: null, // single FY so far — engine degrades honestly
      dividendYield,
      dividendDataAvailable: latestDiv ? true : undefined,
      roe: fin?.roe ?? null,
      profitMargin: fin?.profitMargin ?? null,
      debtToEquity: fin?.debtToEquity != null ? Number(fin.debtToEquity) : null,
      payoutRatio: fin?.payoutRatio != null ? Number(fin.payoutRatio) : null,
      fcfPositive: fin?.fcfKobo != null ? fin.fcfKobo > 0 : null,
      financialsAgeMonths: fin ? monthsSince(fin.periodEnd) : null,
      revenueGrowth: growth(fin?.revenueKobo, prior?.revenueKobo),
      earningsGrowth: growth(fin?.earningsKobo, prior?.earningsKobo),
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
      .onConflictDoUpdate({
        target: [factorScores.ticker, factorScores.asOf],
        set: {
          fundamental: result.factors.fundamental,
          valuation: result.factors.valuation,
          growth: result.factors.growth,
          marketBehaviour: result.factors.market,
          dividend: result.factors.dividend,
          riskInverse: result.factors.riskInverse,
          confidence: result.confidence,
          engineVersion: result.engineVersion,
        },
      });

    await db
      .insert(recommendations)
      .values({
        id: `${s.ticker}-${asOf}-v1`,
        ticker: s.ticker,
        action: result.action,
        score: result.score,
        confidence: result.confidence,
        why: result.why,
        keyRisk: result.keyRisk,
        thesis: {
          factors: result.factors,
          unavailable: result.unavailable,
          whyNow: result.whyNow,
          contradictory: result.contradictory,
          whatWouldChange: result.whatWouldChange,
        },
        inputsSnapshot: {
          asOf,
          pe: peMap.get(s.ticker) ?? null,
          period: fin?.period ?? null,
          periodEnd: fin?.periodEnd ?? null,
          financialsSource: fin?.sourceUrl ?? null,
          dividendSource: latestDiv?.sourceUrl ?? null,
        },
        engineVersion: result.engineVersion,
      })
      .onConflictDoUpdate({
        target: recommendations.id,
        set: {
          action: result.action,
          score: result.score,
          confidence: result.confidence,
          why: result.why,
          keyRisk: result.keyRisk,
          thesis: {
            factors: result.factors,
            unavailable: result.unavailable,
            whyNow: result.whyNow,
            contradictory: result.contradictory,
            whatWouldChange: result.whatWouldChange,
          },
          inputsSnapshot: {
            asOf,
            pe: peMap.get(s.ticker) ?? null,
            period: fin?.period ?? null,
            periodEnd: fin?.periodEnd ?? null,
            financialsSource: fin?.sourceUrl ?? null,
            dividendSource: latestDiv?.sourceUrl ?? null,
          },
          engineVersion: result.engineVersion,
        },
      });
    scored++;
    if (result.action === "NO_SIGNAL") noSignal++;
  }
  console.log(`Scored ${scored} stocks with engine v1 (${noSignal} without enough data).`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
