import { headers } from "next/headers";
import { auth } from "@aido/auth/auth";
import DarkToggle from "./_theme";

const APP_LINKS = [
  ["Dashboard", "/"],
  ["Explore", "/explore"],
  ["Compare", "/compare"],
  ["Portfolio", "/portfolio"],
  ["Watchlist", "/watchlist"],
  ["Picks", "/picks"],
  ["Alerts", "/alerts"],
  ["Premium", "/premium"],
  ["Profile", "/profile"],
];

const PUBLIC_LINKS = [
  ["Explore", "/explore"],
  ["How it works", "/methodology"],
  ["Premium", "/premium"],
];

// Logged out: only public pages + a way in. Logged in: the full product.
export async function Nav() {
  let authed = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    authed = !!session?.user;
  } catch {
    authed = false;
  }
  const links = authed ? APP_LINKS : PUBLIC_LINKS;
  return (
    <nav style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--border)", marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
      {links.map(([label, href]) => (
        <a key={href} href={href} style={{ fontWeight: 700, fontSize: 14 }}>{label}</a>
      ))}
      {authed ? null : (
        <>
          <a href="/login" style={{ fontWeight: 700, fontSize: 14 }}>Log in</a>
          <a href="/signup" className="btn">Create account</a>
        </>
      )}
      <DarkToggle />
    </nav>
  );
}
