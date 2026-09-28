import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@aido/auth/auth";

export const dynamic = "force-dynamic";
export const DEFAULT_USER = "demo-moderate";

// Logged-in users get their own data. Everyone else shares the demo shelf
// until login (keeps every screen working with zero setup).
export async function userOf(req: Request): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // no session — fall through to demo
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
