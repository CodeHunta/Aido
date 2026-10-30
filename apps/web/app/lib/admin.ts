import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { users } from "@aido/db/schema";
import { auth } from "@aido/auth/auth";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

// The session says who you are; the users.role column says whether you may see
// the control room. Both are checked server-side on every request.
export async function currentAdmin(): Promise<AdminUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const id = session?.user?.id;
    if (!id) return null;
    const row = (await db.select().from(users).where(eq(users.id, id)))[0];
    if (!row || row.role !== "superadmin") return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await currentAdmin();
  if (!admin) redirect("/login?next=/admin");
  return admin;
}
