import { describe, expect, it } from "vitest";
import { scoreStock } from "./score_v1";
import type { StockInputs } from "./types";

const base: StockInputs = {
  ticker: "TEST",
  pe: 7,
  peerMedianPe: 9,
  historyMedianPe: 8,
  dividendYield: 0.06,
  roe: 0.22,
  profitMargin: 0.25,
  debtToEquity: 0.4,
  payoutRatio: 0.45,
  fcfPositive: true,
  financialsAgeMonths: 6,
  revenueGrowth: 0.12,
  earningsGrowth: 0.18,
  momentum3m: 0.08,
  momentum12m: 0.25,
  volatility: 0.3,
  avgDailyValueKobo: 2e9,
};

describe("scoreStock core", () => {
  it("scores a quality stock at a fair price as BUY or WATCH with high/med confidence", () => {
    const r = scoreStock(base);
    expect(["BUY", "WATCH"]).toContain(r.action);
    expect(["high", "med"]).toContain(r.confidence);
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeGreaterThanOrEqual(65);
    expect(r.why).toHaveLength(3);
    expect(r.keyRisk.length).toBeGreaterThan(0);
  });

  it("caps a great company at HOLD when the price is too high (PRD price matters)", () => {
    const r = scoreStock({ ...base, pe: 30, historyMedianPe: 12, peerMedianPe: 14 });
    expect(r.action).not.toBe("BUY");
    expect(["HOLD", "WATCH"]).toContain(r.action);
  });

  it("rewards a cheap improving company with BUY (value can win)", () => {
    const r = scoreStock({
      ...base,
      pe: 4.5,
      historyMedianPe: 8,
      peerMedianPe: 9,
      roe: 0.16,
      earningsGrowth: 0.3,
      revenueGrowth: 0.2,
    });
    expect(r.action).toBe("BUY");
  });

  it("caps confidence when data is thin", () => {
    const r = scoreStock({
      ticker: "THIN",
      pe: null,
      peerMedianPe: null,
      historyMedianPe: null,
      dividendYield: null,
      roe: null,
      profitMargin: null,
      debtToEquity: null,
      payoutRatio: null,
      fcfPositive: null,
      financialsAgeMonths: 30,
      revenueGrowth: null,
      earningsGrowth: null,
      momentum3m: 0.05,
      momentum12m: 0.1,
      volatility: 0.4,
      avgDailyValueKobo: 1e9,
    });
    expect(r.confidence).not.toBe("high");
    expect(r.action).not.toBe("BUY");
  });

  it("says NO_SIGNAL when almost nothing is known", () => {
    const r = scoreStock({
      ticker: "EMPTY",
      pe: null,
      peerMedianPe: null,
      historyMedianPe: null,
      dividendYield: null,
      roe: null,
      profitMargin: null,
      debtToEquity: null,
      payoutRatio: null,
      fcfPositive: null,
      financialsAgeMonths: null,
      revenueGrowth: null,
      earningsGrowth: null,
      momentum3m: null,
      momentum12m: null,
      volatility: null,
      avgDailyValueKobo: null,
    });
    expect(r.action).toBe("NO_SIGNAL");
    expect(r.confidence).toBe("low");
  });

  it("flags stretched payout as the key risk", () => {
    const r = scoreStock({ ...base, payoutRatio: 0.95 });
    expect(r.keyRisk.toLowerCase()).toMatch(/payout|dividend/);
  });

  it("blocks BUY for speculative stocks with wild prices", () => {
    const r = scoreStock({ ...base, speculativeFlag: true, volatility: 0.85 });
    expect(r.action).not.toBe("BUY");
  });

  it("marks missing data unavailable instead of inventing a neutral score", () => {
    const r = scoreStock({ ...base, dividendYield: null, payoutRatio: null });
    expect(r.factors.dividend).toBeNull();
    expect(r.unavailable).toContain("dividends");
    // Growth and valuation still work from the data that exists.
    expect(r.score).not.toBeNull();
    expect(r.factors.growth).not.toBeNull();
  });

  it("renormalises over available factors when growth is unknown", () => {
    const r = scoreStock({ ...base, revenueGrowth: null, earningsGrowth: null });
    expect(r.factors.growth).toBeNull();
    expect(r.unavailable).toContain("growth");
    expect(r.score).not.toBeNull();
  });

  it("distinguishes an unknown dividend from a company that pays none", () => {
    const unknown = scoreStock({ ...base, dividendYield: null, payoutRatio: null });
    const none = scoreStock({ ...base, dividendYield: 0, payoutRatio: null });
    const checkedNone = scoreStock({ ...base, dividendYield: null, payoutRatio: null, dividendDataAvailable: false });
    expect(unknown.factors.dividend).toBeNull();
    expect(none.factors.dividend).toBe(15);
    expect(checkedNone.factors.dividend).toBe(15);
  });

  it("keeps every score inside 0-100", () => {
    const r = scoreStock({ ...base, pe: 100, roe: -0.2, volatility: 2, momentum12m: -0.8 });
    expect(r.score).not.toBeNull();
    expect(r.score!).toBeGreaterThanOrEqual(0);
    expect(r.score!).toBeLessThanOrEqual(100);
  });

  it("downgrades stale financials to med confidence", () => {
    const r = scoreStock({ ...base, financialsAgeMonths: 20 });
    expect(r.confidence).not.toBe("high");
  });

  it("sells clear losers", () => {
    const r = scoreStock({
      ...base,
      pe: 28,
      roe: 0.02,
      profitMargin: 0.01,
      debtToEquity: 2.2,
      payoutRatio: 0.95,
      fcfPositive: false,
      revenueGrowth: -0.25,
      earningsGrowth: -0.4,
      momentum12m: -0.5,
      volatility: 0.8,
    });
    expect(["SELL", "HOLD"]).toContain(r.action);
  });

  it("always explains itself", () => {
    const r = scoreStock(base);
    expect(r.whyNow.length).toBeGreaterThan(0);
    expect(r.contradictory.length).toBeGreaterThan(0);
    expect(r.whatWouldChange.length).toBeGreaterThan(0);
    expect(r.engineVersion).toBe("v1");
  });
});
