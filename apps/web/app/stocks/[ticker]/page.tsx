import { desc, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { recommendations, watchlists } from "@aido/db/schema";
import { getFinancial, getProfile, getThesis, getTraits, recentPrices } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { WatchButton } from "../../_actions"; import { currentUserId } from "../../lib/session";
import { ActionBadge, Card, ScoreRing, naira } from "../../_ui";
import { DataHonesty, Tip } from "../../_glossary";
import { Nav } from "../../_nav";

export const dynamic = "force-dynamic";
const USER = await currentUserId();

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return <main style={{ padding: 24 }}>Unknown stock {ticker}. <a href="/discover">Back</a></main>;
  const profile = await getProfile(USER);
  const suitability = profile
    ? suitFor({ risk: profile.risk, horizon: profile.horizon, objective: profile.objective }, { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield })
    : null;
  const [fin, thesis, prices] = await Promise.all([getFinancial(ticker), getThesis(ticker), recentPrices(ticker, 30)]);
  const history = await db.select().from(recommendations).where(eq(recommendations.ticker, ticker)).orderBy(desc(recommendations.asOf)).limit(10);
  const watched = (await db.select().from(watchlists).where(eq(watchlists.userId, USER))).some((w) => w.ticker === ticker);
  const max = Math.max(...prices.map((p) => p.closeKobo ?? 0), 1);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{t.name} <span style={{ color: "var(--muted)", fontSize: 16 }}>{t.ticker}</span></h1>
        <WatchButton ticker={ticker} watched={watched} userId={USER} />
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>{t.sector} · {t.categories.join(" · ")}</p>
      <DataHonesty source={t.source} asOf={t.asOf} />
      <Card>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <ScoreRing score={t.score} />
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Score <Tip term="score" /></div>
          </div>
          <div>
            <ActionBadge action={t.action} /> <Tip term={t.action ?? "NO_SIGNAL"} /> <span style={{ fontSize: 13, color: "var(--muted)" }}>Confidence: <strong>{t.confidence}</strong><Tip term="confidence" /></span>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{naira(t.closeKobo)} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}><Tip term="price" /></span></div>
            <div style={{ marginTop: 4 }}><span style={{ padding: "2px 10px", borderRadius: 999, background: suitability?.level === "low" ? "#e2e8f0" : "#dcfce7", fontSize: 12, fontWeight: 700 }}>Suitability: {suitability?.level === "low" ? "Outside Your Profile" : (suitability?.level ?? "Not checked yet")}</span><Tip term="suitability" /></div>
          </div>
        </div>
        {thesis && (
          <>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Why Aido thinks so</h3>
            <ul>{thesis.why.map((w: string) => <li key={w}>{w}</li>)}</ul>
            <p style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12 }}><strong>Key risk:</strong> {thesis.keyRisk}</p>
          </>
        )}
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 16 }}>
        <Card>
          <h3>Price: last 30 sessions</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
            {prices.map((p) => <div key={p.date} title={`${p.date}: ${naira(p.closeKobo)}`} style={{ flex: 1, background: "#2563eb", height: `${Math.max(4, ((p.closeKobo ?? 0) / max) * 80)}px` }} />)}
          </div>
        </Card>
        <Card>
          <h3>Numbers <span style={{ fontWeight: 400, fontSize: 12, color: "var(--muted)" }}>(tap ? for plain meaning)</span> <span style={{ fontSize: 11, fontWeight: 800, background: "#fef3c7", borderRadius: 999, padding: "2px 8px" }}>EXAMPLE</span></h3>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Company profits, debts and dividends are still examples. Price above is {t.source === "ngx-delayed" ? "real NGX (delayed)" : "also an example"}.</p>
          <table className="tbl"><colgroup><col style={{ width: "50%" }} /><col style={{ width: "50%" }} /></colgroup><tbody>
            <tr><td>ROE <Tip term="roe" /></td><td className="num">{fin?.roe != null ? `${(Number(fin.roe) * 100).toFixed(1)}%` : "No data"}</td></tr>
            <tr><td>Margin <Tip term="margin" /></td><td className="num">{fin?.profitMargin != null ? `${(Number(fin.profitMargin) * 100).toFixed(1)}%` : "No data"}</td></tr>
            <tr><td>D/E <Tip term="debt" /></td><td className="num">{fin?.debtToEquity ?? "No data"}</td></tr>
            <tr><td>Dividend yield <Tip term="yield" /></td><td className="num">{t.dividendYield != null ? `${(t.dividendYield * 100).toFixed(1)}%` : "No data"}</td></tr>
            <tr><td>Volatility <Tip term="volatility" /></td><td className="num">{t.volatility != null ? `${(t.volatility * 100).toFixed(0)}%` : "No data"}</td></tr>
          </tbody></table>
        </Card>
        <Card>
          <h3>Full thesis</h3>
          {thesis ? (
            <ul style={{ fontSize: 14 }}>
              <li><strong>Now:</strong> {(thesis.thesis as { whyNow?: string })?.whyNow}</li>
              <li><strong>Against:</strong> {(thesis.thesis as { contradictory?: string })?.contradictory}</li>
              <li><strong>Changes if:</strong> {(thesis.thesis as { whatWouldChange?: string })?.whatWouldChange}</li>
              <li><strong>Engine:</strong> {thesis.engineVersion}</li>
            </ul>
          ) : <p>No thesis yet.</p>}
          {suitability && <p style={{ fontSize: 13 }}><strong>Why for you:</strong> {suitability.reasons.join("; ")}</p>}
        </Card>
      </div>
      <Card>
        <div style={{ marginTop: 8 }}>
          <h3>Recommendation history</h3>
          <div className="tbl-wrap">
          <table className="tbl"><colgroup><col style={{ width: "28%" }} /><col style={{ width: "26%" }} /><col style={{ width: "20%" }} /><col style={{ width: "26%" }} /></colgroup><thead><tr><th>Date</th><th>Action</th><th className="num">Score</th><th>Engine</th></tr></thead>
            <tbody>{history.map((h) => <tr key={h.id}><td className="num">{new Date(h.asOf).toLocaleDateString()}</td><td><ActionBadge action={h.action} /></td><td className="num">{h.score}</td><td>{h.engineVersion}</td></tr>)}</tbody>
          </table>
          </div>
        </div>
      </Card>
    </main>
  );
}
