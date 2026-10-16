import { Card } from "../_ui";
import { GLOSSARY } from "../_glossary";
import { Nav } from "../_nav";

export default function Methodology() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>How Aido thinks</h1>
      <Card>
        <h3>Data → Analysis → Recommendation</h3>
        <p>Every stock gets an <strong>Aido Score (0–100)</strong> from six factors: fundamentals 25%, valuation 25%, growth 15%, market behaviour 10%, dividends 10% (20% for income goals), risk 15%. Engine version <strong>v1</strong>. Every rating stores its inputs, so nothing is a black box.</p>
        <h3>Opportunity ≠ Suitability</h3>
        <p>A great stock can be wrong <em>for you</em>. Aido scores the market opportunity and your personal fit <strong>separately</strong>. Misfits appear under “Outside Your Profile”. They are never hidden.</p>
        <h3>Price matters</h3>
        <p>A wonderful company at an excessive price gets HOLD, never BUY. A BUY needs score ≥ 75, fair valuation, solid evidence, and no blocking risk.</p>
        <h3>Confidence, honestly</h3>
        <p>High / Medium / Low reflects evidence strength, not just the score. Thin or stale data caps confidence, and “No strong opportunity this week” is a valid, honest answer.</p>
        <h3>What could go wrong</h3>
        <p>Every recommendation names its key risk, the evidence against it, and what would change the call. History is kept, so you can judge Aido over time.</p>
      </Card>
      <Card>
        <h3>What is real today, what is still an example</h3>
        <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 18 }}>
          <li><strong>Real:</strong> prices for all NGX stocks, ETFs and REITs from the official price list. It arrives a little delayed and updates after market close.</li>
          <li><strong>Example:</strong> WAPCO, FLOURMILL and MRS prices (delisted, kept as marked examples).</li>
          <li><strong>Example:</strong> company profits, debts, margins and dividends. They are still sample shapes until we connect company reports. Scores use them, so treat BUY and HOLD with care for big money.</li>
          <li>Every price keeps its source. Old sample history was rescaled once to meet the first real price (shape kept, level fixed). Returns were not changed.</li>
        </ul>
      </Card>
      <Card>
        <h3>Plain meanings (tap any word you see with ? in the app)</h3>
        <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 18 }}>
          {Object.entries(GLOSSARY).map(([k, v]) => (
            <li key={k}><strong>{k}</strong>: {v}</li>
          ))}
        </ul>
      </Card>
      <Card>
        <p style={{ fontSize: 14 }}><strong>Important:</strong> Aido provides educational investment intelligence, <strong>not financial advice</strong>. Scores are model outputs with stated confidence and data-as-of dates. Past patterns do not guarantee future results.</p>
      </Card>
    </main>
  );
}
