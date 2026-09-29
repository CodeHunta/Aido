"use client";
import { useEffect, useState } from "react";
import { Card } from "../_ui";

type Profile = { risk: string; horizon: string; objective: string; capitalKobo: number; frequency: string };

const OBJECTIVES = [["growth", "Grow my money", "Beat inflation over time"], ["dividend", "Dividends", "Steady payouts"], ["income", "Regular income", "Cash I can use"], ["preservation", "Keep it safe", "Protect what I have"], ["combination", "A mix", "A bit of everything"]];
const RISKS = [["conservative", "Careful", "Small, steady steps"], ["moderate", "Balanced", "Some ups and downs"], ["aggressive", "Bold", "High risk, high reward"]];
const HORIZONS = [["short", "Short", "Under 1 year"], ["medium", "Medium", "1–5 years"], ["long", "Long", "5+ years"]];
const FREQS = [["once", "One-off", "Invest once"], ["monthly", "Monthly", "Top up often"], ["irregular", "When I can", "No schedule"]];

function Options({ name, value, onPick, opts }: { name: string; value: string; onPick: (v: string) => void; opts: string[][] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {opts.map(([v, label, sub]) => (
        <button key={v ?? label} type="button" onClick={() => onPick(v ?? "")} className="btn" style={value === v ? { background: "var(--text)", color: "var(--bg)", textAlign: "left" } : { textAlign: "left" }}>
          <strong>{label}</strong> <span style={{ opacity: 0.7, fontWeight: 400 }}>· {sub}</span>
        </button>
      ))}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Profile>({ risk: "moderate", horizon: "long", objective: "growth", capitalKobo: 0, frequency: "monthly" });
  const [capital, setCapital] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    fetch("/api/v1/profiles/me").then((r) => r.json()).then((j) => {
      if (j.ok) {
        setForm({ risk: j.data.risk, horizon: j.data.horizon, objective: j.data.objective, capitalKobo: j.data.capitalKobo ?? 0, frequency: j.data.frequency });
        if (j.data.capitalKobo) setCapital(String(j.data.capitalKobo / 100));
      }
    }).catch(() => {});
  }, []);
  const set = (k: keyof Profile) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function finish() {
    setMsg("Saving…");
    const r = await fetch("/api/v1/profiles/me", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, capitalKobo: Math.round(Number(capital || 0) * 100) }) });
    if (r.ok) window.location.href = "/";
    else setMsg("Couldn't save — try again.");
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
      <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: 3, color: "var(--muted)" }}>STEP {step} OF 3</p>
      <div style={{ display: "flex", gap: 6, margin: "8px 0 20px" }}>{[1, 2, 3].map((s) => <div key={s} style={{ flex: 1, height: 6, borderRadius: 999, background: s <= step ? "var(--text)" : "var(--border)" }} />)}</div>
      <Card>
        {step === 1 && (
          <>
            <h1 style={{ marginTop: 0 }}>What are you investing for?</h1>
            <Options name="objective" value={form.objective} onPick={set("objective")} opts={OBJECTIVES} />
            <label style={{ display: "block", marginTop: 16, fontSize: 14, fontWeight: 700 }}>How much can you start with? (₦)</label>
            <input value={capital} onChange={(e) => setCapital(e.target.value)} inputMode="decimal" placeholder="e.g. 500000" className="input" style={{ width: "100%", marginTop: 6 }} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 style={{ marginTop: 0 }}>How much risk feels right?</h1>
            <Options name="risk" value={form.risk} onPick={set("risk")} opts={RISKS} />
            <h1 style={{ marginTop: 20 }}>And for how long?</h1>
            <Options name="horizon" value={form.horizon} onPick={set("horizon")} opts={HORIZONS} />
          </>
        )}
        {step === 3 && (
          <>
            <h1 style={{ marginTop: 0 }}>How will you invest?</h1>
            <Options name="frequency" value={form.frequency} onPick={set("frequency")} opts={FREQS} />
            <p style={{ fontSize: 14, color: "var(--muted)" }}>Aido will match every stock to this profile — and tell you plainly when something doesn't fit.</p>
          </>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          {step > 1 ? <button className="btn" onClick={() => setStep(step - 1)}>← Back</button> : <span />}
          {step < 3 ? <button className="btn" onClick={() => setStep(step + 1)} style={{ background: "var(--text)", color: "var(--bg)" }}>Next →</button> : <button className="btn" onClick={finish} style={{ background: "#16a34a", color: "#fff", borderColor: "#16a34a" }}>Finish →</button>}
        </div>
        <p style={{ fontSize: 13 }}>{msg}</p>
      </Card>
    </main>
  );
}
