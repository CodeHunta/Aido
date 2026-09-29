"use client";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Card } from "../_ui";
import { PublicNav } from "../_nav_public";

export default function Forgot() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("Sending…");
    const r = await authClient.forgetPassword({ email: String(fd.get("email")), redirectTo: "/reset" });
    setMsg(r.error ? `Failed: ${r.error.message}` : "Check your email for the reset link.");
  }
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <PublicNav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Forgot password</h1>
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input name="email" placeholder="Email" type="email" className="input" required />
          <button className="btn" type="submit">Send reset link</button>
          <span style={{ fontSize: 13 }}>{msg}</span>
        </form>
      </Card>
    </main>
  );
}
