import { getProfile, listTraits } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

// Live computation until the Sunday scheduler (Phase 7) persists weekly_picks.
export async function GET(req: Request) {
  const profile = await getProfile(await userOf(req));
  const scored: { ticker: string; score: number; action: string | null; level: string | null }[] = [];
  for (const t of await listTraits()) {
    if (t.score == null) continue;
    const s = profile
      ? suitFor(
          { risk: profile.risk, horizon: profile.horizon, objective: profile.objective },
          { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield },
        )
      : null;
    scored.push({ ticker: t.ticker, score: t.score, action: t.action, level: s?.level ?? null });
  }
  scored.sort((a, b) => b.score - a.score);
  const personal = scored.filter((s) => s.level !== "low").slice(0, 1)[0] ?? null;
  const market = scored[0] ?? null;
  return ok({ personal, market, generatedAt: new Date().toISOString() });
}
