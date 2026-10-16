import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, apiBase, webBase } from "./api";

const COOKIE_KEY = "aido-session-cookie";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  authedFetch: (path: string, init?: RequestInit) => Promise<unknown>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function readCookie(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(COOKIE_KEY);
  } catch {
    return null;
  }
}

async function authed(path: string, init: RequestInit = {}): Promise<Response> {
  const cookie = await readCookie();
  const headers: Record<string, string> = { "content-type": "application/json", ...((init.headers as Record<string, string>) ?? {}) };
  if (cookie) headers.Cookie = cookie;
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}

// The server answers { ok, data }. Unwrap it or throw a readable message.
export async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as { ok?: boolean; data?: T; error?: string } | null;
  if (!res.ok || body?.ok !== true) throw new ApiError(body?.error ?? `Server error (${res.status})`, res.status);
  return body.data as T;
}

// Log in, then figure out which session-cookie name the server set
// (plain on http, __Secure- prefix on https) by testing candidates.
async function establishSession(token: string): Promise<string> {
  const candidates = [`better-auth.session_token=${token}`, `__Secure-better-auth.session_token=${token}`];
  for (const cookie of candidates) {
    try {
      const res = await fetch(`${webBase()}/api/auth/get-session`, { headers: { Cookie: cookie } });
      const body = (await res.json()) as { session?: unknown; user?: unknown };
      if (res.ok && body && (body.session || body.user)) {
        await SecureStore.setItemAsync(COOKIE_KEY, cookie);
        return cookie;
      }
    } catch {
      // try next candidate
    }
  }
  throw new Error("Logged in, but the session did not stick. Try again.");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const cookie = await readCookie();
      if (!cookie) {
        setUser(null);
        return;
      }
      const res = await fetch(`${webBase()}/api/auth/get-session`, { headers: { Cookie: cookie } });
      const body = (await res.json()) as { user?: SessionUser | null };
      setUser(res.ok && body?.user ? body.user : null);
      if (!res.ok || !body?.user) await SecureStore.deleteItemAsync(COOKIE_KEY);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

type AuthBody = { token?: string; error?: { message?: string } | string };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${webBase()}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => null)) as AuthBody | null;
    if (!res.ok || !body?.token) {
      const err = body?.error;
      throw new Error(typeof err === "string" ? err : (err?.message ?? "Login failed. Please check your email and password."));
    }
    await establishSession(body.token);
    await refresh();
  }, [refresh]);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await fetch(`${webBase()}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = (await res.json().catch(() => null)) as AuthBody | null;
      if (!res.ok || !body?.token) {
        const err = body?.error;
        throw new Error(typeof err === "string" ? err : (err?.message ?? "Signup failed. Please try another email."));
      }
      await establishSession(body.token);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      const cookie = await readCookie();
      await fetch(`${webBase()}/api/auth/sign-out`, { method: "POST", headers: cookie ? { Cookie: cookie } : {} });
    } catch {
      // local cleanup happens regardless
    } finally {
      await SecureStore.deleteItemAsync(COOKIE_KEY);
      setUser(null);
    }
  }, []);

  const authedFetch = useCallback(async (path: string, init: RequestInit = {}): Promise<unknown> => {
    const res = await authed(path, init);
    return unwrap<unknown>(res);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const cookie = await readCookie();
    const res = await fetch(`${webBase()}/api/auth/change-password`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } | string } | null;
    if (!res.ok) {
      const err = body?.error;
      throw new Error(typeof err === "string" ? err : (err?.message ?? "Could not change the password."));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    await authedFetch("/account", { method: "DELETE" });
    await SecureStore.deleteItemAsync(COOKIE_KEY);
    setUser(null);
  }, [authedFetch]);

  return <Ctx.Provider value={{ user, loading, login, signup, logout, changePassword, deleteAccount, authedFetch }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
