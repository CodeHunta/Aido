// Transactional email. Uses ZeptoMail when ZEPTOMAIL_API_KEY is set,
// otherwise logs to console so local dev never blocks (Phase 7).
export interface Email {
  to: string;
  subject: string;
  html: string;
}

const API = "https://api.zeptomail.com/v1.1/email";

export async function sendEmail(email: Email): Promise<{ sent: boolean; via: string }> {
  const key = process.env.ZEPTOMAIL_API_KEY;
  const from = process.env.ZEPTOMAIL_FROM ?? "noreply@example.com";
  if (!key) {
    console.log(`[email:log] to=${email.to} subject="${email.subject}"`);
    console.log(email.html.slice(0, 300));
    return { sent: false, via: "log" };
  }
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: key.startsWith("Zoho-enczapikey") ? key : `Zoho-enczapikey ${key}` },
    body: JSON.stringify({ from: { address: from }, to: [{ email_address: { address: email.to } }], subject: email.subject, htmlbody: email.html }),
  });
  if (!res.ok) {
    console.error(`[email] ZeptoMail failed: ${res.status} ${await res.text()}`);
    return { sent: false, via: "zeptomail-error" };
  }
  return { sent: true, via: "zeptomail" };
}

export function weeklyPickHtml(user: string, pick: { ticker: string; score: number; action: string } | null, market: { ticker: string; score: number } | null): string {
  return `<h2>Your Aido Pick is in 🎯</h2>${
    pick
      ? `<p><strong>${pick.ticker} — ${pick.action}</strong> · ${pick.score}/100</p><p><a href="/picks">View recommendation →</a></p>`
      : `<p><strong>No strong opportunity this week.</strong> Aido would rather say nothing than push a weak BUY.</p>`
  }${market ? `<hr/><p>Aido Pick of the Week (market): <strong>${market.ticker} — ${market.score}/100</strong></p>` : ""}<p style="color:#888">Profile: ${user}. Educational intelligence, not financial advice.</p>`;
}

export function recChangeHtml(ticker: string, from: string, to: string, reason: string): string {
  return `<h2>Aido changed ${ticker}: ${from} → ${to}</h2><p>${reason}</p><p><a href="/stocks/${ticker}">See what changed →</a></p>`;
}
