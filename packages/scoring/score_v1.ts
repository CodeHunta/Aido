import engine from "./engine_v1.json";
import type { Action, Confidence, FactorScores, ScoreResult, StockInputs } from "./types";

export const ENGINE_VERSION = "v1";
const W = engine.weights;
const T = engine.thresholds;
const G = engine.gates;

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(n)));
// Higher value → higher score between lo and hi
const scale = (v: number, lo: number, hi: number) => clamp(((v - lo) / (hi - lo)) * 100);
// Lower value → higher score between lo (good) and hi (bad)
const scaleInv = (v: number, lo: number, hi: number) => clamp(((hi - v) / (hi - lo)) * 100);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// A factor with no usable input is null, never a neutral 50. The overall score
// is renormalised across the factors that do have data.
interface FactorResult {
  score: number | null;
  notes: string[];
}

function fundamental(i: StockInputs): FactorResult {
  const parts: number[] = [];
  const notes: string[] = [];
  if (i.roe != null) {
    parts.push(scale(i.roe, 0, 0.3));
    notes.push(`ROE ${(i.roe * 100).toFixed(1)}%`);
  }
  if (i.profitMargin != null) {
    parts.push(scale(i.profitMargin, 0, 0.4));
    notes.push(`margin ${(i.profitMargin * 100).toFixed(1)}%`);
  }
  if (i.debtToEquity != null) {
    parts.push(scaleInv(i.debtToEquity, 0, 2));
    if (i.debtToEquity > 1.2) notes.push(`leverage high (D/E ${i.debtToEquity})`);
  }
  if (i.fcfPositive != null) parts.push(i.fcfPositive ? 80 : 30);
  if (i.payoutRatio != null && i.payoutRatio > G.payoutCap) {
    parts.push(30);
    notes.push(`payout ${(i.payoutRatio * 100).toFixed(0)}% looks stretched`);
  }
  if (parts.length === 0) return { score: null, notes: ["fundamentals unavailable"] };
  return { score: clamp(avg(parts)), notes };
}

function valuation(i: StockInputs): FactorResult {
  const parts: number[] = [];
  const notes: string[] = [];
  if (i.pe != null) {
    parts.push(scaleInv(i.pe, 4, 25));
    notes.push(`P/E ${i.pe.toFixed(1)}x`);
    if (i.historyMedianPe != null) {
      const disc = (i.historyMedianPe - i.pe) / i.historyMedianPe;
      parts.push(clamp(50 + disc * 200));
      if (disc > 0.1) notes.push(`${Math.round(disc * 100)}% below 5y average`);
      if (disc < -0.2) notes.push(`${Math.round(-disc * 100)}% above 5y average`);
    }
    if (i.peerMedianPe != null) {
      const disc = (i.peerMedianPe - i.pe) / i.peerMedianPe;
      parts.push(clamp(50 + disc * 200));
    }
  }
  if (i.dividendYield != null && i.dividendYield > 0) parts.push(Math.min(100, 40 + i.dividendYield * 500));
  if (parts.length === 0) return { score: null, notes: ["valuation unavailable"] };
  return { score: clamp(avg(parts)), notes };
}

function growth(i: StockInputs): FactorResult {
  const parts: number[] = [];
  const notes: string[] = [];
  if (i.revenueGrowth != null) {
    parts.push(scale(i.revenueGrowth, -0.2, 0.3));
    notes.push(`revenue ${i.revenueGrowth >= 0 ? "+" : ""}${(i.revenueGrowth * 100).toFixed(0)}%`);
  }
  if (i.earningsGrowth != null) {
    parts.push(scale(i.earningsGrowth, -0.3, 0.5));
    notes.push(`earnings ${i.earningsGrowth >= 0 ? "+" : ""}${(i.earningsGrowth * 100).toFixed(0)}%`);
  }
  if (parts.length === 0) return { score: null, notes: ["growth trend unavailable"] };
  return { score: clamp(avg(parts)), notes };
}

function market(i: StockInputs): FactorResult {
  const parts: number[] = [];
  const notes: string[] = [];
  if (i.momentum12m != null) {
    parts.push(scale(i.momentum12m, -0.3, 0.6));
    notes.push(`12m ${i.momentum12m >= 0 ? "+" : ""}${(i.momentum12m * 100).toFixed(0)}%`);
  }
  if (i.momentum3m != null) parts.push(scale(i.momentum3m, -0.2, 0.4));
  if (i.volatility != null) {
    parts.push(scaleInv(i.volatility, 0.2, 0.9));
    if (i.volatility > 0.6) notes.push("volatile price history");
  }
  if (i.avgDailyValueKobo != null) parts.push(scale(Math.log10(i.avgDailyValueKobo), 6, 9.5));
  if (parts.length === 0) return { score: null, notes: ["price history unavailable"] };
  return { score: clamp(avg(parts)), notes };
}

function dividend(i: StockInputs): FactorResult {
  const notes: string[] = [];
  // A missing dividend row means "not known", not "pays nothing".
  if (i.dividendYield == null) {
    if (i.dividendDataAvailable === false) return { score: 15, notes: ["no dividend declared"] };
    return { score: null, notes: ["dividend data unavailable"] };
  }
  if (i.dividendYield <= 0) return { score: 15, notes: ["no dividend"] };
  const parts = [clamp(Math.min(100, (i.dividendYield / 0.12) * 100))];
  notes.push(`yield ${(i.dividendYield * 100).toFixed(1)}%`);
  if (i.payoutRatio != null) parts.push(i.payoutRatio <= 0.6 ? 90 : scaleInv(i.payoutRatio, 0.6, 1));
  return { score: clamp(avg(parts)), notes };
}

function riskInverse(i: StockInputs): FactorResult {
  const parts: number[] = [];
  const notes: string[] = [];
  if (i.debtToEquity != null) {
    parts.push(scaleInv(i.debtToEquity, 0, 2.5));
    if (i.debtToEquity > 1.5) notes.push("balance-sheet leverage");
  }
  if (i.volatility != null) {
    parts.push(scaleInv(i.volatility, 0.15, 1));
    if (i.volatility > 0.7) notes.push("sharp price swings");
  }
  if (i.avgDailyValueKobo != null) {
    if (i.avgDailyValueKobo < 5e8) {
      parts.push(35);
      notes.push("thin trading, so it is hard to exit fast");
    } else parts.push(75);
  }
  if (i.payoutRatio != null && i.payoutRatio > G.payoutCap) {
    parts.push(30);
    notes.push("dividend may be cut");
  }
  if (i.speculativeFlag) {
    parts.push(35);
    notes.push("speculative category");
  }
  if (parts.length === 0) return { score: null, notes: ["risk data unavailable"] };
  return { score: clamp(avg(parts)), notes };
}

const FACTOR_LABELS: Record<keyof FactorScores, string> = {
  fundamental: "fundamentals",
  valuation: "valuation",
  growth: "growth",
  market: "market trend",
  dividend: "dividends",
  riskInverse: "risk",
};

function availableCount(factors: FactorScores): number {
  return Object.values(factors).filter((v) => v != null).length;
}

function confidenceFor(i: StockInputs, cov: number, factors: FactorScores): Confidence {
  if (cov < G.maxConfidenceWhenCoverageBelow) return cov < 0.35 ? "low" : "med";
  const vals = Object.values(factors).filter((v): v is number => v != null);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  if (sd > 25) return "med";
  if (i.financialsAgeMonths != null && i.financialsAgeMonths > 24) return "low";
  if (i.financialsAgeMonths != null && i.financialsAgeMonths > 15) return "med";
  return cov >= 0.8 ? "high" : "med";
}

/** Weighted mean over the factors we actually have data for. */
function combine(factors: FactorScores, divW: number): number | null {
  const weights: Record<keyof FactorScores, number> = {
    fundamental: W.fundamental,
    valuation: W.valuation,
    growth: W.growth,
    market: W.market,
    dividend: divW,
    riskInverse: W.riskInverse,
  };
  let num = 0;
  let den = 0;
  for (const key of Object.keys(weights) as Array<keyof FactorScores>) {
    const value = factors[key];
    if (value == null) continue;
    num += value * weights[key];
    den += weights[key];
  }
  return den > 0 ? clamp(num / den) : null;
}

export function scoreStock(i: StockInputs): ScoreResult {
  const f = fundamental(i);
  const v = valuation(i);
  const g = growth(i);
  const m = market(i);
  const d = dividend(i);
  const r = riskInverse(i);
  const factors: FactorScores = {
    fundamental: f.score,
    valuation: v.score,
    growth: g.score,
    market: m.score,
    dividend: d.score,
    riskInverse: r.score,
  };

  const divW = i.objective === "income" || i.objective === "dividend" ? engine.dividendWeightIncomeObjective : W.dividend;
  const cov = availableCount(factors) / 6;
  // Below this, an "overall score" would be built from too little to be honest.
  const MIN_COVERAGE = 0.35;
  const score = cov < MIN_COVERAGE ? null : combine(factors, divW);

  const confidence = confidenceFor(i, cov, factors);
  const blocked = (i.speculativeFlag === true && (i.volatility ?? 0) > 0.6) || (i.payoutRatio ?? 0) > 1;

  let action: Action;
  if (score == null) action = "NO_SIGNAL";
  else if (score >= T.buy && v.score != null && v.score >= G.buyRequiresValuationMin && confidence !== "low" && !blocked) action = "BUY";
  else if (score >= T.watch && !blocked) action = "WATCH";
  else if (score >= T.hold || (f.score != null && f.score >= 70 && v.score != null && v.score < 40)) action = "HOLD";
  else if (score >= T.sell) action = "HOLD";
  else action = "SELL";
  // Good company, wrong price.
  if (action === "BUY" && f.score != null && f.score >= 70 && v.score != null && v.score < 40) action = "HOLD";

  const all = (Object.keys(factors) as Array<keyof FactorScores>).map((key) => ({
    key,
    n: FACTOR_LABELS[key],
    s: factors[key],
    notes:
      key === "fundamental"
        ? f.notes
        : key === "valuation"
          ? v.notes
          : key === "growth"
            ? g.notes
            : key === "market"
              ? m.notes
              : key === "dividend"
                ? d.notes
                : r.notes,
  }));
  const scored = all.filter((p): p is typeof p & { s: number } => p.s != null).sort((a, b) => b.s - a.s);
  const unavailable = all.filter((p) => p.s == null).map((p) => p.n);

  const why = scored.slice(0, 3).map((p) => `${p.n[0]!.toUpperCase()}${p.n.slice(1)} ${p.notes[0] ?? "steady"}`);
  const worst = [...scored].sort((a, b) => a.s - b.s)[0];
  const keyRisk = !worst
    ? "Not enough data to rate this stock honestly."
    : !worst.notes[0]
      ? `${worst.n} looks stretched`
      : `${worst.n}: ${worst.notes[0]}`;
  const whyNow = v.notes[0] ?? (m.notes[0] ? `Market is moving (${m.notes[0]}).` : "Current price versus history.");
  const contradictory = `What argues against: ${keyRisk}.`;
  const whatWouldChange =
    action === "BUY"
      ? "A sharp price jump or weaker earnings would move this to HOLD."
      : action === "SELL"
        ? "Cheaper valuation plus steadier earnings would be needed for WATCH."
        : action === "NO_SIGNAL"
          ? "Audited financial statements and a dividend record would make this rateable."
          : "A better price or stronger earnings trend would move this to BUY.";

  return {
    ticker: i.ticker,
    score,
    confidence,
    action,
    factors,
    unavailable,
    why,
    keyRisk,
    whyNow,
    contradictory,
    whatWouldChange,
    engineVersion: ENGINE_VERSION,
  };
}
