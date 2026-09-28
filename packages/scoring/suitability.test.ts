import { describe, expect, it } from "vitest";
import { analyzePortfolio, impactOfBuy } from "./portfolio.js";
import { suitFor } from "./suitability.js";

const wild = { volatility: 0.85, avgDailyValueKobo: 1e9, categories: ["speculative"], dividendYield: null };
const steadyDiv = { volatility: 0.25, avgDailyValueKobo: 5e9, categories: ["large-cap", "dividend"], dividendYield: 0.07 };

describe("suitability", () => {
  it("rejects wild stocks for conservative short-term investors", () => {
    const r = suitFor({ risk: "conservative", horizon: "short", objective: "preservation" }, wild);
    expect(r.level).toBe("low");
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("welcomes steady dividend stocks for income investors", () => {
    const r = suitFor({ risk: "moderate", horizon: "long", objective: "income" }, steadyDiv);
    expect(r.level).toBe("high");
  });

  it("rejects non-payers for income goals", () => {
    const r = suitFor({ risk: "moderate", horizon: "long", objective: "income" }, { ...steadyDiv, dividendYield: null, categories: ["growth"] });
    expect(r.level).toBe("low");
  });

  it("keeps attractive-but-unsuitable visible (Outside Profile, not hidden)", () => {
    const r = suitFor({ risk: "conservative", horizon: "short", objective: "preservation" }, wild);
    // Caller shelves level==="low" under "Outside Your Profile" — engine never deletes it
    expect(r.level).toBe("low");
    expect(r.reasons.join(" ")).toMatch(/conservative|Short horizon|Capital safety/i);
  });

  it("gives aggressive long-term investors a wider field", () => {
    const aggressive = suitFor({ risk: "aggressive", horizon: "long", objective: "growth" }, wild);
    const conservative = suitFor({ risk: "conservative", horizon: "long", objective: "growth" }, wild);
    expect(["high", "med"]).toContain(aggressive.level);
    expect(conservative.level).toBe("low");
  });
});

describe("portfolio", () => {
  const holdings = [
    { ticker: "GTCO", qty: 1000, avgCostKobo: 4000, priceKobo: 5000, sector: "Financial Services", dividendYield: 0.07 },
    { ticker: "DANGCEM", qty: 200, avgCostKobo: 60000, priceKobo: 65000, sector: "Industrial Goods", dividendYield: 0.05 },
  ];

  it("adds up value and gains", () => {
    const a = analyzePortfolio(holdings);
    expect(a.valueKobo).toBe(1000 * 5000 + 200 * 65000);
    expect(a.pnlKobo).toBe(a.valueKobo - (1000 * 4000 + 200 * 60000));
    expect(a.allocation.reduce((t, s) => t + s.weight, 0)).toBeCloseTo(1);
  });

  it("flags a stock over 25%", () => {
    const a = analyzePortfolio([
      { ticker: "ONE", qty: 900, avgCostKobo: 100, priceKobo: 100, sector: "Banks", dividendYield: null },
      { ticker: "TWO", qty: 100, avgCostKobo: 100, priceKobo: 100, sector: "Banks", dividendYield: null },
    ]);
    expect(a.concentrationFlag).toBe(true);
    expect(a.weaknesses.join(" ")).toMatch(/25%/);
  });

  it("shows what a buy does to the mix", () => {
    const impact = impactOfBuy(holdings, { ticker: "ZENITH", sector: "Financial Services", priceKobo: 4000, spendKobo: 4000000 });
    expect(impact.line).toMatch(/Financial Services \d+% → \d+%/);
    expect(impact.sectorAfter).toBeGreaterThan(impact.sectorBefore);
  });
});
