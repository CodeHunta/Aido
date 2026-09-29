import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { portfolios } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { analyzePortfolio } from "@aido/scoring";
import { HoldingForm, RemoveButton } from "../_actions";
import { Card, Nav, naira } from "../_ui";
import { currentUserId } from "../lib/session";

export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const USER = await currentUserId();
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, USER));
  const inputs = [];
  for (const h of held) {
    const t = await getTraits(h.ticker);
    inputs.push({ ticker: h.ticker, qty: Number(h.qty), avgCostKobo: Number(h.avgCostKobo), priceKobo: t?.closeKobo ?? 0, sector: t?.sector ?? "", dividendYield: t?.dividendYield ?? null, name: t?.name ?? h.ticker });
  }
  const a = analyzePortfolio(inputs);
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Portfolio</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, margin: "12px 0" }}>
        <Card><div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>VALUE</div><div className="num" style={{ fontSize: 22, fontWeight: 800 }}>{naira(a.valueKobo)}</div></Card>
        <Card><div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>GAIN/LOSS</div><div className="num" style={{ fontSize: 22, fontWeight: 800, color: a.pnlKobo >= 0 ? "#16a34a" : "#dc2626" }}>{naira(a.pnlKobo)} ({(a.pnlPct * 100).toFixed(1)}%)</div></Card>
        <Card><div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>DIVIDEND YIELD</div><div className="num" style={{ fontSize: 22, fontWeight: 800 }}>{(a.dividendYield * 100).toFixed(1)}%</div></Card>
      </div>
      <Card>
        <table className="tbl">
          <colgroup><col style={{ width: "20%" }} /><col style={{ width: "13%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "19%" }} /><col style={{ width: "16%" }} /></colgroup>
          <thead><tr><th>Stock</th><th className="num">Qty</th><th className="num">Avg cost</th><th className="num">Price</th><th className="num">Value</th><th></th></tr></thead>
          <tbody>
            {inputs.map((h) => (
              <tr key={h.ticker}>
                <td><a href={`/stocks/${h.ticker}`} style={{ fontWeight: 700 }}>{h.ticker}</a></td>
                <td className="num">{h.qty.toLocaleString()}</td>
                <td className="num">{naira(h.avgCostKobo)}</td>
                <td className="num">{naira(h.priceKobo)}</td>
                <td className="num">{naira(h.qty * h.priceKobo)}</td>
                <td><RemoveButton ticker={h.ticker} kind="portfolio" userId={USER} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <HoldingForm userId={USER} />
      </Card>
      <Card>
        <div style={{ marginTop: 16 }}><h3>Sectors</h3>
          {a.allocation.map((s) => <div key={s.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}><span style={{ width: 160 }}>{s.key}</span><div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 999 }}><div style={{ width: `${s.weight * 100}%`, height: "100%", background: "#2563eb", borderRadius: 999 }} /></div><span className="num">{(s.weight * 100).toFixed(0)}%</span></div>)}
          {a.weaknesses.length > 0 && <><h3>Weaknesses</h3><ul>{a.weaknesses.map((w) => <li key={w}>{w}</li>)}</ul></>}
        </div>
      </Card>
    </main>
  );
}
