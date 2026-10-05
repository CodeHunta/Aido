import { getProfile, listTraits } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") ?? "score";
  const category = url.searchParams.get("category");
  const q = (url.searchParams.get("q") ?? "").toLowerCase();
  const profile = await getProfile(await userOf(req));

  const out = [];
  for (const t of await listTraits()) {
    if (category && !t.categories.includes(category)) continue;
    if (q && !t.ticker.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) continue;
    const s = profile
      ? suitFor(
          { risk: profile.risk, horizon: profile.horizon, objective: profile.objective },
          { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield },
        )
      : null;
    out.push({ ...t, factors: undefined, suitability: s?.level ?? null });
  }
  if (sort === "score") out.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (sort === "yield") out.sort((a, b) => (b.dividendYield ?? -1) - (a.dividendYield ?? -1));
  return out.length ? ok(out) : bad("No stocks match", 404);
}
