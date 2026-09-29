import { desc, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { alerts } from "@aido/db/schema";
import { ActionBadge, Card } from "../_ui";
import { currentUserId } from "../lib/session";
import { Nav } from "../_nav";

export const dynamic = "force-dynamic";

export default async function Alerts() {
  const rows = await db.select().from(alerts).where(eq(alerts.userId, await currentUserId())).orderBy(desc(alerts.createdAt)).limit(50);
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Alerts</h1>
      {rows.length === 0 ? (
        <Card><p>Quiet for now. Aido pings you only when something material changes — a weekly pick, a rating switch, or a watchlist move.</p></Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((a) => (
            <Card key={a.id}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.type.replace("_", " ")} · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>{a.title}</div>
              <div style={{ fontSize: 14, color: "var(--muted)" }}>{a.body}</div>
              {a.ticker ? <div style={{ marginTop: 8 }}><a href={`/stocks/${a.ticker}`}><ActionBadge action={null} /> View {a.ticker} →</a></div> : null}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
