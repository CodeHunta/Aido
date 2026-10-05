import { getProfile, listTraits } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { ActionBadge, Card, ScoreRing } from "../_ui"; import { currentUserId } from "../lib/session";
import { Nav } from "../_nav";

export const dynamic = "force-dynamic";
export default async function Picks() {
  const USER = await currentUserId();
  const profile = await getProfile(USER);
  const scored = [];
  for (const t of await listTraits()) {
    if (t.score == null) continue;
    const s = profile
      ? suitFor({ risk: profile.risk, horizon: profile.horizon, objective: profile.objective }, { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield })
      : null;
    scored.push({ ...t, level: s?.level ?? null, reason: s?.reasons[0] ?? "" });
  }
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const personal = scored.filter((s) => s.level !== "low")[0] ?? null;
  const market = scored[0] ?? null;
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Your Aido Pick</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>FOR YOU 🎯</div>
          {personal ? <div style={{ display: "flex", gap: 12, alignItems: "center" }}><ScoreRing score={personal.score} /><div><ActionBadge action={personal.action} /> <a href={`/stocks/${personal.ticker}`} style={{ fontWeight: 800 }}>{personal.ticker}</a><div style={{ fontSize: 13, color: "var(--muted)" }}>{personal.reason}</div>{market && personal.ticker === market.ticker ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Also the market's top pick this week — above is why it fits <em>you</em> specifically.</div> : null}</div></div> : <p>No strong opportunity this week.</p>}
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>MARKET PICK OF THE WEEK</div>
          {market ? <div style={{ display: "flex", gap: 12, alignItems: "center" }}><ScoreRing score={market.score} /><div><ActionBadge action={market.action} /> <a href={`/stocks/${market.ticker}`} style={{ fontWeight: 800 }}>{market.ticker}</a><div style={{ fontSize: 13, color: "var(--muted)" }}>One NGX stock worth watching.</div></div></div> : <p>—</p>}
        </Card>
      </div>
    </main>
  );
}
