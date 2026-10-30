import { db } from "@aido/db";
import { auditLogs } from "@aido/db/schema";
import { bad, ok } from "../_lib";

export const dynamic = "force-dynamic";

// Public. There is no email provider yet, so instead of pretending to send mail
// we record the request and the superadmin sends a reset link manually.
// Always answers ok for a valid address, so it cannot be used to discover which
// emails have accounts.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Enter a valid email address");

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    action: "password.reset.requested",
    meta: { email },
  });

  return ok({ received: true });
}
