import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { watchlists } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { RemoveButton } from "../_actions";
import { ActionBadge, Card, naira } from "../_ui";
import { currentUserId } from "../lib/session";
import { Nav } from "../_nav";

export const dynamic = "force-dynamic";

export default async function Watchlist() {
  const USER = await currentUserId();
  const rows = await db.select().from(watchlists).where(eq(watchlists.userId, USER));
  const out = [];
  for (const w of rows) {
    const t = await getTraits(w.ticker);
    if (t) out.push(t);
  }
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Watchlist</h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Aido watches these and pings you only when something material changes.</p>
      <Card>
        {out.length === 0 ? <p>No strong opportunity on your list — that is fine. <a href="/explore">Find stocks →</a></p> : (
          <table className="tbl">
            <colgroup><col style={{ width: "26%" }} /><col style={{ width: "17%" }} /><col style={{ width: "13%" }} /><col style={{ width: "24%" }} /><col style={{ width: "20%" }} /></colgroup>
            <thead><tr><th>Stock</th><th className="num">Price</th><th className="num">Score</th><th>Action</th><th></th></tr></thead>
            <tbody>
              {out.map((t) => (
                <tr key={t.ticker}>
                  <td><a href={`/stocks/${t.ticker}`} style={{ fontWeight: 700 }}>{t.ticker}</a></td>
                  <td className="num">{naira(t.closeKobo)}</td>
                  <td className="num"><strong>{t.score}</strong></td>
                  <td><ActionBadge action={t.action} /></td>
                  <td><RemoveButton ticker={t.ticker} kind="watchlist" userId={USER} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}
