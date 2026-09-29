import DarkToggle from "./_theme";

const LINKS = [
  ["Explore", "/explore"],
  ["How it works", "/methodology"],
  ["Premium", "/premium"],
];

// Static menu for logged-out pages (login, signup, forgot, reset, premium).
// No session check here so client pages can use it safely.
export function PublicNav() {
  return (
    <nav style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
      {LINKS.map(([label, href]) => (
        <a key={href} href={href} style={{ fontWeight: 700, fontSize: 14 }}>{label}</a>
      ))}
      <a href="/login" style={{ fontWeight: 700, fontSize: 14 }}>Log in</a>
      <a href="/signup" className="btn">Create account</a>
      <DarkToggle />
    </nav>
  );
}
