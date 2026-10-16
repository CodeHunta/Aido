import { Card } from "./_ui";

export const dynamic = "force-static";

const COBALT = "#0047AB";

function TopBar() {
  return (
    <header className="sticky-nav" style={{ display: "flex", alignItems: "center", gap: 28, padding: "16px 0" }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/aido-logo.png" alt="Aido" style={{ height: 34, width: "auto" }} />
      </a>
      <nav style={{ display: "flex", gap: 24, marginLeft: "auto", alignItems: "center", fontWeight: 700, fontSize: 15 }}>
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="/login">Sign in</a>
        <a href="/signup" className="btn-primary">Get started</a>
      </nav>
    </header>
  );
}

function PreviewMock() {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,71,171,0.12)" }}>
      <div style={{ display: "flex" }}>
        <div style={{ background: "#0A2540", color: "#fff", padding: 20, minWidth: 150 }}>
          <div style={{ fontWeight: 800, marginBottom: 16 }}>◉ Aido</div>
          {["Your pick", "Explore", "Portfolio", "Watchlist", "Alerts"].map((x, i) => (
            <div key={x} style={{ padding: "8px 12px", borderRadius: 10, marginBottom: 6, fontSize: 14, background: i === 0 ? "rgba(255,255,255,0.15)" : "transparent", opacity: i === 0 ? 1 : 0.75 }}>{x}</div>
          ))}
        </div>
        <div style={{ padding: 20, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Your Aido Pick 🎯</strong>
            <span style={{ fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 10px" }}>Product preview</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 12 }}>
            <svg width="84" height="84" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="#16a34a" strokeWidth="10" strokeLinecap="round" strokeDasharray="251.3" strokeDashoffset="60" transform="rotate(-90 48 48)" />
              <text x="48" y="56" textAnchor="middle" fontWeight="800" fontSize="24" fill="currentColor">76</text>
            </svg>
            <div>
              <span className="pill pill-buy">BUY</span> <strong>CONOIL</strong>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Pays 6.1%, which feeds your combination goal</div>
            </div>
          </div>
          <ul style={{ fontSize: 14, marginTop: 12, paddingLeft: 18 }}>
            <li>Earnings accelerating</li>
            <li>Valuation reasonable at this price</li>
            <li><strong>Key risk:</strong> oil-price exposure</li>
          </ul>
          <p style={{ fontSize: 11, color: "var(--muted)" }}>Preview with sample data.</p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 40px" }}>
      <TopBar />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40, alignItems: "center", padding: "48px 0" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: COBALT }}>WELCOME TO AIDO</p>
          <h1 style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: -2, margin: "12px 0" }}>Know what the market means for you.</h1>
          <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 460 }}>
            Aido turns noisy Nigerian stock-market data into clear, personal investment moves:
            BUY, HOLD, SELL or WATCH, always with the why.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <a href="/signup" className="btn-primary btn-lg">Get started</a>
            <a href="#features" className="btn-outline btn-lg">Explore features</a>
          </div>
        </div>
        <PreviewMock />
      </section>

      <section id="features" style={{ textAlign: "center", padding: "32px 0" }}>
        <h2 style={{ fontSize: 34, letterSpacing: -1 }}>Less guessing. More conviction.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24, marginTop: 28, textAlign: "left" }}>
          <Card>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F0FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>◉</div>
            <h3>Opportunity ≠ suitability</h3>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>A great stock can be wrong for you. Aido scores the market and your personal fit separately. Misfits stay visible, never hidden.</p>
          </Card>
          <Card>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F0FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✎</div>
            <h3>Every call explained</h3>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Why now, why for you, what could go wrong, plus the full thesis behind every BUY, HOLD, SELL or WATCH.</p>
          </Card>
          <Card>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#E8F0FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>▦</div>
            <h3>Your portfolio, watched</h3>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>Live values, concentration warnings, and a personal pick every Sunday, with alerts only when something material changes.</p>
          </Card>
        </div>
      </section>

      <section id="how" style={{ padding: "32px 0", maxWidth: 760, margin: "0 auto" }}>
        <h2 style={{ fontSize: 34, letterSpacing: -1 }}>How it works</h2>
        <ol style={{ fontSize: 17, lineHeight: 2 }}>
          <li><strong>1. Create your profile.</strong> Three quick steps: goal, risk, horizon.</li>
          <li><strong>2. Get your Sunday pick.</strong> One stock, scored 0–100, matched to you and your portfolio.</li>
            <li><strong>3. Track and get alerted.</strong> Watchlist pings and rating changes. Never noise.</li>
        </ol>
      </section>

      <section style={{ background: `linear-gradient(120deg,#0A2540,${COBALT})`, borderRadius: 24, padding: "56px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap", marginTop: 24 }}>
        <h2 style={{ color: "#fff", fontSize: 32, margin: 0, maxWidth: 560 }}>Stop guessing the NGX. Start understanding it.</h2>
        <a href="/signup" style={{ background: "#fff", color: COBALT, fontWeight: 800, borderRadius: 14, padding: "14px 28px" }}>Get started</a>
      </section>

      <footer style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "32px 0 8px", fontSize: 13, color: "var(--muted)" }}>
        <span><img src="/aido-logo.png" alt="Aido" style={{ height: 26, width: "auto", verticalAlign: "middle" }} /></span>
        <span>© Aido · Educational intelligence, not financial advice.</span>
      </footer>
    </main>
  );
}
