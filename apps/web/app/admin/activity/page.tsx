import Link from "next/link";
import { count, desc, eq, gte } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { auditLogs, users } from "@aido/db/schema";
import { requireAdmin } from "../../lib/admin";
import { ago, rangeTabs } from "../_ui";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const PER_PAGE = 50;
const RANGE_DAYS: Record<string, number | null> = { "14": 14, "30": 30, "90": 90, "365": 365, all: null };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminActivityPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  await requireAdmin();
  const rangeKey = first(searchParams?.range);
  const range = rangeKey && rangeKey in RANGE_DAYS ? rangeKey : "all";
  const days = RANGE_DAYS[range] ?? null;
  const start = days ? new Date(Date.now() - days * DAY) : new Date(0);
  const page = Math.max(1, Number.parseInt(first(searchParams?.page) ?? "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const [totalRow, rows] = await Promise.all([
    db.select({ n: count() }).from(auditLogs).where(gte(auditLogs.createdAt, start)),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        meta: auditLogs.meta,
        userId: auditLogs.userId,
        createdAt: auditLogs.createdAt,
        email: users.email,
        name: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(gte(auditLogs.createdAt, start))
      .orderBy(desc(auditLogs.createdAt))
      .limit(PER_PAGE)
      .offset(offset),
  ]);

  const total = Number(totalRow[0]?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px 64px" }}>
      <Link href="/admin" style={{ fontSize: 13, fontWeight: 700, color: "var(--cobalt)" }}>← Back to control room</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: "10px 0 0" }}>Activity log</h1>
      <p style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
        Every recorded event, oldest available included. {total.toLocaleString()} events in this range.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Page {page} of {pages}</div>
        {rangeTabs(range, (key) => `/admin/activity?range=${key}`)}
      </div>

      <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginTop: 14 }}>
        <div className="tbl-wrap">
          <table className="tbl" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Person</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                    {new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 16)}
                    <div style={{ color: "var(--muted)" }}>{ago(new Date(r.createdAt))}</div>
                  </td>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{r.action}</td>
                  <td style={{ fontSize: 13 }}>
                    {r.email ? (
                      <Link href={`/admin/users/${r.userId}`} style={{ color: "var(--cobalt)", fontWeight: 700 }}>{r.email}</Link>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>{(r.meta as { email?: string })?.email ?? (r.userId ? `user ${r.userId.slice(0, 8)}…` : "—")}</span>
                    )}
                    {r.name ? <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.name}</div> : null}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {JSON.stringify(r.meta).slice(0, 220)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No activity in this range.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
          {page > 1 ? <Link href={`/admin/activity?range=${range}&page=${prev}`} className="btn" style={{ textDecoration: "none" }}>← Newer</Link> : <span />}
          {page < pages ? <Link href={`/admin/activity?range=${range}&page=${next}`} className="btn" style={{ textDecoration: "none" }}>Older →</Link> : <span />}
        </div>
      </section>
    </main>
  );
}
