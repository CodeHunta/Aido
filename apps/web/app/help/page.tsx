import { Card } from "../_ui";
import { Nav } from "../_nav";

const FAQS: [string, string][] = [
  ["What is Aido?", "Aido turns noisy Nigerian stock market data into clear personal moves: BUY, HOLD, SELL or WATCH, always with the reason why. It is learning help, not advice from a licensed advisor."],
  ["What does the score mean?", "0 to 100. Higher means Aido finds the stock more attractive right now. 75 or more can be a BUY, 65 to 74 is WATCH, 50 to 64 is HOLD, below 40 is weak. Tap any ? in the app for plain meanings."],
  ["What does BUY mean?", "Aido thinks the stock looks attractive at today's price, if it fits you. Always open View Analysis first and check the key risk before you act."],
  ["Why does Aido say Outside Your Profile?", "A good stock can still be wrong for you. That label means the stock clashes with your goal, risk level, or time. It stays visible so you can still learn from it."],
  ["Is the data real?", "Prices are real NGX prices, a little delayed. Company profits, debts and dividends are still examples until we connect company reports. Every stock page says exactly what is real. See How Aido Thinks for the full list."],
  ["When do I get my pick?", "Every Sunday. Your personal pick appears on the dashboard and the Picks page, plus an alert and email if you keep those switched on. Some weeks honestly say no strong opportunity."],
  ["How do I stop some messages?", "Open Alerts and use the switches at the top. Off means no app message, no email and no phone buzz for that kind."],
  ["How do I change my investor profile?", "Open Profile and edit risk, horizon, goal, capital or frequency any time. Aido re matches every stock at once."],
  ["How do I delete my account?", "Open Profile, scroll to Delete account, type DELETE and confirm. This removes your profile, portfolio, watchlist, alerts and settings for good."],
  ["Something looks wrong. What do I do?", "Use the Contact page to report it. Tell us the stock, what you saw, and what you expected. Reports about wrong prices jump the queue."],
];

export default function Help() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <Nav />
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Help</h1>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Short answers for beginners. Still stuck? <a href="/contact">Contact us →</a></p>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {FAQS.map(([q, a]) => (
          <Card key={q}>
            <h3 style={{ marginTop: 0 }}>{q}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{a}</p>
          </Card>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>
        <a href="/methodology">How Aido thinks →</a> · <a href="/terms">Terms →</a> · <a href="/privacy">Privacy →</a>
      </p>
    </main>
  );
}
