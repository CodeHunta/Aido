import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { subscriptions } from "@aido/db/schema";
import { initializePayment } from "@aido/payments/paystack";
import { bad, ok, sessionUserId, userOf } from "../_lib";

export const dynamic = "force-dynamic";
const PREMIUM_MONTHLY_KOBO = 150000; // ₦1,500/mo. Change before launch

export async function GET() {
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, await userOf()));
  return ok({ plan: rows[0]?.plan ?? "free" });
}

// Starts a Paystack checkout. Needs PAYSTACK_SECRET_KEY (test keys fine).
export async function POST(req: Request) {
  const userId = await sessionUserId();
  if (!userId) return bad("Log in to upgrade.", 401);
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  if (!body?.email) return bad("Need email");
  try {
    const { url, reference } = await initializePayment({ email: body.email, amountKobo: PREMIUM_MONTHLY_KOBO, userId });
    return ok({ url, reference });
  } catch (e) {
    return bad((e as Error).message, 503);
  }
}
