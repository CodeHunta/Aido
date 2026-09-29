import { getProfile, getTraits, listTickers } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { ActionBadge, Card, Nav, naira } from "../_ui";
import { currentUserId } from "../lib/session";

export const dynamic = "force-dynamic";
const CATS = ["large-cap", "growth", "dividend", "value", "high-risk", "turnaround", "speculative"];

export default async function Discover({ searchParams }: { searchParams: { q?: string; category?: string; sort?: string } }) {
  const q = (searchParams.q ?? "").toLowerCase();
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "az";
  const USER = await currentUserId();
  const profile = await getProfile(USER);
  const rows = [];
  for (const ticker of await listTickers()) {
    const t = await getTraits(ticker);
    if (!t) continue;
    if (category && !t.categories.includes(category)) continue;
    if (q && !t.ticker.toLowerCase().includes(q) && !t.name.toLowerCase().includes(q)) continue;
    const s = profile
      ? suitFor({ risk: profile.risk, horizon: profile.horizon, objective: profile.objective }, { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield })
      : null;
    rows.push({ ...t, suitability: s?.level ?? null });
  }
  if (sort === "yield") rows.sort((a, b) => (b.dividendYield ?? -1) - (a.dividendYield ?? -1));
  else if (sort === "score") rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  else rows.sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Discover</h1>
      <form method="get" style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search ticker or name" className="input" />
        <select name="category" defaultValue={category} className="input">
          <option value="">All styles</option>
          {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="sort" defaultValue={sort} className="input">
          <option value="az">A – Z</option>
          <option value="score">Top score</option>
          <option value="yield">Top yield</option>
        </select>
        <button className="btn" type="submit">Search</button>
      </form>
      <Card>
        <table className="grid fixed">
          <colgroup><col style={{ width: "34%" }} /><col style={{ width: "17%" }} /><col style={{ width: "12%" }} /><col style={{ width: "20%" }} /><col style={{ width: "17%" }} /></colgroup>
          <thead><tr><th>Stock</th><th className="num">Price</th><th className="num">Score</th><th>Action</th><th>Fit</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker}>
                <td><a href={`/stocks/${r.ticker}`} style={{ fontWeight: 700 }}>{r.ticker}</a> <span className="ellipsis" style={{ color: "var(--muted)", fontSize: 12 }}>{r.name}</span></td>
                <td className="num">{naira(r.closeKobo)}</td>
                <td className="num"><strong>{r.score ?? "—"}</strong></td>
                <td><ActionBadge action={r.action} /></td>
                <td>{r.suitability === "low" ? "Outside profile" : (r.suitability ?? "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
