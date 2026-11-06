import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@aido/auth/auth";
import { db } from "@aido/db";
import { auditLogs } from "@aido/db/schema";

export const dynamic = "force-dynamic";
export const DEFAULT_USER = "demo-moderate";

// The verified session owner, or null when nobody is logged in.
// Identity must never come from the request URL or body: a visitor can edit
// those, so trusting them would let anyone act as another account.
export async function sessionUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// Read-only pages and endpoints fall back to the shared demo shelf so the
// product is browsable before login. Writes must use sessionUserId() and
// return 401 when it is null.
export async function userOf(): Promise<string> {
  return (await sessionUserId()) ?? DEFAULT_USER;
}

export function ok(data: unknown, asOf?: string | null) {
  return NextResponse.json({ ok: true, data, ...(asOf ? { asOf } : {}) });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Append-only history for the admin analytics dashboard. Never let analytics
// break the action the person actually asked for, and never log demo traffic.
export async function logEvent(userId: string, action: string, meta: Record<string, unknown> = {}) {
  if (!userId || userId.startsWith("demo-")) return;
  try {
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), userId, action, meta });
  } catch {
    // best effort only
  }
}
