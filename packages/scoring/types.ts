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
  // fundamentals (latest FY)
  roe: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  payoutRatio: number | null;
  fcfPositive: boolean | null;
  financialsAgeMonths: number | null;
  // growth (null when only one period exists — engine degrades honestly)
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
  fundamental: number;
  valuation: number;
  growth: number;
  market: number;
  dividend: number;
  riskInverse: number;
}

export interface ScoreResult {
  ticker: string;
  score: number;
  confidence: Confidence;
  action: Action;
  factors: FactorScores;
  why: string[];
  keyRisk: string;
  whyNow: string;
  contradictory: string;
  whatWouldChange: string;
  engineVersion: string;
}
