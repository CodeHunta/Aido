"use client";
import { useEffect, useState } from "react";
import { Card } from "../_ui";
import { PublicNav } from "../_nav_public";

export default function Premium() {
  const [plan, setPlan] = useState("…");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/v1/paystack").then((r) => r.json()).then((j) => setPlan(j.ok ? j.data.plan : "?")).catch(() => setPlan("?"));
  }, []);
  async function upgrade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg("Contacting Paystack…");
    const r = await fetch("/api/v1/paystack", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: String(fd.get("email")) }) });
    const j = await r.json();
    if (j.ok) window.location.href = j.data.url;
    else setMsg(j.error);
  }
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <PublicNav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Premium</h1>
      <p>Your plan: <strong>{plan}</strong></p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card><h3>Free</h3><ul><li>Market info + weekly market pick</li><li>Basic watchlist & portfolio</li><li>Limited analysis</li></ul></Card>
        <Card><h3>Premium — ₦1,500/mo</h3><ul><li>Full investment theses</li><li>Personal picks + advanced alerts</li><li>Deep history & comparison</li></ul>
          <form onSubmit={upgrade} style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <input name="email" type="email" placeholder="Email for receipt" className="input" required />
            <button className="btn" type="submit">Upgrade with Paystack</button>
            <span style={{ fontSize: 13 }}>{msg}</span>
          </form>
        </Card>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Free stays useful enough to earn trust; Premium is deeper intelligence, not removed limits. Test mode until launch keys arrive.</p>
    </main>
  );
}
