import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "@aido/db/drizzle";
import { db } from "@aido/db";
import {
  alerts,
  auditLogs,
  devices,
  investorProfiles,
  portfolios,
  portfolioSnapshots,
  pricesDaily,
  sessions,
  stocks,
  subscriptions,
  users,
  watchlists,
} from "@aido/db/schema";
import { requireAdmin } from "../../../lib/admin";
import { ResetLinkButton } from "../../_reset-link";
import { LineChart, ago, compactNaira, kpi, naira, panel, titleCase } from "../../_ui";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const user = (await db.select().from(users).where(eq(users.id, params.id)))[0];
  if (!user) notFound();

  const [profile, sub, holdingRows, watchRows, alertRows, deviceRows, sessionRows, auditRows, snapshotRows] = await Promise.all([
    db.select().from(investorProfiles).where(eq(investorProfiles.userId, user.id)).then((r) => r[0] ?? null),
    db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).then((r) => r[0] ?? null),
    db.select().from(portfolios).where(eq(portfolios.userId, user.id)),
    db.select().from(watchlists).where(eq(watchlists.userId, user.id)).orderBy(desc(watchlists.createdAt)),
    db.select().from(alerts).where(eq(alerts.userId, user.id)).orderBy(desc(alerts.createdAt)).limit(20),
    db.select().from(devices).where(eq(devices.userId, user.id)),
    db.select().from(sessions).where(eq(sessions.userId, user.id)).orderBy(desc(sessions.updatedAt)).limit(10),
    db.select().from(auditLogs).where(eq(auditLogs.userId, user.id)).orderBy(desc(auditLogs.createdAt)).limit(50),
    db.select().from(portfolioSnapshots).where(eq(portfolioSnapshots.userId, user.id)).orderBy(portfolioSnapshots.date),
  ]);

  const tickers = [...new Set([...holdingRows.map((h) => h.ticker), ...watchRows.map((w) => w.ticker)])];
  const stockRows = tickers.length ? await db.select().from(stocks).where(inArray(stocks.ticker, tickers)) : [];
  const priceRows = tickers.length
    ? await db
        .selectDistinctOn([pricesDaily.ticker], { ticker: pricesDaily.ticker, closeKobo: pricesDaily.closeKobo, date: pricesDaily.date })
        .from(pricesDaily)
        .where(inArray(pricesDaily.ticker, tickers))
        .orderBy(pricesDaily.ticker, desc(pricesDaily.date))
    : [];

  const stockOf = new Map(stockRows.map((s) => [s.ticker, s]));
  const priceOf = new Map(priceRows.map((p) => [p.ticker, p]));

  const holdings = holdingRows.map((h) => {
    const qty = Number(h.qty);
    const avg = Number(h.avgCostKobo);
    const cost = qty * avg;
    const px = priceOf.get(h.ticker)?.closeKobo ?? null;
    const value = px == null ? null : qty * px;
    return {
      ticker: h.ticker,
      name: stockOf.get(h.ticker)?.name ?? h.ticker,
      sector: stockOf.get(h.ticker)?.sector ?? "",
      qty,
      avgCostKobo: avg,
      priceKobo: px,
      priceDate: priceOf.get(h.ticker)?.date ?? null,
      costKobo: cost,
      valueKobo: value,
      gainKobo: value == null ? null : value - cost,
      gainPct: value == null || cost === 0 ? null : (value - cost) / cost,
    };
  });

  const totalCost = holdings.reduce((a, h) => a + h.costKobo, 0);
  const totalValue = holdings.reduce((a, h) => a + (h.valueKobo ?? 0), 0);
  const pricedAll = holdings.every((h) => h.valueKobo != null);
  const totalGain = totalValue - totalCost;
  const lastSeen = sessionRows[0]?.updatedAt ?? null;
  const snapshotSeries = snapshotRows.map((s) => ({ label: s.date.slice(5), value: Number(s.valueKobo) }));

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
      <Link href="/admin" style={{ fontSize: 13, fontWeight: 700, color: "var(--cobalt)" }}>← Back to control room</Link>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", justifyContent: "space-between", marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: "var(--cobalt)", textTransform: "uppercase" }}>User profile</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: "4px 0 0" }}>{user.name || user.email.split("@")[0]}</h1>
          <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
            {user.email} · joined {new Date(user.createdAt).toISOString().slice(0, 10)} · last seen {ago(lastSeen)}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <span className="pill" style={{ background: "#dbeafe", color: "#1e40af" }}>{user.role}</span>
            <span className="pill" style={{ background: "var(--bg)", color: "var(--text)" }}>{sub?.plan ?? "free"} plan</span>
            <span className="pill" style={{ background: user.emailVerified ? "#dcfce7" : "#fef3c7", color: user.emailVerified ? "#166534" : "#92400e" }}>
              {user.emailVerified ? "email verified" : "email not verified"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <a href={`mailto:${user.email}`} className="btn" style={{ textDecoration: "none" }}>Email user</a>
          <ResetLinkButton userId={user.id} />
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
        {kpi("Age", profile?.age ?? "—", profile?.age ? "self-declared" : "not provided")}
        {kpi("Portfolio value", compactNaira(totalValue), pricedAll ? "live prices" : "some prices missing")}
        {kpi("Invested (cost)", compactNaira(totalCost), `${holdings.length} holdings`)}
        {kpi("Gain / loss", compactNaira(totalGain), totalCost ? `${((totalGain / totalCost) * 100).toFixed(1)}%` : "no cost basis")}
        {kpi("Watching", watchRows.length, "stocks on watchlist")}
        {kpi("Declared capital", compactNaira(profile?.capitalKobo ?? 0), profile ? titleCase(profile.frequency) : "no profile")}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        {panel(
          "Investor profile",
          "Used by Aido to match stocks to this person",
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", margin: "14px 0 0", fontSize: 14 }}>
            <dt style={{ color: "var(--muted)" }}>Age</dt><dd style={{ margin: 0, fontWeight: 700 }}>{profile?.age ?? "Not provided"}</dd>
            <dt style={{ color: "var(--muted)" }}>Risk</dt><dd style={{ margin: 0, fontWeight: 700 }}>{titleCase(profile?.risk)}</dd>
            <dt style={{ color: "var(--muted)" }}>Horizon</dt><dd style={{ margin: 0, fontWeight: 700 }}>{titleCase(profile?.horizon)}</dd>
            <dt style={{ color: "var(--muted)" }}>Objective</dt><dd style={{ margin: 0, fontWeight: 700 }}>{titleCase(profile?.objective)}</dd>
            <dt style={{ color: "var(--muted)" }}>Frequency</dt><dd style={{ margin: 0, fontWeight: 700 }}>{titleCase(profile?.frequency)}</dd>
            <dt style={{ color: "var(--muted)" }}>Capital</dt><dd style={{ margin: 0, fontWeight: 700 }}>{naira(profile?.capitalKobo ?? 0)}</dd>
            <dt style={{ color: "var(--muted)" }}>Profile updated</dt><dd style={{ margin: 0, fontWeight: 700 }}>{profile ? ago(profile.updatedAt) : "—"}</dd>
            <dt style={{ color: "var(--muted)" }}>User ID</dt><dd style={{ margin: 0, fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{user.id}</dd>
          </dl>,
        )}
        {panel(
          "Portfolio value over time",
          snapshotSeries.length ? "Daily snapshots recorded for this account" : "No snapshots yet; the daily refresh starts recording them",
          <LineChart data={snapshotSeries} format={(n) => compactNaira(n)} />,
        )}
      </div>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Stocks held</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>What this person actually owns, at the latest recorded price.</p>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th className="num">Qty</th>
                <th className="num">Avg cost</th>
                <th className="num">Price</th>
                <th className="num">Value</th>
                <th className="num">Gain / loss</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.ticker}>
                  <td style={{ fontWeight: 700 }}>{h.ticker}</td>
                  <td>
                    {h.name}
                    {h.sector ? <div style={{ fontSize: 11, color: "var(--muted)" }}>{h.sector}</div> : null}
                  </td>
                  <td className="num">{h.qty.toLocaleString()}</td>
                  <td className="num">{naira(h.avgCostKobo)}</td>
                  <td className="num">{naira(h.priceKobo)}</td>
                  <td className="num">{naira(h.valueKobo)}</td>
                  <td className="num" style={{ color: h.gainKobo == null ? "var(--muted)" : h.gainKobo >= 0 ? "#166534" : "#991b1b", fontWeight: 700 }}>
                    {h.gainKobo == null ? "—" : `${naira(h.gainKobo)}${h.gainPct == null ? "" : ` (${(h.gainPct * 100).toFixed(1)}%)`}`}
                  </td>
                </tr>
              ))}
              {holdings.length === 0 ? <tr><td colSpan={7} style={{ color: "var(--muted)" }}>No holdings recorded.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Watchlist</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Stocks this person is tracking but does not necessarily own.</p>
        <div className="tbl-wrap" style={{ marginTop: 12 }}>
          <table className="tbl" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th className="num">Price</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {watchRows.map((w) => {
                const px = priceOf.get(w.ticker);
                return (
                  <tr key={w.ticker}>
                    <td style={{ fontWeight: 700 }}>{w.ticker}</td>
                    <td>{stockOf.get(w.ticker)?.name ?? "—"}</td>
                    <td>{stockOf.get(w.ticker)?.sector ?? "—"}</td>
                    <td className="num">{naira(px?.closeKobo ?? null)}</td>
                    <td>{ago(w.createdAt)}</td>
                  </tr>
                );
              })}
              {watchRows.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--muted)" }}>Nothing on the watchlist.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        {panel(
          "Activity timeline",
          "Most recent 50 recorded events for this account",
          <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 8 }}>
            {auditRows.map((a) => (
              <li key={a.id} style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <span style={{ fontWeight: 700 }}>{a.action}</span>
                <span style={{ color: "var(--muted)" }}> · {ago(new Date(a.createdAt))}</span>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(a.createdAt).toISOString().replace("T", " ").slice(0, 16)}</div>
              </li>
            ))}
            {auditRows.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No recorded activity for this account yet.</li> : null}
          </ul>,
        )}
        {panel(
          "Alerts",
          "Notifications Aido has generated for this person",
          <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 10 }}>
            {alertRows.map((a) => (
              <li key={a.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.type} · {a.ticker ?? "general"} · {ago(new Date(a.createdAt))} · {a.seenAt ? "seen" : "unread"}</div>
                {a.body ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{a.body.slice(0, 180)}{a.body.length > 180 ? "…" : ""}</div> : null}
              </li>
            ))}
            {alertRows.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No alerts yet.</li> : null}
          </ul>,
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        {panel(
          "Devices",
          "Push tokens registered by this account",
          <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 8 }}>
            {deviceRows.map((d) => (
              <li key={d.token} style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <span style={{ fontWeight: 700 }}>{d.platform}</span>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", wordBreak: "break-all" }}>{d.token}</div>
              </li>
            ))}
            {deviceRows.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No devices registered.</li> : null}
          </ul>,
        )}
        {panel(
          "Recent sessions",
          "Latest sign-ins and the device/browser used",
          <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "grid", gap: 8 }}>
            {sessionRows.map((s) => (
              <li key={s.id} style={{ fontSize: 12, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ fontWeight: 700 }}>{s.userAgent ? s.userAgent.slice(0, 90) : "unknown device"}</div>
                <div style={{ color: "var(--muted)" }}>{s.ipAddress ?? "no IP"} · active {ago(s.updatedAt)} · expires {new Date(s.expiresAt).toISOString().slice(0, 10)}</div>
              </li>
            ))}
            {sessionRows.length === 0 ? <li style={{ color: "var(--muted)", fontSize: 14 }}>No sessions recorded.</li> : null}
          </ul>,
        )}
      </div>
    </main>
  );
}
