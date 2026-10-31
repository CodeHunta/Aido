import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { investorProfiles } from "@aido/db/schema";
import { getProfile } from "@aido/db/traits";
import { bad, ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

type Risk = "conservative" | "moderate" | "aggressive";
type Horizon = "short" | "medium" | "long";
type Objective = "growth" | "dividend" | "preservation" | "income" | "combination";
type Frequency = "once" | "monthly" | "irregular";

const RISKS: Risk[] = ["conservative", "moderate", "aggressive"];
const HORIZONS: Horizon[] = ["short", "medium", "long"];
const OBJECTIVES: Objective[] = ["growth", "dividend", "preservation", "income", "combination"];
const FREQUENCIES: Frequency[] = ["once", "monthly", "irregular"];

export async function GET(req: Request) {
  const p = await getProfile(await userOf(req));
  return p ? ok(p) : bad("No profile yet", 404);
}

export async function PUT(req: Request) {
  const userId = await userOf(req);
  const body = (await req.json().catch(() => null)) as Partial<{
    risk: Risk;
    horizon: Horizon;
    objective: Objective;
    capitalKobo: number;
    frequency: Frequency;
    age: number | null;
  }> | null;
  if (!body) return bad("Bad JSON");

  // Only accept known columns, so a stray key can never reach the UPDATE.
  const patch: Partial<typeof investorProfiles.$inferInsert> = {};
  if (body.risk !== undefined) {
    if (!RISKS.includes(body.risk)) return bad("Unknown risk level");
    patch.risk = body.risk;
  }
  if (body.horizon !== undefined) {
    if (!HORIZONS.includes(body.horizon)) return bad("Unknown horizon");
    patch.horizon = body.horizon;
  }
  if (body.objective !== undefined) {
    if (!OBJECTIVES.includes(body.objective)) return bad("Unknown objective");
    patch.objective = body.objective;
  }
  if (body.frequency !== undefined) {
    if (!FREQUENCIES.includes(body.frequency)) return bad("Unknown frequency");
    patch.frequency = body.frequency;
  }
  if (body.capitalKobo !== undefined) {
    const capital = Number(body.capitalKobo);
    if (!Number.isFinite(capital) || capital < 0) return bad("Capital must be zero or more");
    patch.capitalKobo = Math.round(capital);
  }
  if (body.age !== undefined) {
    if (body.age === null || (body.age as unknown) === "") {
      patch.age = null;
    } else {
      const age = Math.trunc(Number(body.age));
      if (!Number.isFinite(age) || age < 13 || age > 120) return bad("Age must be between 13 and 120");
      patch.age = age;
    }
  }

  const existing = await getProfile(userId);
  if (existing) {
    await db.update(investorProfiles).set({ ...patch, updatedAt: new Date() }).where(eq(investorProfiles.userId, userId));
  } else {
    await db.insert(investorProfiles).values({
      userId,
      risk: patch.risk ?? "moderate",
      horizon: patch.horizon ?? "long",
      objective: patch.objective ?? "growth",
      capitalKobo: patch.capitalKobo ?? 0,
      frequency: patch.frequency ?? "monthly",
      age: patch.age ?? null,
    });
  }
  return ok(await getProfile(userId));
}
