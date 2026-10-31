import { count, desc, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { investorProfiles, portfolios, sessions, subscriptions, users, watchlists } from "@aido/db/schema";
import { currentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

function cell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

// Marketing-friendly export: one row per account, with the demographics the
// admin dashboard collects and a plain email column for later campaigns.
export async function GET() {
  const admin = await currentAdmin();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const [userRows, profileRows, subRows, holdingRows, watchRows, sessionRows] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(investorProfiles),
    db.select().from(subscriptions),
    db.select({ userId: portfolios.userId, n: count() }).from(portfolios).groupBy(portfolios.userId),
    db.select({ userId: watchlists.userId, n: count() }).from(watchlists).groupBy(watchlists.userId),
    db.select({ userId: sessions.userId, updatedAt: sessions.updatedAt }).from(sessions).orderBy(desc(sessions.updatedAt)),
  ]);

  const profileOf = new Map(profileRows.map((p) => [p.userId, p]));
  const planOf = new Map(subRows.map((s) => [s.userId, s.plan]));
  const holdingsOf = new Map(holdingRows.map((r) => [r.userId, Number(r.n)]));
  const watchOf = new Map(watchRows.map((r) => [r.userId, Number(r.n)]));
  const lastSeen = new Map<string, Date>();
  for (const s of sessionRows) {
    const prev = lastSeen.get(s.userId);
    if (!prev || new Date(s.updatedAt) > prev) lastSeen.set(s.userId, new Date(s.updatedAt));
  }

  const header = [
    "email",
    "name",
    "age",
    "role",
    "plan",
    "joined",
    "last_seen",
    "risk",
    "horizon",
    "objective",
    "frequency",
    "capital_ngn",
    "holdings",
    "watchlist",
  ];

  const lines = [header.map(cell).join(",")];
  for (const u of userRows) {
    const p = profileOf.get(u.id);
    lines.push(
      [
        u.email,
        u.name ?? "",
        p?.age ?? "",
        u.role,
        planOf.get(u.id) ?? "free",
        new Date(u.createdAt).toISOString().slice(0, 10),
        lastSeen.get(u.id)?.toISOString() ?? "",
        p?.risk ?? "",
        p?.horizon ?? "",
        p?.objective ?? "",
        p?.frequency ?? "",
        p?.capitalKobo != null ? (Number(p.capitalKobo) / 100).toFixed(2) : "",
        holdingsOf.get(u.id) ?? 0,
        watchOf.get(u.id) ?? 0,
      ]
        .map(cell)
        .join(","),
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="aido-users-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}
