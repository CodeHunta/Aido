import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@aido/db";
import { accounts, investorProfiles, sessions, users, verifications } from "@aido/db/schema";
import { resetPasswordHtml, sendEmail } from "@aido/email";

// Email + password today. Google/Apple plug in here once OAuth keys exist
// (no code changes elsewhere — same session cookies).
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
