import { getFinancial, getTraits } from "@aido/db/traits";
import { ActionBadge, Card, naira } from "../_ui";
import { Nav } from "../_nav";

export const dynamic = "force-dynamic";
interface CmpT { score: number | null; dividendYield: number | null; volatility: number | null; closeKobo: number | null; }
interface CmpF { roe: unknown; profitMargin: unknown; debtToEquity: unknown; }
const FACTS: [string, (t: CmpT, f: CmpF | null) => string][] = [
  ["Score", (t) => `${t.score ?? "—"}`],
  ["Action", () => ""],
  ["Price", (t) => naira(t.closeKobo)],
  ["Dividend yield", (t) => (t.dividendYield != null ? `${(t.dividendYield * 100).toFixed(1)}%` : "—")],
  ["ROE", (_t, f) => (f?.roe != null ? `${(Number(f.roe) * 100).toFixed(1)}%` : "—")],
  ["Margin", (_t, f) => (f?.profitMargin != null ? `${(Number(f.profitMargin) * 100).toFixed(1)}%` : "—")],
  ["D/E", (_t, f) => (f?.debtToEquity != null ? String(f.debtToEquity) : "—")],
  ["Volatility", (t) => (t.volatility != null ? `${(t.volatility * 100).toFixed(0)}%` : "—")],
];

export default async function Compare({ searchParams }: { searchParams: { tickers?: string } }) {
  const tickers = (searchParams.tickers ?? "GTCO,DANGCEM").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 3);
  const cols: { t: CmpT & { ticker: string; action: string | null }; f: CmpF | null }[] = [];
  for (const ticker of tickers) {
    const t = await getTraits(ticker);
    if (!t) continue;
    cols.push({ t, f: await getFinancial(ticker) });
  }
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Compare</h1>
      <form method="get" style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input name="tickers" defaultValue={tickers.join(",")} className="input" style={{ width: 300 }} />
        <button className="btn" type="submit">Compare</button>
      </form>
      <Card>
        <table className="tbl">
          <colgroup><col style={{ width: "30%" }} />{cols.map(({ t }) => <col key={t.ticker} style={{ width: `${70 / Math.max(1, cols.length)}%` }} />)}</colgroup>
          <thead><tr><th>Fact</th>{cols.map(({ t }) => <th key={t.ticker} className="num"><a href={`/stocks/${t.ticker}`}>{t.ticker}</a></th>)}</tr></thead>
          <tbody>
            {FACTS.map(([label, fn]) => (
              <tr key={label}>
                <td style={{ color: "var(--muted)" }}>{label}</td>
                {cols.map(({ t, f }) => (
                  <td key={t.ticker} className="num">{label === "Action" ? <ActionBadge action={t.action} /> : label === "Price" ? naira(t.closeKobo) : fn(t, f)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>Goal is not to crown a winner, but to show how the opportunities differ (PRD §24).</p>
    </main>
  );
}
