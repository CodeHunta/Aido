import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@aido/auth/auth";

// Private pages need an account. Explore, stock pages, methodology and
// login/signup stay public so links can be shared.
export async function middleware(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (session?.user) return NextResponse.next();
  } catch {
    // fall through to login
  }
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url));
}

export const config = {
  matcher: ["/", "/portfolio/:path*", "/watchlist/:path*", "/picks/:path*", "/compare/:path*", "/profile/:path*", "/alerts/:path*", "/onboarding/:path*"],
};
