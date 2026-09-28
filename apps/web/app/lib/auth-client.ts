"use client";
import { createAuthClient } from "better-auth/react";

interface EmailResult {
  error: { message: string } | null;
}

// Narrow public surface so Next's type pass stays portable.
export const authClient = createAuthClient() as unknown as {
  signUp: { email: (args: { email: string; password: string; name?: string }) => Promise<EmailResult> };
  signIn: { email: (args: { email: string; password: string }) => Promise<EmailResult> };
  signOut: () => Promise<unknown>;
};
