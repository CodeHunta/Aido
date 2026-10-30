import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@aido/db";
import { accounts, investorProfiles, sessions, users, verifications } from "@aido/db/schema";
import { resetPasswordHtml, sendEmail } from "@aido/email";

// Email + password today. Google/Apple plug in here once OAuth keys exist
// (no code changes elsewhere — same session cookies).

// Better Auth builds the reset URL and hands it to sendResetPassword. With no
// email provider configured we cannot deliver it, so the superadmin dashboard
// calls createResetLink() and passes the link on manually. The capture lives in
// module scope and is read in the same request that triggers it, so it is safe
// on serverless.
const resetCapture = { email: "", url: "" };

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-32-chars-minimum",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  // 30 minutes of inactivity logs you out. Active use extends the session
  // (refreshed at most every 5 minutes), and the browser drops the cookie
  // afterwards — which is also what sends you back to the login screen.
  session: { expiresIn: 60 * 30, updateAge: 60 * 5 },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      resetCapture.email = user.email;
      resetCapture.url = url;
      await sendEmail({ to: user.email, subject: "Reset your Aido password", html: resetPasswordHtml(url) });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(investorProfiles).values({ userId: user.id }).onConflictDoNothing();
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

// Ask Better Auth to mint a password-reset link and hand it back instead of
// emailing it. Returns null when the address is unknown (Better Auth answers
// the same way either way, so callers cannot probe for accounts).
export async function createResetLink(email: string): Promise<string | null> {
  resetCapture.email = "";
  resetCapture.url = "";
  try {
    await auth.api.forgetPassword({ body: { email, redirectTo: "/reset" } });
  } catch {
    return null;
  }
  if (!resetCapture.url) return null;
  if (resetCapture.email.toLowerCase() !== email.toLowerCase()) return null;
  return resetCapture.url;
}
