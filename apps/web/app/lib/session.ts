import { DEFAULT_USER, sessionUserId } from "../api/v1/_lib";

// Who is looking at this page? Logged-in user, else the demo shelf.
export async function currentUserId(): Promise<string> {
  return (await sessionUserId()) ?? DEFAULT_USER;
}
