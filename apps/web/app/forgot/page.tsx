"use client";
import { useState } from "react";
import { Card } from "../_ui";
import { PublicNav } from "../_nav_public";

export default function Forgot() {
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setDone(false);
    setMsg("");
    try {
      // There is no email sender configured yet, so this records the request
      // for the superadmin instead of pretending a message went out.
      const res = await fetch("/api/v1/password-reset-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: String(fd.get("email")) }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? "Could not record your request.");
      setDone(true);
      setMsg("Request received. Support will send a reset link to this email, usually within a working day.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not record your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <PublicNav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Forgot password</h1>
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input name="email" placeholder="Email" type="email" className="input" required />
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Request reset link"}
          </button>
          <span style={{ fontSize: 13, color: done ? "#166534" : undefined }}>{msg}</span>
          {done ? (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              In a hurry? Email <a href="mailto:manstylo@gmail.com">manstylo@gmail.com</a> and mention the address above.
            </span>
          ) : null}
        </form>
      </Card>
    </main>
  );
}
