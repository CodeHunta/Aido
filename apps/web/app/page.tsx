import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { portfolios, watchlists } from "@aido/db/schema";
import { getProfile, getTraits, listTickers } from "@aido/db/traits";
import { analyzePortfolio, suitFor } from "@aido/scoring";
import { ActionBadge, Card, ScoreRing, naira } from "./_ui";
import { currentUserId } from "./lib/session";
import { Nav } from "./_nav";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const USER = await currentUserId();
  const profile = await getProfile(USER);
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, USER));
  const watched = await db.select().from(watchlists).where(eq(watchlists.userId, USER));

  const inputs = [];
  for (const h of held) {
    const t = await getTraits(h.ticker);
    inputs.push({ ticker: h.ticker, qty: Number(h.qty), avgCostKobo: Number(h.avgCostKobo), priceKobo: t?.closeKobo ?? 0, sector: t?.sector ?? "", dividendYield: t?.dividendYield ?? null });
  }
  const analysis = analyzePortfolio(inputs);

  let personal: { ticker: string; score: number; action: string | null } | null = null;
  let market: { ticker: string; score: number; action: string | null } | null = null;
  for (const ticker of await listTickers()) {
    const t = await getTraits(ticker);
    if (!t || t.score == null) continue;
    if (!market || t.score > market.score) market = { ticker, score: t.score, action: t.action };
    if (!profile) continue;
    const s = suitFor(
      { risk: profile.risk, horizon: profile.horizon, objective: profile.objective },
      { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield },
    );
    if (s.level !== "low" && (!personal || t.score > personal.score)) personal = { ticker, score: t.score, action: t.action };
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "var(--muted)" }}>AIDO DASHBOARD</p>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "4px 0 16px" }}>Good morning, {USER}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <Card>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>PORTFOLIO</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 800 }}>{naira(analysis.valueKobo)} <span style={{ fontSize: 13, color: analysis.pnlKobo >= 0 ? "#16a34a" : "#dc2626" }}>{(analysis.pnlPct * 100).toFixed(1)}%</span></div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{held.length} holdings · {watched.length} watched</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>YOUR AIDO PICK</div>
          {personal ? <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}><ScoreRing score={personal.score} /><div><ActionBadge action={personal.action} /> <a href={`/stocks/${personal.ticker}`} style={{ fontWeight: 800 }}>{personal.ticker}</a></div></div> : <p>No strong opportunity this week.</p>}
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>MARKET PICK</div>
          {market ? <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}><ScoreRing score={market.score} /><div><ActionBadge action={market.action} /> <a href={`/stocks/${market.ticker}`} style={{ fontWeight: 800 }}>{market.ticker}</a></div></div> : <p>—</p>}
        </Card>
      </div>
      {held.length === 0 ? (
        <Card>
          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Welcome — let's set you up in 60 seconds</h3>
            <ol style={{ fontSize: 14 }}>
              <li><a href="/portfolio">Add a stock you own</a> (or one you're eyeing) — Aido values it live.</li>
              <li><a href="/watchlist">Watch</a> anything interesting from <a href="/explore">Explore</a>.</li>
              <li>Check back Sunday for <a href="/picks">your personal pick</a>.</li>
            </ol>
          </div>
        </Card>
      ) : analysis.weaknesses.length > 0 ? (
        <Card>
          <div style={{ marginTop: 16 }}><strong>Watch out:</strong><ul>{analysis.weaknesses.map((w) => <li key={w}>{w}</li>)}</ul></div>
        </Card>
      ) : null}
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>Profile: {profile ? `${profile.risk} · ${profile.horizon} · ${profile.objective}` : "none"} · <a href="/portfolio">Manage portfolio →</a></p>
    </main>
  );
}
