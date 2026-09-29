export function naira(kobo: number | null | undefined): string {
  if (kobo == null) return "—";
  return "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

export function ActionBadge({ action }: { action: string | null }) {
  const a = (action ?? "NO_SIGNAL").replace("_", " ");
  const cls = `pill pill-${(action ?? "NO_SIGNAL").toLowerCase().replace("_", "-")}`;
  return <span className={cls}>{a}</span>;
}

export function ScoreRing({ score }: { score: number | null }) {
  const s = score ?? 0;
  const off = 251.3 - (251.3 * s) / 100;
  const color = s >= 75 ? "#16a34a" : s >= 65 ? "#2563eb" : s >= 50 ? "#d97706" : "#dc2626";
  return (
    <svg width="72" height="72" viewBox="0 0 96 96" aria-label={`Score ${s}`}>
      <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray="251.3" strokeDashoffset={off} transform="rotate(-90 48 48)" />
      <text x="48" y="56" textAnchor="middle" fontWeight="800" fontSize="24" fill="currentColor">{s}</text>
    </svg>
  );
}

export function Nav() {
  const links = [
    ["Dashboard", "/"],
    ["Explore", "/explore"],
    ["Compare", "/compare"],
    ["Portfolio", "/portfolio"],
    ["Watchlist", "/watchlist"],
    ["Picks", "/picks"],
    ["Premium", "/premium"],
    ["Log in", "/login"],
  ];
  return (
    <nav style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: 24, flexWrap: "wrap" }}>
      {links.map(([label, href]) => (
        <a key={href} href={href} style={{ fontWeight: 700, fontSize: 14 }}>{label}</a>
      ))}
    </nav>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>{children}</div>;
}
