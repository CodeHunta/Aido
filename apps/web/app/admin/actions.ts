"use server";

import { revalidatePath } from "next/cache";
import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { users } from "@aido/db/schema";
import { requireAdmin } from "../lib/admin";

// Promote or demote another account. An admin cannot demote themselves, so the
// last superadmin can never lock the control room out.
export async function setRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "user");
  if (!userId || !["user", "superadmin"].includes(role)) return;
  if (userId === admin.id && role !== "superadmin") return;

  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin");
}
