import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const DEFAULT_USER = "demo-moderate";

export function userOf(req: Request): string {
  const u = new URL(req.url).searchParams.get("user");
  return u && u.length > 0 ? u : DEFAULT_USER;
}

export function ok(data: unknown, asOf?: string | null) {
  return NextResponse.json({ ok: true, data, ...(asOf ? { asOf } : {}) });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
