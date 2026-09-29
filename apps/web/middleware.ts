import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Private pages need an account. Explore, stock pages, methodology and
// login/signup stay public so links can be shared.
//
// NOTE: middleware runs on the Edge runtime where the Postgres driver cannot
// run, so it only checks for the session COOKIE's presence. Every page and
// API route re-validates the session against the database (Node runtime),
// so a forged cookie gets you nothing but a redirect back to login.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.getAll().some((c) => c.name.endsWith("better-auth.session_token"));
  if (hasSession) return NextResponse.next();
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url));
}

export const config = {
  matcher: ["/", "/portfolio/:path*", "/watchlist/:path*", "/picks/:path*", "/compare/:path*", "/profile/:path*", "/alerts/:path*", "/onboarding/:path*"],
};
