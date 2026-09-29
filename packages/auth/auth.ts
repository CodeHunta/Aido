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
