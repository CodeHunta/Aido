import { desc, eq } from "drizzle-orm";
import { db } from "@aido/db";
import { alerts } from "@aido/db/schema";
import { ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rows = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userOf(req)))
    .orderBy(desc(alerts.createdAt))
    .limit(50);
  return ok(rows);
}
