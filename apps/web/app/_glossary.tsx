// Plain-language meanings for beginners. Keep each to 1-2 short sentences. No jargon.
export const GLOSSARY: Record<string, string> = {
  score:
    "0 to 100. Higher means Aido finds it more attractive right now. 75+ can be BUY, 65-74 is WATCH, 50-64 is HOLD, below 40 is weak.",
  BUY: "Aido thinks this looks attractive at today's price, if it fits you. Tap View Analysis to see why.",
  HOLD: "May be a good company, but the price is high now. No need to buy more today.",
  SELL: "Aido thinks you should consider reducing or leaving this. Check why before you act.",
  WATCH: "Interesting, but not strong enough to buy yet. Keep an eye on it.",
  NO_SIGNAL:
    "Nothing strong enough this week. That is normal. Aido does not force a BUY.",
  NO_STRONG_OPPORTUNITY:
    "Nothing strong enough this week. That is normal. Aido does not force a BUY.",
  confidence:
    "How strong the proof is. High = lots of clear proof. Low = little or mixed proof. Low confidence means be careful.",
  suitability:
    "Whether this fits YOUR goal, risk and time. Outside Your Profile means a good stock can still be wrong for you.",
  roe: "How well the company turns your money into profit. Higher % is usually better.",
  margin:
    "From every ₦100 of sales, how much stays as profit. Higher % usually means a stronger business.",
  debt: "How much the company borrows compared to what it owns. Lower is usually safer.",
  yield:
    "Yearly cash payout compared to price. 5% means about ₦5 each year for every ₦100 of price.",
  volatility:
    "How much the price jumps up and down. Big jumps mean higher risk, especially if you need money soon.",
  pe: "How many years of profit you pay for today. Lower can mean cheaper, but always check why it is low.",
  price: "Latest price we have. NGX prices update after market close and are a little delayed.",
  allocation:
    "How your money is spread. If one place has too much, one bad event hurts you more.",
  concentration:
    "Too much money in one stock or sector. Aido warns you when one part is over 25%.",
  gain: "How much you have made or lost compared to what you paid. Green is gain, red is loss.",
  dividend:
    "Cash a company pays you for holding its stock. Not every company pays it.",
};

// Honest data labels: price is real delayed NGX, company numbers are still examples.
// Keep wording beginner-friendly. No jargon.
export function DataHonesty({ source, asOf }: { source: string | null; asOf: string | null }) {
  const real = source === "ngx-delayed";
  return (
    <div
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderRadius: 12,
        fontSize: 13,
        lineHeight: 1.5,
        border: "1px solid var(--border)",
        background: real ? "#f0fdf4" : "#fffbeb",
      }}
    >
      {real ? (
        <span>
          <strong>Price: real NGX price</strong> (a little delayed, updates after market close{asOf ? ` · ${asOf}` : ""}).{" "}
          <strong>Company profits, debts and dividends below are still examples</strong>. Please do not use them for big money decisions yet.
        </span>
      ) : (
        <span>
          <strong>Price: example, not real{asOf ? ` · ${asOf}` : ""}.</strong> Company numbers below are also examples. This stock is delisted or still on sample data.
        </span>
      )}
    </div>
  );
}

export function Tip({ term, label }: { term: keyof typeof GLOSSARY | string; label?: string }) {
  const text = GLOSSARY[term] ?? String(term);
  return (
    <details
      style={{ display: "inline-block", marginLeft: 6, fontSize: 12, fontWeight: 400 }}
    >
      <summary
        title={text}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          border: "1px solid var(--border)",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 800,
          listStyle: "none",
          verticalAlign: "middle",
        }}
      >
        {label ?? "?"}
      </summary>
      <span
        style={{
          display: "block",
          marginTop: 6,
          padding: "8px 10px",
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--card)",
          color: "var(--text)",
          fontSize: 13,
          lineHeight: 1.5,
          maxWidth: 300,
        }}
      >
        {text}
      </span>
    </details>
  );
}
