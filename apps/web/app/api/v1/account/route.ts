import { eq } from "@aido/db/drizzle";
import {
  accounts,
  alertPreferences,
  alerts,
  auditLogs,
  db,
  devices,
  investorProfiles,
  portfolioSnapshots,
  portfolios,
  sessions,
  subscriptions,
  users,
  verifications,
  watchlists,
  weeklyPicks,
} from "@aido/db";
import { bad, ok, userOf } from "../_lib";

export const dynamic = "force-dynamic";

// Delete everything Aido stores about you, then the account itself.
// Log out on the client after calling this.
export async function DELETE(req: Request) {
  const userId = await userOf(req);
  if (!userId || userId === "demo-moderate") return bad("Log in to delete your account.", 401);
  const me = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!me) return bad("Account not found.", 404);
  try {
    await db.delete(alertPreferences).where(eq(alertPreferences.userId, userId));
    await db.delete(alerts).where(eq(alerts.userId, userId));
    await db.delete(portfolios).where(eq(portfolios.userId, userId));
    await db.delete(portfolioSnapshots).where(eq(portfolioSnapshots.userId, userId));
    await db.delete(watchlists).where(eq(watchlists.userId, userId));
    await db.delete(devices).where(eq(devices.userId, userId));
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    await db.delete(investorProfiles).where(eq(investorProfiles.userId, userId));
    await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    await db.delete(weeklyPicks).where(eq(weeklyPicks.userId, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.delete(accounts).where(eq(accounts.userId, userId));
    if (me.email) await db.delete(verifications).where(eq(verifications.identifier, me.email));
    await db.delete(users).where(eq(users.id, userId));
    return ok({ deleted: true });
  } catch {
    return bad("Could not delete your account. Please try again.", 500);
  }
}
