import { getProfile } from "@aido/db/traits";
import { Nav } from "../_ui";
import { currentUserId } from "../lib/session";
import ProfileEditor from "./_editor";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const p = await getProfile(await currentUserId());
  const initial = {
    risk: p?.risk ?? "moderate",
    horizon: p?.horizon ?? "long",
    objective: p?.objective ?? "growth",
    capitalKobo: p?.capitalKobo ?? 0,
    frequency: p?.frequency ?? "monthly",
  };
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Your profile</h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Aido matches every stock against this. Change it anytime.</p>
      <ProfileEditor initial={initial} />
    </main>
  );
}
