import { desc, eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { alerts } from "@aido/db/schema";
import { ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, await userOf(req)))
    .orderBy(desc(alerts.createdAt))
    .limit(50);
  return ok(rows);
}
