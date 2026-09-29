import { and, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { portfolios } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, await userOf(req)));
  const rows = [];
  for (const h of held) {
    const t = await getTraits(h.ticker);
    rows.push({ ...h, qty: Number(h.qty), avgCostKobo: Number(h.avgCostKobo), priceKobo: t?.closeKobo ?? null, name: t?.name ?? h.ticker });
  }
  return ok(rows);
}

export async function POST(req: Request) {
  const userId = await userOf(req);
  const body = (await req.json().catch(() => null)) as { ticker?: string; qty?: number; avgCostKobo?: number } | null;
  if (!body?.ticker || !body.qty || body.qty === 0 || body.avgCostKobo == null || body.avgCostKobo < 0) {
    return bad("Need ticker, qty (not 0 — negative sells), avgCostKobo (>=0)");
  }
  const ticker = body.ticker.toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return bad("Unknown ticker", 404);
  const existing = (await db.select().from(portfolios).where(and(eq(portfolios.userId, userId), eq(portfolios.ticker, ticker))))[0];
  if (!existing) {
    if (body.qty < 0) return bad("You don't hold this stock yet — can't sell");
    await db.insert(portfolios).values({ userId, ticker, qty: body.qty, avgCostKobo: body.avgCostKobo });
    return ok({ added: ticker, qty: body.qty, avgCostKobo: body.avgCostKobo });
  }
  // Broker-style averaging: buys accumulate and re-average, sells reduce at same average.
  const oldQty = Number(existing.qty);
  const oldAvg = Number(existing.avgCostKobo);
  const newQty = oldQty + body.qty;
  if (newQty <= 0) {
    await db.delete(portfolios).where(and(eq(portfolios.userId, userId), eq(portfolios.ticker, ticker)));
    return ok({ soldAll: ticker });
  }
  const newAvg = body.qty > 0 ? Math.round((oldQty * oldAvg + body.qty * body.avgCostKobo) / newQty) : oldAvg;
  await db.update(portfolios).set({ qty: newQty, avgCostKobo: newAvg }).where(and(eq(portfolios.userId, userId), eq(portfolios.ticker, ticker)));
  return ok({ accumulated: ticker, qty: newQty, avgCostKobo: newAvg });
}

export async function DELETE(req: Request) {
  const userId = await userOf(req);
  const ticker = (new URL(req.url).searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker) return bad("Need ?ticker=");
  await db.delete(portfolios).where(and(eq(portfolios.userId, userId), eq(portfolios.ticker, ticker)));
  return ok({ removed: ticker });
}
