import { and, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { watchlists } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await userOf(req);
  const rows = await db.select().from(watchlists).where(eq(watchlists.userId, userId));
  const out = [];
  for (const w of rows) {
    const t = await getTraits(w.ticker);
    out.push({ ticker: w.ticker, createdAt: w.createdAt, ...(t ?? {}) });
  }
  return ok(out);
}

export async function POST(req: Request) {
  const userId = await userOf(req);
  const body = (await req.json().catch(() => null)) as { ticker?: string } | null;
  if (!body?.ticker) return bad("Need ticker");
  const ticker = body.ticker.toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return bad("Unknown ticker", 404);
  await db.insert(watchlists).values({ userId, ticker }).onConflictDoNothing();
  return ok({ watched: ticker });
}

export async function DELETE(req: Request) {
  const userId = await userOf(req);
  const ticker = (new URL(req.url).searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker) return bad("Need ?ticker=");
  await db.delete(watchlists).where(and(eq(watchlists.userId, userId), eq(watchlists.ticker, ticker)));
  return ok({ unwatched: ticker });
}
