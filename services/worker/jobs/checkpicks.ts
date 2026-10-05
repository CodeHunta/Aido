import { listTraits } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import type { InvestorTraits } from "@aido/scoring/suitability";

const profiles: { label: string; traits: InvestorTraits }[] = [
  { label: "aggressive/long/growth", traits: { risk: "aggressive", horizon: "long", objective: "growth" } },
  { label: "conservative/short/income", traits: { risk: "conservative", horizon: "short", objective: "income" } },
  { label: "moderate/medium/combination", traits: { risk: "moderate", horizon: "medium", objective: "combination" } },
  { label: "conservative/long/preservation", traits: { risk: "conservative", horizon: "long", objective: "preservation" } },
];

async function main() {
  const all = (await listTraits()).filter((t) => t.score != null).sort((a, b) => b.score! - a.score!);
  for (const p of profiles) {
    const ranked = all.map((t) => {
      const s = suitFor(p.traits, { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield });
      return { ticker: t.ticker, score: t.score!, level: s.level, reason: s.reasons[0] ?? "" };
    });
    const personal = ranked.filter((r) => r.level !== "low")[0];
    const top3 = ranked.filter((r) => r.level !== "low").slice(0, 3).map((r) => `${r.ticker}(${r.score}/${r.level})`).join(", ");
    console.log(`${p.label}: personal=${personal?.ticker} ${personal?.score} (${personal?.reason}) | top3: ${top3}`);
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
