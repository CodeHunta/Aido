"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WatchButton({ ticker, watched, userId }: { ticker: string; watched: boolean; userId: string }) {
  const [on, setOn] = useState(watched);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const url = on ? `/api/v1/watchlist?user=${userId}&ticker=${ticker}` : `/api/v1/watchlist?user=${userId}`;
    const r = await fetch(url, { method: on ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: on ? undefined : JSON.stringify({ ticker }) });
    setBusy(false);
    if (r.ok) setOn(!on);
  }
  return <button className="btn" onClick={toggle} disabled={busy}>{on ? "✓ Watching" : "+ Watch"}</button>;
}

export function HoldingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const r = await fetch(`/api/v1/portfolio?user=${userId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker: String(fd.get("ticker")), qty: Number(fd.get("qty")), avgCostKobo: Math.round(Number(fd.get("price")) * 100) }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      setMsg(`Failed: ${j?.error ?? "check ticker"}`);
      return;
    }
    const d = j?.data ?? {};
    if (d.soldAll) setMsg(`Sold all ${d.soldAll}.`);
    else if (d.accumulated) setMsg(`Now ${d.qty.toLocaleString()} units @ ₦${(d.avgCostKobo / 100).toLocaleString()}.`);
    else setMsg(`Added ${d.added}.`);
    form.reset();
    router.refresh();
  }
  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
      <input name="ticker" placeholder="TICKER" className="input" style={{ width: 110 }} required />
      <input name="qty" placeholder="+Qty buy / -Qty sell" type="number" className="input" style={{ width: 150 }} required />
      <input name="price" placeholder="Price ₦" type="number" step="0.01" className="input" style={{ width: 130 }} required />
      <button className="btn" type="submit">Save</button>
      <span style={{ fontSize: 13 }}>{msg}</span>
    </form>
  );
}

export function RemoveButton({ ticker, kind, userId }: { ticker: string; kind: "portfolio" | "watchlist"; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    const base = kind === "portfolio" ? "/api/v1/portfolio" : "/api/v1/watchlist";
    const r = await fetch(`${base}?user=${userId}&ticker=${ticker}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) router.refresh();
  }
  return <button className="btn" onClick={remove} disabled={busy}>Remove</button>;
}
