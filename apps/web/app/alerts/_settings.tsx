"use client";
import { useEffect, useState } from "react";
import { Card } from "../_ui";

const ITEMS: [string, string, string][] = [
  ["weeklyPick", "Sunday pick", "Your personal pick each Sunday."],
  ["recChange", "Rating change", "When Aido changes its mind, e.g. WATCH → BUY."],
  ["priceMove", "Big price move", "When a watched stock jumps or falls a lot."],
  ["dividend", "Dividend news", "When a company you hold or watch declares or pays dividends."],
  ["news", "Big company news", "Results, major announcements and material market news."],
];

export default function AlertSettings() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ weeklyPick: true, recChange: true, priceMove: true, dividend: true, news: true });
  const [msg, setMsg] = useState("Loading your choices…");

  useEffect(() => {
    fetch("/api/v1/alerts/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setPrefs(j.data);
          setMsg("");
        } else setMsg("Could not load, so showing all on.");
      })
      .catch(() => setMsg("Could not load, so showing all on."));
  }, []);

  async function save() {
    setMsg("Saving…");
    const r = await fetch("/api/v1/alerts/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(prefs) });
    setMsg(r.ok ? "Saved. Aido will only send what you kept on." : "Could not save. Please try again.");
  }

  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>What should Aido tell you about?</h3>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>Turn off anything you do not want. Off means no in-app message, no email and no phone buzz for that kind.</p>
      {ITEMS.map(([key, label, sub]) => (
        <label key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!prefs[key]}
            onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
            style={{ width: 20, height: 20, marginTop: 2 }}
          />
          <span>
            <strong style={{ fontSize: 14 }}>{label}</strong>
            <br />
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{sub}</span>
          </span>
        </label>
      ))}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
        <button className="btn" onClick={save} style={{ background: "var(--text)", color: "var(--bg)" }}>Save choices</button>
        <span style={{ fontSize: 13 }}>{msg}</span>
      </div>
    </Card>
  );
}
