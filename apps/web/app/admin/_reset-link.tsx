"use client";

import { useState } from "react";

// Asks the server for a fresh one-hour reset link and shows it with a copy
// button. No email is sent, so the admin passes the link on themselves.
export function ResetLinkButton({ userId, email }: { userId?: string; email?: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function make() {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/admin/reset-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(userId ? { userId } : { email }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; url?: string; error?: string } | null;
      if (!res.ok || !body?.url) throw new Error(body?.error ?? "Could not create a link");
      setUrl(body.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create a link");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={make}
        disabled={busy}
        style={{ fontSize: 12, fontWeight: 700, padding: "5px 9px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: busy ? "wait" : "pointer" }}
      >
        {busy ? "Creating…" : "Reset link"}
      </button>
      {error ? <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{error}</div> : null}
      {url ? (
        <div style={{ marginTop: 6 }}>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            style={{ width: "100%", fontSize: 12, padding: "6px 8px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" }}
          />
          <button
            type="button"
            onClick={copy}
            style={{ marginTop: 4, fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--cobalt)", cursor: "pointer" }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
