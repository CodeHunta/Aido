import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { investorProfiles } from "@aido/db/schema";
import { getProfile } from "@aido/db/traits";
import { bad, ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = await getProfile(await userOf(req));
  return p ? ok(p) : bad("No profile yet", 404);
}

export async function PUT(req: Request) {
  const userId = await userOf(req);
  const body = (await req.json().catch(() => null)) as Partial<{
    risk: "conservative" | "moderate" | "aggressive";
    horizon: "short" | "medium" | "long";
    objective: "growth" | "dividend" | "preservation" | "income" | "combination";
    capitalKobo: number;
    frequency: "once" | "monthly" | "irregular";
  }> | null;
  if (!body) return bad("Bad JSON");
  const existing = await getProfile(userId);
  if (existing) {
    await db.update(investorProfiles).set({ ...body }).where(eq(investorProfiles.userId, userId));
  } else {
    await db.insert(investorProfiles).values({
      userId,
      risk: body.risk ?? "moderate",
      horizon: body.horizon ?? "long",
      objective: body.objective ?? "growth",
      capitalKobo: body.capitalKobo ?? 0,
      frequency: body.frequency ?? "monthly",
    });
  }
  return ok(await getProfile(userId));
}
