"use client";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Card, Nav } from "../_ui";

export default function Signup() {
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await authClient.signUp.email({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      name: String(fd.get("name") || ""),
    });
    if (r.error) setMsg(`Failed: ${r.error.message}`);
    else window.location.href = "/";
  }
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Create account</h1>
      <Card>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <input name="name" placeholder="Name" className="input" />
          <input name="email" placeholder="Email" type="email" className="input" required />
          <input name="password" placeholder="Password (8+ chars)" type="password" minLength={8} className="input" required />
          <button className="btn" type="submit">Sign up</button>
          <span style={{ fontSize: 13 }}>{msg}</span>
        </form>
      </Card>
      <p style={{ fontSize: 14 }}>Have an account? <a href="/login">Log in →</a></p>
    </main>
  );
}
