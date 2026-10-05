"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Something stumbled</h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>
        Aido couldn't load this page right now — usually the database taking too long. Your data is safe.
      </p>
      <button className="btn" onClick={() => reset()}>Try again</button>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>{error.message}</p>
    </main>
  );
}
