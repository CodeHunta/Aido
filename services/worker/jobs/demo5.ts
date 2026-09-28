// Phase 5 demo — two sample investors, personal picks + portfolio check.
// Run: pnpm --filter @aido/worker demo:phase5
import { eq } from "drizzle-orm";
import {
  db,
  dividends,
  investorProfiles,
  portfolios,
  pricesDaily,
  recommendations,
  stocks,
} from "@aido/db";
import { analyzePortfolio, impactOfBuy, suitFor } from "@aido/scoring";
import type { InvestorTraits } from "@aido/scoring/suitability.js";

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

async function traits(ticker: string) {
  const s = (await db.select().from(stocks).where(eq(stocks.ticker, ticker)))[0]!;
  const px = await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ticker)).orderBy(pricesDaily.date);
  const closes = px.map((p) => p.closeKobo ?? 0).filter((c) => c > 0);
  const rets: number[] = [];
  for (let k = 1; k < closes.length; k++) rets.push(closes[k]! / closes[k - 1]! - 1);
  const divs = await db.select().from(dividends).where(eq(dividends.ticker, ticker));
  const last = closes[closes.length - 1] ?? null;
  return {
    sector: s.sector,
    close: last,
    volatility: rets.length > 5 ? stdev(rets) * Math.sqrt(252) : null,
    avgDailyValueKobo:
      closes.length > 0 ? px.reduce((a, p, k) => a + Number(p.volume ?? 0) * (closes[k] ?? 0), 0) / px.length : null,
    categories: s.categories,
    dividendYield: divs[0]?.dpsKobo && last ? divs[0].dpsKobo / last : null,
  };
}

async function personalTop(profile: InvestorTraits, limit: number) {
  const recs = await db.select().from(recommendations);
  const out: { ticker: string; score: number; action: string; level: string; reason: string }[] = [];
  for (const r of recs) {
    const t = await traits(r.ticker);
    const s = suitFor(profile, t);
    out.push({ ticker: r.ticker, score: r.score, action: r.action ?? "?", level: s.level, reason: s.reasons[0] ?? "" });
  }
  const personal = out.filter((o) => o.level !== "low").sort((a, b) => b.score - a.score).slice(0, limit);
  const outside = out.filter((o) => o.level === "low").sort((a, b) => b.score - a.score).slice(0, 2);
  return { personal, outside };
}

async function main() {
  const profiles: { id: string; traits: InvestorTraits; label: string }[] = [
    { id: "demo-moderate", traits: { risk: "moderate", horizon: "long", objective: "growth" }, label: "Moderate / Long / Growth" },
    { id: "demo-conservative", traits: { risk: "conservative", horizon: "short", objective: "income" }, label: "Conservative / Short / Income" },
  ];
  for (const p of profiles) {
    await db.insert(investorProfiles).values({ userId: p.id, ...p.traits, capitalKobo: 250000000 }).onConflictDoNothing();
    console.log(`\n=== ${p.label} ===`);
    const { personal, outside } = await personalTop(p.traits, 5);
    console.log("Your picks (fit you):");
    for (const o of personal) console.log(`  ${o.ticker} score=${o.score} ${o.action} fit=${o.level} — ${o.reason}`);
    console.log("Outside Your Profile (good but not for you):");
    for (const o of outside) console.log(`  ${o.ticker} score=${o.score} ${o.action} — ${o.reason}`);
  }

  // Portfolio demo for the moderate investor
  await db.insert(portfolios).values({ userId: "demo-moderate", ticker: "GTCO", qty: 1000, avgCostKobo: 4000 }).onConflictDoNothing();
  await db.insert(portfolios).values({ userId: "demo-moderate", ticker: "DANGCEM", qty: 200, avgCostKobo: 60000 }).onConflictDoNothing();
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, "demo-moderate"));
  const inputs = [];
  for (const h of held) {
    const t = await traits(h.ticker);
    inputs.push({ ticker: h.ticker, qty: Number(h.qty), avgCostKobo: Number(h.avgCostKobo), priceKobo: t.close ?? 0, sector: t.sector, dividendYield: t.dividendYield });
  }
  const a = analyzePortfolio(inputs);
  console.log(`\nPortfolio: value=₦${(a.valueKobo / 100).toLocaleString()} pnl=${(a.pnlPct * 100).toFixed(1)}% divYield=${(a.dividendYield * 100).toFixed(1)}%`);
  console.log(`Allocation: ${a.allocation.map((s) => `${s.key} ${(s.weight * 100).toFixed(0)}%`).join(" · ")}`);
  console.log(`Weaknesses: ${a.weaknesses.length ? a.weaknesses.join("; ") : "none"}`);
  const top = (await personalTop(profiles[0]!.traits, 1)).personal[0]!;
  const ct = await traits(top.ticker);
  const impact = impactOfBuy(inputs, { ticker: top.ticker, sector: ct.sector, priceKobo: ct.close ?? 0, spendKobo: 50000000 });
  console.log(`If you add ${top.ticker} with ₦500,000: ${impact.line}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
