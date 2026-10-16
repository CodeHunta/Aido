"use client";
import { useState } from "react";
import { Card } from "../_ui";

export const SUPPORT_EMAIL = "manstylo@gmail.com";

export default function ContactForm() {
  const [ticker, setTicker] = useState("");
  const [seen, setSeen] = useState("");
  const [expected, setExpected] = useState("");
  const [msg, setMsg] = useState("");

  function report() {
    if (!ticker.trim() || !seen.trim()) {
      setMsg("Tell us the stock and what you saw, then press the button.");
      return;
    }
    const subject = encodeURIComponent(`Wrong data report: ${ticker.trim().toUpperCase()}`);
    const body = encodeURIComponent(`Stock: ${ticker.trim().toUpperCase()}\nWhat I saw: ${seen.trim()}\nWhat I expected: ${expected.trim() || "(not sure)"}\nPage date: ${new Date().toLocaleString()}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setMsg("Your email app should open now with everything filled in. Just press send.");
  }

  return (
    <>
      <Card>
        <h3 style={{ marginTop: 0 }}>Talk to a human</h3>
        <p style={{ fontSize: 14 }}>Email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We read everything and answer on working days. Wrong price reports jump the queue.</p>
      </Card>
      <div style={{ height: 16 }} />
      <Card>
        <h3 style={{ marginTop: 0 }}>Report wrong data</h3>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Fill this in, press the button, and your email app opens with the report ready to send.</p>
        <div style={{ display: "grid", gap: 8 }}>
          <input className="input" placeholder="Stock ticker, e.g. GTCO" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
          <input className="input" placeholder="What did you see? e.g. price shows ₦0" value={seen} onChange={(e) => setSeen(e.target.value)} />
          <input className="input" placeholder="What did you expect? (optional)" value={expected} onChange={(e) => setExpected(e.target.value)} />
          <button className="btn" type="button" onClick={report} style={{ background: "var(--text)", color: "var(--bg)" }}>Open report email</button>
          <span style={{ fontSize: 13 }}>{msg}</span>
        </div>
      </Card>
    </>
  );
}
