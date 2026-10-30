import Link from "next/link";
import { count, desc, eq, gte } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { alerts, auditLogs, devices, portfolios, sessions, subscriptions, users, watchlists } from "@aido/db/schema";
import { requireAdmin } from "../lib/admin";
import { setRole } from "./actions";
import { ResetLinkButton } from "./_reset-link";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function ago(d: Date | null | undefined): string {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < DAY) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / DAY)}d ago`;
}

function kpi(label: string, value: string | number, note?: string) {
  return (
    <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{note}</div> : null}
    </div>
  );
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const now = new Date();

  const totalUsers = (await db.select({ n: count() }).from(users))[0]?.n ?? 0;
  const new7 = (await db.select({ n: count() }).from(users).where(gte(users.createdAt, new Date(now.getTime() - 7 * DAY))))[0]?.n ?? 0;
  const new30 = (await db.select({ n: count() }).from(users).where(gte(users.createdAt, new Date(now.getTime() - 30 * DAY))))[0]?.n ?? 0;
  const liveSessions = (await db.select({ n: count() }).from(sessions).where(gte(sessions.expiresAt, now)))[0]?.n ?? 0;
  const holdings = (await db.select({ n: count() }).from(portfolios))[0]?.n ?? 0;
  const watched = (await db.select({ n: count() }).from(watchlists))[0]?.n ?? 0;
  const alertCount = (await db.select({ n: count() }).from(alerts))[0]?.n ?? 0;
  const deviceCount = (await db.select({ n: count() }).from(devices))[0]?.n ?? 0;

  const userRows = await db.select().from(users).orderBy(desc(users.createdAt));
  const subRows = await db.select().from(subscriptions);
  const holdingRows = await db.select({ userId: portfolios.userId, n: count() }).from(portfolios).groupBy(portfolios.userId);
  const watchRows = await db.select({ userId: watchlists.userId, n: count() }).from(watchlists).groupBy(watchlists.userId);
  const sessionRows = await db.select().from(sessions).orderBy(desc(sessions.updatedAt)).limit(400);

  const signupRows = await db.select({ createdAt: users.createdAt }).from(users).where(gte(users.createdAt, new Date(now.getTime() - 14 * DAY)));
  const resetRequests = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, "password.reset.requested"))
    .orderBy(desc(auditLogs.createdAt))
    .limit(12);
  const recentAudit = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(15);

  const planOf = new Map(subRows.map((s) => [s.userId, s.plan]));
  const holdingsOf = new Map(holdingRows.map((r) => [r.userId, Number(r.n)]));
  const watchOf = new Map(watchRows.map((r) => [r.userId, Number(r.n)]));
  const lastSeen = new Map<string, Date>();
  for (const s of sessionRows) {
    const prev = lastSeen.get(s.userId);
    if (!prev || new Date(s.updatedAt) > prev) lastSeen.set(s.userId, new Date(s.updatedAt));
  }
  const paying = subRows.filter((s) => s.plan && s.plan !== "free").length;

  // 14-day signup series, oldest first.
  const days: { label: string; n: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now.getTime() - i * DAY);
    const key = start.toISOString().slice(0, 10);
    days.push({ label: key.slice(5), n: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.label, i]));
  for (const row of signupRows) {
    const key = new Date(row.createdAt).toISOString().slice(5, 10);
    const i = dayIndex.get(key);
    if (i !== undefined) days[i]!.n += 1;
  }
  const peak = Math.max(1, ...days.map((d) => d.n));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--cobalt)", textTransform: "uppercase" }}>Aido control room</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 0" }}>Everything at a glance</h1>
          <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
            Signed in as {admin.email} · {totalUsers} accounts · updated {new Date().toISOString().slice(11, 16)} UTC
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 14 }}>
          <Link href="/dashboard" style={{ color: "var(--cobalt)", fontWeight: 700 }}>Back to app →</Link>
          <Link href="/explore" style={{ color: "var(--muted)" }}>Explore</Link>
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
        {kpi("Users", totalUsers, `+${new7} this week · +${new30} this month`)}
        {kpi("Live sessions", liveSessions, "not expired")}
        {kpi("Premium", paying, "paid subscriptions")}
        {kpi("Holdings", holdings, `${watched} on watchlists`)}
        {kpi("Alerts", alertCount, `${deviceCount} devices registered`)}
      </section>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Signups, last 14 days</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginTop: 16 }}>
          {days.map((d) => (
            <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
              <div className="num" style={{ fontSize: 11, color: "var(--muted)" }}>{d.n || ""}</div>
              <div
                title={`${d.label}: ${d.n}`}
                style={{
                  width: "100%",
                  height: `${Math.max(3, (d.n / peak) * 84)}px`,
                  background: d.n ? "var(--cobalt)" : "var(--border)",
                  borderRadius: 6,
                }}
              />
              <div style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap" }}>{d.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Users</h2>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Plan</th>
                <th className="num">Holdings</th>
                <th className="num">Watching</th>
                <th>Last seen</th>
                <th>Role</th>
                <th>Reset</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="ellipsis" style={{ fontWeight: 700 }}>{u.email}</span>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.name ?? "—"} · joined {new Date(u.createdAt).toISOString().slice(0, 10)}</div>
                  </td>
                  <td>{planOf.get(u.id) ?? "free"}</td>
                  <td className="num">{holdingsOf.get(u.id) ?? 0}</td>
                  <td className="num">{watchOf.get(u.id) ?? 0}</td>
                  <td>{ago(lastSeen.get(u.id))}</td>
                  <td>
                    {u.role === "superadmin" ? (
                      <span className="pill" style={{ background: "#dbeafe", color: "#1e40af" }}>superadmin</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>user</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <form action={setRole}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="role" value={u.role === "superadmin" ? "user" : "superadmin"} />
                        <button
                          type="submit"
                          disabled={u.id === admin.id}
                          style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: u.id === admin.id ? "not-allowed" : "pointer", opacity: u.id === admin.id ? 0.4 : 1 }}
                        >
                          {u.role === "superadmin" ? "Demote" : "Make admin"}
                        </button>
                      </form>
                      <ResetLinkButton userId={u.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Password reset requests</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            People who tapped “Forgot password”. No email sender is configured, so create a link and send it to them.
          </p>
          {resetRequests.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No requests yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 10 }}>
              {resetRequests.map((r) => {
                const email = (r.meta as { email?: string })?.email ?? "";
                return (
                  <li key={r.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{email || "unknown"}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{ago(new Date(r.createdAt))}</div>
                    <ResetLinkButton email={email} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Recent activity</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
            {recentAudit.map((a) => (
              <li key={a.id} style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <span style={{ fontWeight: 700 }}>{a.action}</span>
                <span style={{ color: "var(--muted)" }}> · {ago(new Date(a.createdAt))}</span>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {(a.meta as Record<string, unknown>)?.email as string ?? (a.userId ? `user ${a.userId.slice(0, 8)}…` : "—")}
                </div>
              </li>
            ))}
            {recentAudit.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No recorded activity yet.</li> : null}
          </ul>
        </section>
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20 }}>
        Admin access is enforced on the server from <code>users.role = &apos;superadmin&apos;</code>. Nobody else can load this page, even by typing the URL.
      </p>
    </main>
  );
}
