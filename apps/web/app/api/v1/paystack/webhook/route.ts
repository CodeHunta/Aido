import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { auditLogs, subscriptions } from "@aido/db/schema";
import { validWebhookSignature, verifyPayment } from "@aido/payments/paystack";
import { bad, ok } from "../../_lib";

export const dynamic = "force-dynamic";

// Paystack calls this after every successful charge.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  if (!validWebhookSignature(raw, sig)) return bad("Bad signature", 401);
  let event: { event: string; data: { reference: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return bad("Bad JSON");
  }
  if (event.event !== "charge.success") return ok({ ignored: event.event });
  let v;
  try {
    v = await verifyPayment(event.data.reference);
  } catch (e) {
    return bad(`Verify failed: ${(e as Error).message}`, 502);
  }
  if (!v.paid) return ok({ paid: false });
  await db.insert(subscriptions).values({ userId: v.userId, plan: "premium" }).onConflictDoNothing();
  await db.update(subscriptions).set({ plan: "premium" }).where(eq(subscriptions.userId, v.userId));
  await db.insert(auditLogs).values({ id: `sub-${v.userId}-${Date.now()}`, userId: v.userId, action: "premium_activated", meta: { email: v.email, amountKobo: v.amountKobo } });
  return ok({ premium: v.userId });
}
