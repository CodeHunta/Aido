import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@aido/auth/auth";
import { db } from "@aido/db";
import { auditLogs } from "@aido/db/schema";

export const dynamic = "force-dynamic";
export const DEFAULT_USER = "demo-moderate";

// Logged-in users get their own data. Everyone else shares the demo shelf
// until login (keeps every screen working with zero setup).
export async function userOf(req: Request): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // no session, so fall through to demo
  }
  const u = new URL(req.url).searchParams.get("user");
  return u && u.length > 0 ? u : DEFAULT_USER;
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
