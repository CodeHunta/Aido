"use client";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Card } from "../_ui";
import { PublicNav } from "../_nav_public";

export default function Reset() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const pw = String(fd.get("password"));
    if (pw.length < 8) {
      setMsg("Use at least 8 characters.");
      return;
    }
    const r = await authClient.resetPassword({ newPassword: pw, token });
    if (r.error) setMsg(`Failed: ${r.error.message}`);
    else window.location.href = "/login";
  }
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <PublicNav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>New password</h1>
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input name="password" placeholder="New password (8+ chars)" type="password" minLength={8} className="input" required />
          <button className="btn" type="submit">Set password</button>
          <span style={{ fontSize: 13 }}>{msg}</span>
        </form>
      </Card>
    </main>
  );
}
