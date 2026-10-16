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
    setMsg(r.ok ? "Saved." : "Couldn't save. Please try again.");
  }
  async function signOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }
  const row = { display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, alignItems: "center", marginTop: 10 } as const;
  return (
    <>
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
      <div style={{ height: 16 }} />
      <PasswordChanger />
      <div style={{ height: 16 }} />
      <DeleteAccount />
    </>
  );
}

function PasswordChanger() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      setMsg("New password needs at least 8 characters.");
      return;
    }
    setMsg("Saving…");
    const r = await authClient.changePassword({ currentPassword: current, newPassword: next });
    if (r.error) setMsg(`Could not change it: ${r.error.message}`);
    else {
      setMsg("Password changed.");
      setCurrent("");
      setNext("");
    }
  }
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Change password</h3>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <input className="input" type="password" placeholder="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <input className="input" type="password" placeholder="New password (8+ chars)" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
        <button className="btn" type="submit">Change password</button>
        <span style={{ fontSize: 13 }}>{msg}</span>
      </form>
    </Card>
  );
}

function DeleteAccount() {
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  async function remove() {
    if (confirm.trim().toUpperCase() !== "DELETE") {
      setMsg("Type DELETE in the box to confirm.");
      return;
    }
    setMsg("Deleting…");
    const r = await fetch("/api/v1/account", { method: "DELETE" });
    if (!r.ok) {
      setMsg("Could not delete. Please try again.");
      return;
    }
    await authClient.signOut();
    window.location.href = "/signup";
  }
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>Delete account</h3>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>This removes your profile, portfolio, watchlist, alerts and settings for good. This cannot be undone.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" placeholder="Type DELETE to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <button className="btn" type="button" onClick={remove} style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626" }}>Delete my account</button>
      </div>
      <p style={{ fontSize: 13 }}>{msg}</p>
    </Card>
  );
}
