"use client";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Card } from "../_ui";
import { PublicNav } from "../_nav_public";

export default function Login() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await authClient.signIn.email({ email: String(fd.get("email")), password: String(fd.get("password")) });
    if (r.error) setMsg(`Failed: ${r.error.message}`);
    else window.location.href = new URLSearchParams(window.location.search).get("next") || "/";
  }
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <PublicNav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Log in</h1>
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input name="email" placeholder="Email" type="email" className="input" required />
          <input name="password" placeholder="Password" type="password" className="input" required />
          <button className="btn" type="submit">Log in</button>
          <span style={{ fontSize: 13 }}>{msg}</span>
        </form>
      </Card>
      <p style={{ fontSize: 14 }}>New here? <a href="/signup">Create account →</a></p>
    </main>
  );
}
