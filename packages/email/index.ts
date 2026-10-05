// Transactional email. Provider picked automatically:
// 1. SendGrid (SENDGRID_API_KEY) — verified Gmail sender, no domain.
// 2. Mailjet (MJ_APIKEY_PUBLIC) — verified Gmail sender, no domain.
// 3. ZeptoMail (ZEPTOMAIL_API_KEY) — needs domain + credits.
// 4. Log — never blocks local dev (Phase 7).
export interface Email {
  to: string;
  subject: string;
  html: string;
}

const ZEPTO_API = "https://api.zeptomail.com/v1.1/email";
const SENDGRID_API = "https://api.sendgrid.com/v3/mail/send";

export async function sendEmail(email: Email): Promise<{ sent: boolean; via: string }> {
  if (process.env.SENDGRID_API_KEY) return sendViaSendGrid(email);
  if (process.env.MJ_APIKEY_PUBLIC) return sendViaMailjet(email);
  if (process.env.ZEPTOMAIL_API_KEY) return sendViaZeptoMail(email);
  console.log(`[email:log] to=${email.to} subject="${email.subject}"`);
  console.log(email.html.slice(0, 300));
  return { sent: false, via: "log" };
}

async function sendViaSendGrid(email: Email): Promise<{ sent: boolean; via: string }> {
  const key = process.env.SENDGRID_API_KEY!;
  const from = process.env.SENDGRID_FROM ?? process.env.ZEPTOMAIL_FROM ?? "noreply@example.com";
  const res = await fetch(SENDGRID_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.to }] }],
      from: { email: from },
      subject: email.subject,
      content: [{ type: "text/html", value: email.html }],
    }),
  });
  if (res.status === 202) return { sent: true, via: "sendgrid" };
  console.error(`[email] SendGrid failed: ${res.status} ${await res.text()}`);
  return { sent: false, via: "sendgrid-error" };
}

async function sendViaMailjet(email: Email): Promise<{ sent: boolean; via: string }> {
  const pub = process.env.MJ_APIKEY_PUBLIC!;
  const priv = process.env.MJ_APIKEY_PRIVATE!;
  const from = process.env.MJ_FROM ?? process.env.ZEPTOMAIL_FROM ?? "noreply@example.com";
  const res = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${pub}:${priv}`).toString("base64"), "content-type": "application/json" },
    body: JSON.stringify({ Messages: [{ From: { Email: from, Name: "Aido" }, To: [{ Email: email.to }], Subject: email.subject, HTMLPart: email.html }] }),
  });
  if (res.ok) return { sent: true, via: "mailjet" };
  console.error(`[email] Mailjet failed: ${res.status} ${await res.text()}`);
  return { sent: false, via: "mailjet-error" };
}

async function sendViaZeptoMail(email: Email): Promise<{ sent: boolean; via: string }> {
  const key = process.env.ZEPTOMAIL_API_KEY!;
  const from = process.env.ZEPTOMAIL_FROM ?? "noreply@example.com";
  const res = await fetch(ZEPTO_API, {
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

export function resetPasswordHtml(url: string): string {
  return `<h2>Reset your Aido password</h2><p>Someone asked to reset this account's password. If that was you, choose a new one here:</p><p><a href="${url}">Set a new password →</a></p><p style="color:#888">Link expires in 1 hour. If it wasn't you, ignore this email.</p>`;
}
