// Shared input/output shapes for the Aido Score engine.
// All money in kobo integers. Scores are 0-100 integers.

export type Action = "BUY" | "HOLD" | "SELL" | "WATCH" | "NO_SIGNAL";
export type Confidence = "high" | "med" | "low";
export type Objective = "growth" | "dividend" | "preservation" | "income" | "combination";

export interface StockInputs {
  ticker: string;
  // valuation
  pe: number | null; // trailing P/E
  peerMedianPe: number | null;
  historyMedianPe: number | null;
  dividendYield: number | null; // 0.078 = 7.8%
  // True only when a dividend record was actually found. A null yield means
  // "we do not know", not "the company pays nothing".
  dividendDataAvailable?: boolean;
  // fundamentals (latest FY)
  roe: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  payoutRatio: number | null;
  fcfPositive: boolean | null;
  financialsAgeMonths: number | null;
  // growth (null when only one period exists, so the engine degrades honestly)
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  // market (12m daily closes + volumes)
  momentum3m: number | null;
  momentum12m: number | null;
  volatility: number | null; // annualized stdev of daily returns
  avgDailyValueKobo: number | null;
  // context
  objective?: Objective;
  speculativeFlag?: boolean;
}

export interface FactorScores {
  // null = not enough data to score this factor. Never substitute a neutral 50.
  fundamental: number | null;
  valuation: number | null;
  growth: number | null;
  market: number | null;
  dividend: number | null;
  riskInverse: number | null;
}

export interface ScoreResult {
  ticker: string;
  // null when no factor could be scored at all.
  score: number | null;
  confidence: Confidence;
  action: Action;
  factors: FactorScores;
  // Factor names with no usable data, for honest display.
  unavailable: string[];
  why: string[];
  keyRisk: string;
  whyNow: string;
  contradictory: string;
  whatWouldChange: string;
  engineVersion: string;
}
