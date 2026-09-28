import { eq } from "drizzle-orm";
import { db } from "@aido/db";
import { watchlists } from "@aido/db/schema";
import { getFinancial, getProfile, getThesis, getTraits, recentPrices } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { WatchButton } from "../../_actions";
import { ActionBadge, Card, Nav, ScoreRing, naira } from "../../_ui";

export const dynamic = "force-dynamic";
const USER = "demo-moderate";

export default async function StockPage({ params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return <main style={{ padding: 24 }}>Unknown stock {ticker}. <a href="/discover">Back</a></main>;
  const profile = await getProfile(USER);
  const suitability = profile
    ? suitFor({ risk: profile.risk, horizon: profile.horizon, objective: profile.objective }, { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield })
    : null;
  const [fin, thesis, prices] = await Promise.all([getFinancial(ticker), getThesis(ticker), recentPrices(ticker, 30)]);
  const watched = (await db.select().from(watchlists).where(eq(watchlists.userId, USER))).some((w) => w.ticker === ticker);
  const max = Math.max(...prices.map((p) => p.closeKobo ?? 0), 1);

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{t.name} <span style={{ color: "var(--muted)", fontSize: 16 }}>{t.ticker}</span></h1>
        <WatchButton ticker={ticker} watched={watched} />
      </div>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>{t.sector} · {t.categories.join(" · ")} · Data as of {t.asOf}</p>
      <Card>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <ScoreRing score={t.score} />
          <div>
            <ActionBadge action={t.action} /> <span style={{ fontSize: 13, color: "var(--muted)" }}>Confidence: <strong>{t.confidence}</strong></span>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{naira(t.closeKobo)}</div>
            <div style={{ marginTop: 4 }}><span style={{ padding: "2px 10px", borderRadius: 999, background: suitability?.level === "low" ? "#e2e8f0" : "#dcfce7", fontSize: 12, fontWeight: 700 }}>Suitability: {suitability?.level === "low" ? "Outside Your Profile" : (suitability?.level ?? "—")}</span></div>
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
          <h3>Price — last 30 sessions</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
            {prices.map((p) => <div key={p.date} title={`${p.date}: ${naira(p.closeKobo)}`} style={{ flex: 1, background: "#2563eb", height: `${Math.max(4, ((p.closeKobo ?? 0) / max) * 80)}px` }} />)}
          </div>
        </Card>
        <Card>
          <h3>Numbers</h3>
          <table className="grid"><tbody>
            <tr><td>ROE</td><td className="num">{fin?.roe != null ? `${(Number(fin.roe) * 100).toFixed(1)}%` : "—"}</td></tr>
            <tr><td>Margin</td><td className="num">{fin?.profitMargin != null ? `${(Number(fin.profitMargin) * 100).toFixed(1)}%` : "—"}</td></tr>
            <tr><td>D/E</td><td className="num">{fin?.debtToEquity ?? "—"}</td></tr>
            <tr><td>Dividend yield</td><td className="num">{t.dividendYield != null ? `${(t.dividendYield * 100).toFixed(1)}%` : "—"}</td></tr>
            <tr><td>Volatility</td><td className="num">{t.volatility != null ? `${(t.volatility * 100).toFixed(0)}%` : "—"}</td></tr>
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
    </main>
  );
}
