import { Card } from "../_ui";
import { Nav } from "../_nav";

export default function Methodology() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>How Aido thinks</h1>
      <Card>
        <h3>Data → Analysis → Recommendation</h3>
        <p>Every stock gets an <strong>Aido Score (0–100)</strong> from six factors: fundamentals 25%, valuation 25%, growth 15%, market behaviour 10%, dividends 10% (20% for income goals), risk 15%. Engine version <strong>v1</strong> — every rating stores its inputs, so nothing is a black box.</p>
        <h3>Opportunity ≠ Suitability</h3>
        <p>A great stock can be wrong <em>for you</em>. Aido scores the market opportunity and your personal fit <strong>separately</strong>. Misfits appear under “Outside Your Profile” — never hidden.</p>
        <h3>Price matters</h3>
        <p>A wonderful company at an excessive price gets HOLD, never BUY. A BUY needs score ≥ 75, fair valuation, solid evidence, and no blocking risk.</p>
        <h3>Confidence, honestly</h3>
        <p>High / Medium / Low reflects evidence strength — not just the score. Thin or stale data caps confidence, and “No strong opportunity this week” is a valid, honest answer.</p>
        <h3>What could go wrong</h3>
        <p>Every recommendation names its key risk, the evidence against it, and what would change the call. History is kept, so you can judge Aido over time.</p>
      </Card>
      <Card>
        <p style={{ fontSize: 14 }}><strong>Important:</strong> Aido provides educational investment intelligence, <strong>not financial advice</strong>. Scores are model outputs with stated confidence and data-as-of dates. Past patterns do not guarantee future results.</p>
      </Card>
    </main>
  );
}
