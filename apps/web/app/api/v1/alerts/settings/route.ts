import { eq } from "@aido/db/drizzle";
import { alertPreferences, db } from "@aido/db";
import { bad, ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

const DEFAULTS = { weeklyPick: true, recChange: true, priceMove: true, dividend: true, news: true };

export async function GET(req: Request) {
  const userId = await userOf(req);
  const row = (await db.select().from(alertPreferences).where(eq(alertPreferences.userId, userId)))[0];
  return ok(row ? { weeklyPick: row.weeklyPick, recChange: row.recChange, priceMove: row.priceMove, dividend: row.dividend, news: row.news } : DEFAULTS);
}

export async function PATCH(req: Request) {
  const userId = await userOf(req);
  let body: Partial<typeof DEFAULTS>;
  try {
    body = await req.json();
  } catch {
    return bad("Send true/false choices.");
  }
  const next = {
    weeklyPick: typeof body.weeklyPick === "boolean" ? body.weeklyPick : DEFAULTS.weeklyPick,
    recChange: typeof body.recChange === "boolean" ? body.recChange : DEFAULTS.recChange,
    priceMove: typeof body.priceMove === "boolean" ? body.priceMove : DEFAULTS.priceMove,
    dividend: typeof body.dividend === "boolean" ? body.dividend : DEFAULTS.dividend,
    news: typeof body.news === "boolean" ? body.news : DEFAULTS.news,
  };
  const existing = (await db.select().from(alertPreferences).where(eq(alertPreferences.userId, userId)))[0];
  if (existing) {
    await db.update(alertPreferences).set({ ...next, updatedAt: new Date() }).where(eq(alertPreferences.userId, userId));
  } else {
    await db.insert(alertPreferences).values({ userId, ...next });
  }
  return ok(next);
}
