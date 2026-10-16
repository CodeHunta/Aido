import { Card } from "../_ui";
import { Nav } from "../_nav";

export default function Privacy() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Privacy</h1>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>Plain words first. Last updated October 2026.</p>
      <div style={{ display: "grid", gap: 12, marginTop: 12, fontSize: 14, lineHeight: 1.7 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>1. What we store</h3>
          <p>Your name, email and login details. Your investor profile (risk, horizon, goal, capital, frequency). Your portfolio entries, watchlist, alert choices and picks. That is all we need to run Aido.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>2. What we never do</h3>
          <p>We never sell your data. We never share it with advertisers. We never see your bank or brokerage login.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>3. Who else touches it</h3>
          <p>Hosting and email providers process data only to deliver Aido (app hosting, price storage, sending your alerts). Payments go through Paystack under their own policy.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>4. Delete any time</h3>
          <p>Open Profile, scroll to Delete account, type DELETE and confirm. This removes your profile, portfolio, watchlist, alerts and settings for good.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>5. Contact</h3>
          <p>Privacy questions? <a href="/contact">Contact us →</a></p>
        </Card>
      </div>
    </main>
  );
}
