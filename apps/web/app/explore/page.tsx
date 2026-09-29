import { getProfile, getTraits, listTickers } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { ActionBadge, Card, naira } from "../_ui";
import { currentUserId } from "../lib/session";
import { Nav } from "../_nav";

export const dynamic = "force-dynamic";
const CATS = ["large-cap", "growth", "dividend", "value", "high-risk", "turnaround", "speculative"];
const TABS = ["all", "stocks", "etfs", "reits", "bonds", "funds"] as const;
const PER_PAGE = 20;

function link(params: Record<string, string>, label: string, active = false) {
  const qs = new URLSearchParams(params).toString();
  return (
    <a key={label} href={`/explore?${qs}`} className="btn" style={active ? { background: "var(--text)", color: "var(--bg)" } : undefined}>
      {label}
    </a>
  );
}

export default async function Explore({ searchParams }: { searchParams: { q?: string; category?: string; sort?: string; tab?: string; page?: string } }) {
  const q = (searchParams.q ?? "").toLowerCase();
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "az";
  const tab = (searchParams.tab ?? "all").toLowerCase();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const USER = await currentUserId();
  const profile = await getProfile(USER);

  const keep = (k: string, v: string) => ({ q, category, sort, tab, page: "1", [k]: v }) as Record<string, string>;
  const base = { q, category, sort, tab };

  if (tab === "bonds" || tab === "funds") {
    return (
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        <Nav />
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Explore</h1>
        <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
          {TABS.map((t) => link({ ...base, tab: t, page: "1" }, t[0]!.toUpperCase() + t.slice(1), t === tab))}
        </div>
        <Card>
          <h3 style={{ marginTop: 0 }}>{tab === "bonds" ? "Bonds" : "Mutual funds"} — coming next</h3>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            The free NGX feed publishes shares, ETFs and REITs only. Bonds and funds need the paid
            X-DataPortal feed — tracked for the next data upgrade. Stocks, ETFs and REITs are live now.
          </p>
        </Card>
      </main>
    );
  }

  const rows = [];
  for (const ticker of await listTickers()) {
    const t = await getTraits(ticker);
    if (!t) continue;
    if (tab === "stocks" && t.asset !== "stock") continue;
    if (tab === "etfs" && t.asset !== "etf") continue;
    if (tab === "reits" && t.asset !== "reit") continue;
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

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, pages);
  const slice = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const from = total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const to = Math.min(total, safePage * PER_PAGE);
  const pg = (p: number) => ({ ...base, page: String(p) });

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Explore</h1>
      <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
        {TABS.map((t) => link({ ...base, tab: t, page: "1" }, t[0]!.toUpperCase() + t.slice(1), t === tab))}
      </div>
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
        <input type="hidden" name="tab" value={tab} />
        <button className="btn" type="submit">Search</button>
      </form>
      <Card>
        {slice.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No matches. Try a shorter search, clear the style filter, or browse <a href="/explore">everything A–Z</a>.</p>
        ) : (
        <>
        <table className="tbl">
          <colgroup><col style={{ width: "34%" }} /><col style={{ width: "17%" }} /><col style={{ width: "12%" }} /><col style={{ width: "20%" }} /><col style={{ width: "17%" }} /></colgroup>
          <thead><tr><th>Stock</th><th className="num">Price</th><th className="num">Score</th><th>Action</th><th>Fit</th></tr></thead>
          <tbody>
            {slice.map((r) => (
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
          <span>Showing {from}–{to} of {total}</span>
          <span style={{ display: "flex", gap: 8 }}>
            {safePage > 1 ? <a className="btn" href={`/explore?${new URLSearchParams(pg(safePage - 1)).toString()}`}>← Prev</a> : null}
            {safePage < pages ? <a className="btn" href={`/explore?${new URLSearchParams(pg(safePage + 1)).toString()}`}>Next →</a> : null}
          </span>
        </div>
        </>
        )}
      </Card>
    </main>
  );
}
