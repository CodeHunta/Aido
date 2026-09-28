import { and, eq } from "drizzle-orm";
import { db } from "@aido/db";
import { portfolios } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, userOf(req)));
  const rows = [];
  for (const h of held) {
    const t = await getTraits(h.ticker);
    rows.push({ ...h, qty: Number(h.qty), avgCostKobo: Number(h.avgCostKobo), priceKobo: t?.closeKobo ?? null, name: t?.name ?? h.ticker });
  }
  return ok(rows);
}

export async function POST(req: Request) {
  const userId = userOf(req);
  const body = (await req.json().catch(() => null)) as { ticker?: string; qty?: number; avgCostKobo?: number } | null;
  if (!body?.ticker || !body.qty || body.avgCostKobo == null) return bad("Need ticker, qty, avgCostKobo");
  const ticker = body.ticker.toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return bad("Unknown ticker", 404);
  await db.insert(portfolios).values({ userId, ticker, qty: body.qty, avgCostKobo: body.avgCostKobo }).onConflictDoNothing();
  return ok({ added: ticker });
}

export async function DELETE(req: Request) {
  const userId = userOf(req);
  const ticker = (new URL(req.url).searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker) return bad("Need ?ticker=");
  await db.delete(portfolios).where(and(eq(portfolios.userId, userId), eq(portfolios.ticker, ticker)));
  return ok({ removed: ticker });
}
