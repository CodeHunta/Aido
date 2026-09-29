import { headers } from "next/headers";
import { auth } from "@aido/auth/auth";
import { DEFAULT_USER } from "../api/v1/_lib";

// Who is looking at this page? Logged-in user, else the demo shelf.
export async function currentUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // fall through to demo
  }
  return DEFAULT_USER;
}
