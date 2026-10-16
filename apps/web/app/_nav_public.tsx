import DarkToggle from "./_theme";

const LINKS = [
  ["Explore", "/explore"],
  ["How it works", "/methodology"],
  ["Premium", "/premium"],
  ["Help", "/help"],
];

// Static menu for logged-out pages (login, signup, forgot, reset, premium).
// No session check here so client pages can use it safely.
export function PublicNav() {
  return (
    <nav className="sticky-nav" style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
      <a href="/" style={{ display: "inline-flex", alignItems: "center" }}>
        <img src="/aido-logo.png" alt="Aido" style={{ height: 26, width: "auto" }} />
      </a>
      {LINKS.map(([label, href]) => (
        <a key={href} href={href} style={{ fontWeight: 700, fontSize: 14 }}>{label}</a>
      ))}
      <a href="/login" style={{ fontWeight: 700, fontSize: 14 }}>Log in</a>
      <a href="/signup" className="btn">Create account</a>
      <DarkToggle />
    </nav>
  );
}
