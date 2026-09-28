// Personal suitability: is this stock right for THIS investor?
// Kept separate from the Aido Score on purpose (PRD: Opportunity != Suitability).
// Pure function — easy to test, used by the API on the fly.

export type Suitability = "high" | "med" | "low";

export interface InvestorTraits {
  risk: "conservative" | "moderate" | "aggressive";
  horizon: "short" | "medium" | "long";
  objective: "growth" | "dividend" | "preservation" | "income" | "combination";
}

export interface StockTraits {
  volatility: number | null; // annualized
  avgDailyValueKobo: number | null;
  categories: string[];
  dividendYield: number | null;
  maxDrawdown?: number | null;
}

export interface SuitabilityResult {
  level: Suitability;
  reasons: string[];
}

const THIN_MARKET_KOBO = 5e8; // below this, hard to exit fast

export function suitFor(inv: InvestorTraits, s: StockTraits): SuitabilityResult {
  const hits: string[] = [];
  let level: Suitability = "high";

  const demote = (to: Suitability, reason: string) => {
    if (to === "low" || level === "high") level = to;
    hits.push(reason);
  };

  const volatile = (s.volatility ?? 0) > 0.6;
  const thin = (s.avgDailyValueKobo ?? Infinity) < THIN_MARKET_KOBO;
  const speculative = s.categories.some((c) => c === "speculative" || c === "high-risk");
  const turnaround = s.categories.includes("turnaround");
  const paysDiv = (s.dividendYield ?? 0) > 0.01;

  if (inv.risk === "conservative" && (volatile || speculative)) {
    demote("low", "Price swings too wild for a conservative profile");
  } else if (inv.risk === "conservative" && turnaround) {
    demote("med", "Turnaround stories need patience a conservative profile may lack");
  }
  if (inv.risk === "moderate" && speculative && volatile) {
    demote("med", "Speculative + volatile is a stretch for moderate risk");
  }
  if (inv.horizon === "short" && (thin || volatile)) {
    demote("low", "Short horizon needs easy-to-sell, steady stocks");
  } else if (inv.horizon === "short" && turnaround) {
    demote("med", "Turnarounds rarely pay off in a short time");
  }
  if ((inv.objective === "income" || inv.objective === "dividend") && !paysDiv) {
    demote("low", "Pays no meaningful dividend for an income goal");
  }
  if (inv.objective === "preservation" && (volatile || speculative || thin)) {
    demote("low", "Capital safety comes first — this risks it");
  }
  if (inv.objective === "growth" && turnaround && inv.risk !== "aggressive") {
    demote("med", "Growth goal, but this one is still proving itself");
  }
  if (level === "high") hits.push("Fits risk, horizon and goal");

  return { level, reasons: hits };
}
