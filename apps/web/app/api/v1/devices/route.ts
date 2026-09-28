import { db } from "@aido/db";
import { devices } from "@aido/db/schema";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

// Mobile registers its Expo push token here. Stored for Phase 7 pushes.
export async function POST(req: Request) {
  const userId = await userOf(req);
  const body = (await req.json().catch(() => null)) as { token?: string; platform?: string } | null;
  if (!body?.token) return bad("Need token");
  await db.insert(devices).values({ userId, token: body.token, platform: body.platform ?? "expo" }).onConflictDoNothing();
  return ok({ registered: true });
}
