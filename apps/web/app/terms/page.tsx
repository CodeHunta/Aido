import { Card } from "../_ui";
import { Nav } from "../_nav";

export default function Terms() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Terms</h1>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>Plain words first. Last updated October 2026.</p>
      <div style={{ display: "grid", gap: 12, marginTop: 12, fontSize: 14, lineHeight: 1.7 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>1. Learning help, not financial advice</h3>
          <p>Aido gives educational investment intelligence. Scores and BUY, HOLD, SELL or WATCH calls are model outputs. They are not advice from a licensed advisor. Talk to one before big money decisions.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>2. Data honesty</h3>
          <p>Prices are real NGX prices, a little delayed. Company profits, debts and dividends are still examples. Every stock page labels what is real. Do not treat example numbers as facts.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>3. Your account</h3>
          <p>You keep your login details safe. One account per person during beta. Free accounts get basic features. Premium unlocks deeper intelligence and bills monthly through Paystack until you cancel.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>4. Fair use</h3>
          <p>Use Aido for your own learning. Do not copy, resell or scrape the analysis, and do not abuse the service or other users.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>5. Beta reality</h3>
          <p>Aido runs in beta. Features can change, scores can be wrong, and the service can pause for fixes. Past patterns do not guarantee future results.</p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>6. Contact</h3>
          <p>Questions about these terms? <a href="/contact">Contact us →</a></p>
        </Card>
      </div>
    </main>
  );
}
