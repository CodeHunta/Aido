"use client";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { Card } from "../_ui";

export default function ProfileEditor({ initial }: { initial: { risk: string; horizon: string; objective: string; capitalKobo: number; frequency: string } }) {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "capitalKobo" ? Math.round(Number(e.target.value || 0) * 100) : e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Saving…");
    const r = await fetch("/api/v1/profiles/me", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    setMsg(r.ok ? "Saved." : "Couldn't save — try again.");
  }
  async function signOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }
  const row = { display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, alignItems: "center", marginTop: 10 } as const;
  return (
    <Card>
      <form onSubmit={save}>
        <div style={row}><label>Risk</label><select className="input" value={form.risk} onChange={set("risk")}><option value="conservative">Conservative</option><option value="moderate">Moderate</option><option value="aggressive">Aggressive</option></select></div>
        <div style={row}><label>Horizon</label><select className="input" value={form.horizon} onChange={set("horizon")}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></div>
        <div style={row}><label>Objective</label><select className="input" value={form.objective} onChange={set("objective")}><option value="growth">Growth</option><option value="dividend">Dividend</option><option value="income">Income</option><option value="preservation">Preservation</option><option value="combination">Combination</option></select></div>
        <div style={row}><label>Capital (₦)</label><input className="input" type="number" value={form.capitalKobo / 100} onChange={set("capitalKobo")} /></div>
        <div style={row}><label>Frequency</label><select className="input" value={form.frequency} onChange={set("frequency")}><option value="once">One-off</option><option value="monthly">Monthly</option><option value="irregular">Irregular</option></select></div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn" type="submit">Save profile</button>
          <button className="btn" type="button" onClick={signOut}>Log out</button>
        </div>
        <p style={{ fontSize: 13 }}>{msg}</p>
      </form>
    </Card>
  );
}
