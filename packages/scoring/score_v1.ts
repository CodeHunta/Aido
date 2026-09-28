import engine from "./engine_v1.json";
import type { Action, Confidence, FactorScores, ScoreResult, StockInputs } from "./types.js";

export const ENGINE_VERSION = "v1";
const W = engine.weights;
const T = engine.thresholds;
const G = engine.gates;

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, Math.round(n)));
// Higher value → higher score between lo and hi
const scale = (v: number, lo: number, hi: number) => clamp(((v - lo) / (hi - lo)) * 100);
// Lower value → higher score between lo (good) and hi (bad)
const scaleInv = (v: number, lo: number, hi: number) => clamp(((hi - v) / (hi - lo)) * 100);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 50);

function fundamental(i: StockInputs): { score: number; notes: string[] } {
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
  return { score: clamp(avg(parts)), notes };
}

function valuation(i: StockInputs): { score: number; notes: string[] } {
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
  return { score: clamp(avg(parts)), notes };
}

function growth(i: StockInputs): { score: number; notes: string[] } {
  if (i.revenueGrowth == null && i.earningsGrowth == null)
    return { score: 50, notes: ["growth trend not yet available"] };
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
  return { score: clamp(avg(parts)), notes };
}

function market(i: StockInputs): { score: number; notes: string[] } {
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
  return { score: clamp(avg(parts)), notes };
}

function dividend(i: StockInputs): { score: number; notes: string[] } {
  const notes: string[] = [];
  if (i.dividendYield == null || i.dividendYield <= 0) return { score: 15, notes: ["no dividend"] };
  const parts = [clamp(Math.min(100, (i.dividendYield / 0.12) * 100))];
  notes.push(`yield ${(i.dividendYield * 100).toFixed(1)}%`);
  if (i.payoutRatio != null) parts.push(i.payoutRatio <= 0.6 ? 90 : scaleInv(i.payoutRatio, 0.6, 1));
  return { score: clamp(avg(parts)), notes };
}

function riskInverse(i: StockInputs): { score: number; notes: string[] } {
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
  if (i.avgDailyValueKobo != null && i.avgDailyValueKobo < 5e8) {
    parts.push(35);
    notes.push("thin trading — hard to exit fast");
  } else parts.push(75);
  if (i.payoutRatio != null && i.payoutRatio > G.payoutCap) {
    parts.push(30);
    notes.push("dividend may be cut");
  }
  if (i.speculativeFlag) {
    parts.push(35);
    notes.push("speculative category");
  }
  return { score: clamp(avg(parts)), notes };
}

function coverage(i: StockInputs): number {
  const keys = [i.pe, i.roe, i.profitMargin, i.debtToEquity, i.momentum12m, i.volatility, i.revenueGrowth ?? i.earningsGrowth];
  return keys.filter((v) => v != null).length / keys.length;
}

function confidenceFor(i: StockInputs, factors: FactorScores, cov: number): Confidence {
  if (cov < G.maxConfidenceWhenCoverageBelow) return cov < 0.35 ? "low" : "med";
  const vals = [factors.fundamental, factors.valuation, factors.growth, factors.market, factors.dividend, factors.riskInverse];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
  if (sd > 25) return "med";
  if (i.financialsAgeMonths != null && i.financialsAgeMonths > 15) return "med";
  return cov >= 0.8 ? "high" : "med";
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
  const rest = 1 - W.dividend;
  const wSum =
    factors.fundamental * W.fundamental +
    factors.valuation * W.valuation +
    factors.growth * W.growth +
    factors.market * W.market +
    factors.riskInverse * W.riskInverse;
  const score = clamp((wSum / rest) * (1 - divW) + factors.dividend * divW);

  const cov = coverage(i);
  const confidence = confidenceFor(i, factors, cov);
  const blocked = (i.speculativeFlag && (i.volatility ?? 0) > 0.6) || (i.payoutRatio ?? 0) > 1;

  let action: Action;
  if (cov < 0.35) action = "NO_SIGNAL";
  else if (score >= T.buy && v.score >= G.buyRequiresValuationMin && confidence !== "low" && !blocked) action = "BUY";
  else if (score >= T.watch && !blocked) action = "WATCH";
  else if (score >= T.hold || (f.score >= 70 && v.score < 40)) action = "HOLD";
  else if (score >= T.sell) action = "HOLD";
  else action = "SELL";
  if (action === "BUY" && f.score >= 70 && v.score < 40) action = "HOLD"; // good company, wrong price

  const ranked = [
    { n: "fundamentals", s: f.score, notes: f.notes },
    { n: "valuation", s: v.score, notes: v.notes },
    { n: "growth", s: g.score, notes: g.notes },
    { n: "market trend", s: m.score, notes: m.notes },
    { n: "dividends", s: d.score, notes: d.notes },
  ].sort((a, b) => b.s - a.s);
  const why = ranked.slice(0, 3).map((p) => `${p.n[0]!.toUpperCase()}${p.n.slice(1)} ${p.notes[0] ?? "steady"}`);
  const worst = [...ranked].sort((a, b) => a.s - b.s)[0]!;
  const worstNote = worst.notes[0];
  const keyRisk = !worstNote
    ? `${worst.n} looks stretched`
    : worstNote.includes("not yet available")
      ? `Limited data — ${worstNote}`
      : `${worst.n}: ${worstNote}`;
  const whyNow =
    v.notes[0] ?? (m.notes[0] ? `Market is moving (${m.notes[0]}).` : "Current price versus history.");
  const contradictory = `What argues against: ${keyRisk}.`;
  const whatWouldChange =
    action === "BUY"
      ? "A sharp price jump or weaker earnings would move this to HOLD."
      : action === "SELL"
        ? "Cheaper valuation plus steadier earnings would be needed for WATCH."
        : "A better price or stronger earnings trend would move this to BUY.";

  return {
    ticker: i.ticker,
    score,
    confidence,
    action,
    factors,
    why,
    keyRisk,
    whyNow,
    contradictory,
    whatWouldChange,
    engineVersion: ENGINE_VERSION,
  };
}
