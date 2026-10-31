import Link from "next/link";
import { count, desc, eq, gte, sql } from "@aido/db/drizzle";
import { db } from "@aido/db";
import {
  alerts,
  auditLogs,
  devices,
  investorProfiles,
  portfolios,
  portfolioSnapshots,
  sessions,
  stocks,
  subscriptions,
  users,
  watchlists,
} from "@aido/db/schema";
import { requireAdmin } from "../lib/admin";
import { setRole } from "./actions";
import { ResetLinkButton } from "./_reset-link";
import { Bars, DAY, Donut, LineChart, ago, bucketDates, compactNaira, kpi, panel, rangeTabs, titleCase } from "./_ui";

export const dynamic = "force-dynamic";

const RANGE_DAYS: Record<string, number | null> = { "14": 14, "30": 30, "90": 90, "365": 365, all: null };

function parseRange(value: string | string[] | undefined): string {
  const key = Array.isArray(value) ? value[0] : value;
  return key && key in RANGE_DAYS ? key : "30";
}

function topSlices(rows: { ticker: string; n: number | string }[], limit = 6) {
  const sorted = [...rows].sort((a, b) => Number(b.n) - Number(a.n));
  const top = sorted.slice(0, limit).map((r) => ({ label: r.ticker, value: Number(r.n) }));
  const rest = sorted.slice(limit).reduce((a, r) => a + Number(r.n), 0);
  if (rest > 0) top.push({ label: "Other", value: rest });
  return top;
}

export default async function AdminPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const admin = await requireAdmin();
  const now = new Date();
  const range = parseRange(searchParams?.range);
  const days = RANGE_DAYS[range] ?? null;

  const userRows = await db.select().from(users).orderBy(desc(users.createdAt));
  const earliest = userRows.length ? new Date(Math.min(...userRows.map((u) => new Date(u.createdAt).getTime()))) : new Date(now.getTime() - 30 * DAY);
  const start = days ? new Date(now.getTime() - days * DAY) : earliest;
  const startStr = start.toISOString().slice(0, 10);

  const [totalUsers = 0, liveSessions = 0, holdings = 0, watched = 0, alertCount = 0, deviceCount = 0] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(sessions).where(gte(sessions.expiresAt, now)),
    db.select({ n: count() }).from(portfolios),
    db.select({ n: count() }).from(watchlists),
    db.select({ n: count() }).from(alerts),
    db.select({ n: count() }).from(devices),
  ]).then((rows) => rows.map((r) => Number(r[0]?.n ?? 0)));

  const [subRows, profileRows, holdingRows, watchRows, sessionRows, stockRows] = await Promise.all([
    db.select().from(subscriptions),
    db.select().from(investorProfiles),
    db.select({ userId: portfolios.userId, n: count() }).from(portfolios).groupBy(portfolios.userId),
    db.select({ userId: watchlists.userId, n: count() }).from(watchlists).groupBy(watchlists.userId),
    db.select().from(sessions).orderBy(desc(sessions.updatedAt)).limit(600),
    db.select({ ticker: stocks.ticker, name: stocks.name }).from(stocks),
  ]);

  const signupRows = await db.select({ createdAt: users.createdAt }).from(users).where(gte(users.createdAt, start));
  const activityRows = await db.select({ createdAt: auditLogs.createdAt }).from(auditLogs).where(gte(auditLogs.createdAt, start));
  const resetRequests = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, "password.reset.requested"))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10);
  const recentAudit = await db
    .select({ id: auditLogs.id, action: auditLogs.action, meta: auditLogs.meta, userId: auditLogs.userId, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, start))
    .orderBy(desc(auditLogs.createdAt))
    .limit(15);

  const investedRows = await db
    .select({ ticker: portfolios.ticker, n: count() })
    .from(portfolios)
    .groupBy(portfolios.ticker)
    .orderBy(sql`count(*) desc`);
  const watchTickerRows = await db
    .select({ ticker: watchlists.ticker, n: count() })
    .from(watchlists)
    .groupBy(watchlists.ticker)
    .orderBy(sql`count(*) desc`);
  const investedQtyRows = await db
    .select({ ticker: portfolios.ticker, qty: sql<number>`sum(${portfolios.qty})` })
    .from(portfolios)
    .groupBy(portfolios.ticker);
  const investedQty = new Map(investedQtyRows.map((r) => [r.ticker, Number(r.qty)]));

  const snapshotQuery = db
    .select({ date: portfolioSnapshots.date, value: sql<number>`sum(${portfolioSnapshots.valueKobo})` })
    .from(portfolioSnapshots)
    .where(gte(portfolioSnapshots.date, startStr))
    .groupBy(portfolioSnapshots.date)
    .orderBy(portfolioSnapshots.date);
  const snapshotRows = await snapshotQuery;

  const planOf = new Map(subRows.map((s) => [s.userId, s.plan]));
  const profileOf = new Map(profileRows.map((p) => [p.userId, p]));
  const holdingsOf = new Map(holdingRows.map((r) => [r.userId, Number(r.n)]));
  const watchOf = new Map(watchRows.map((r) => [r.userId, Number(r.n)]));
  const nameOf = new Map(stockRows.map((s) => [s.ticker, s.name]));
  const lastSeen = new Map<string, Date>();
  for (const s of sessionRows) {
    const prev = lastSeen.get(s.userId);
    if (!prev || new Date(s.updatedAt) > prev) lastSeen.set(s.userId, new Date(s.updatedAt));
  }
  const paying = subRows.filter((s) => s.plan && s.plan !== "free").length;
  const newInRange = signupRows.length;
  const profilesWithAge = profileRows.filter((p) => p.age != null).length;

  const mode: "day" | "week" | "month" = range === "365" ? "week" : range === "all" ? "month" : "day";
  const signupSeries = bucketDates(signupRows.map((r) => new Date(r.createdAt)), start, now, mode);
  const activitySeries = bucketDates(activityRows.map((r) => new Date(r.createdAt)), start, now, mode);

  const riskSlices = ["conservative", "moderate", "aggressive"].map((risk) => ({
    label: titleCase(risk),
    value: profileRows.filter((p) => p.risk === risk).length,
  }));

  const snapshotSeries = snapshotRows.map((r) => ({ label: r.date.slice(5), value: Number(r.value) }));

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--cobalt)", textTransform: "uppercase" }}>Aido control room</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 0" }}>Business analytics</h1>
          <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
            Signed in as {admin.email} · {totalUsers} accounts · earliest record {earliest.toISOString().slice(0, 10)} · updated {new Date().toISOString().slice(11, 16)} UTC
          </p>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 14, flexWrap: "wrap" }}>
          <a href="/api/admin/export/users" style={{ color: "var(--cobalt)", fontWeight: 700 }}>Export emails (CSV)</a>
          <Link href="/admin/activity" style={{ color: "var(--cobalt)", fontWeight: 700 }}>Full activity →</Link>
          <Link href="/dashboard" style={{ color: "var(--muted)" }}>Back to app →</Link>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Showing {range === "all" ? "all history" : `the last ${days} days`}.</div>
        {rangeTabs(range, (key) => `/admin?range=${key}`)}
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 14 }}>
        {kpi("Accounts", totalUsers, `${newInRange} new in range`)}
        {kpi("Live sessions", liveSessions, "not expired")}
        {kpi("Premium", paying, "paid subscriptions")}
        {kpi("Holdings", holdings, `${watched} watchlist rows`)}
        {kpi("Alerts", alertCount, `${deviceCount} devices`)}
        {kpi("Profiles with age", profilesWithAge, `${profileRows.length} profiles in total`)}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        {panel("Signups", range === "all" ? "Every account, by month" : `New accounts per ${mode}`, <Bars data={signupSeries.map((b) => ({ label: b.label, value: b.value }))} />)}
        {panel("Activity", "Audit events recorded in this range", <Bars data={activitySeries.map((b) => ({ label: b.label, value: b.value }))} color="#0ea5e9" />)}
        {panel(
          "Portfolio value across all users",
          snapshotSeries.length ? "Daily snapshot totals, in naira" : "Starts recording after the next daily refresh",
          <LineChart data={snapshotSeries} format={(n) => compactNaira(n)} />,
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
        {panel("Most invested stocks", "Positions held, one per user per stock", <Donut data={topSlices(investedRows)} caption="positions" />)}
        {panel("Most watched stocks", "Watchlist entries across all users", <Donut data={topSlices(watchTickerRows)} caption="watches" />)}
        {panel("Investor risk mix", "Self-declared risk appetite", <Donut data={riskSlices} caption="profiles" />)}
      </div>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Users</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>Click a person to see their profile, holdings, watchlist and history.</p>
          </div>
          <a href="/api/admin/export/users" className="btn" style={{ textDecoration: "none" }}>Download all emails</a>
        </div>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead>
              <tr>
                <th>Email</th>
                <th className="num">Age</th>
                <th>Investor type</th>
                <th>Plan</th>
                <th className="num">Holdings</th>
                <th className="num">Watching</th>
                <th>Last seen</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((u) => {
                const p = profileOf.get(u.id);
                return (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}`} className="ellipsis" style={{ fontWeight: 700, color: "var(--cobalt)" }}>{u.email}</Link>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.name ?? "—"} · joined {new Date(u.createdAt).toISOString().slice(0, 10)}</div>
                    </td>
                    <td className="num">{p?.age ?? "—"}</td>
                    <td style={{ fontSize: 13 }}>
                      {p ? `${titleCase(p.risk)} · ${titleCase(p.objective)}` : "—"}
                      {p ? <div style={{ fontSize: 11, color: "var(--muted)" }}>{titleCase(p.horizon)} · {titleCase(p.frequency)}</div> : null}
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
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <Link href={`/admin/users/${u.id}`} style={{ fontSize: 12, fontWeight: 700, color: "var(--cobalt)" }}>View</Link>
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
                );
              })}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Recent activity</h2>
            <Link href={`/admin/activity?range=${range}`} style={{ fontSize: 12, fontWeight: 700, color: "var(--cobalt)" }}>See all →</Link>
          </div>
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
            {recentAudit.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No recorded activity in this range.</li> : null}
          </ul>
        </section>
      </div>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Holdings leaderboard</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Which stocks people actually own, with the quantity recorded across every account.</p>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th className="num">Holders</th>
                <th className="num">Total quantity</th>
              </tr>
            </thead>
            <tbody>
              {investedRows.slice(0, 12).map((r) => (
                <tr key={r.ticker}>
                  <td style={{ fontWeight: 700 }}>{r.ticker}</td>
                  <td>{nameOf.get(r.ticker) ?? "—"}</td>
                  <td className="num">{Number(r.n)}</td>
                  <td className="num">{Number(investedQty.get(r.ticker) ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {investedRows.length === 0 ? <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No holdings recorded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20 }}>
        Admin access is enforced on the server from <code>users.role = &apos;superadmin&apos;</code>. Nobody else can load this page, even by typing the URL. Historical ranges use the oldest record in the database; nothing is deleted when you change the range.
      </p>
    </main>
  );
}
