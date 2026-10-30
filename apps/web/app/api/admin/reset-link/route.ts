import { NextResponse } from "next/server";
import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { users } from "@aido/db/schema";
import { createResetLink } from "@aido/auth/auth";
import { currentAdmin } from "../../../lib/admin";

export const dynamic = "force-dynamic";

// Superadmin only: mint a one-hour password-reset link for a user and return it
// so it can be passed on by hand (no email provider configured yet).
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { userId?: string; email?: string } | null;

  let email = body?.email?.trim().toLowerCase();
  if (body?.userId) {
    const row = (await db.select().from(users).where(eq(users.id, body.userId)))[0];
    email = row?.email?.toLowerCase();
  }
  if (!email) return NextResponse.json({ ok: false, error: "No such user" }, { status: 404 });

  const url = await createResetLink(email);
  if (!url) {
    return NextResponse.json({ ok: false, error: "Could not create a link for that address" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, url });
}
