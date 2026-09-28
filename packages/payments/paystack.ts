import { createHmac } from "node:crypto";

// Paystack Premium. Without PAYSTACK_SECRET_KEY every call fails closed with a
// clear message (never charges, never upgrades) — add test keys to enable.
const HOST = "https://api.paystack.co";

function key(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY missing — add Paystack test keys to .env");
  return k;
}

export async function initializePayment(opts: { email: string; amountKobo: number; userId: string }): Promise<{ url: string; reference: string }> {
  const res = await fetch(`${HOST}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "content-type": "application/json" },
    body: JSON.stringify({ email: opts.email, amount: opts.amountKobo, metadata: { userId: opts.userId } }),
  });
  const j = (await res.json()) as { status: boolean; message: string; data: { authorization_url: string; reference: string } };
  if (!j.status) throw new Error(`Paystack: ${j.message}`);
  return { url: j.data.authorization_url, reference: j.data.reference };
}

export async function verifyPayment(reference: string): Promise<{ paid: boolean; email: string; amountKobo: number; userId: string }> {
  const res = await fetch(`${HOST}/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${key()}` } });
  const j = (await res.json()) as { status: boolean; data: { status: string; customer: { email: string }; amount: number; metadata: { userId: string } } };
  const ok = j.status && j.data.status === "success";
  return { paid: ok, email: j.data.customer.email, amountKobo: j.data.amount, userId: j.data.metadata.userId };
}

// Webhook authenticity (Paystack signs with the secret key)
export function validWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const digest = createHmac("sha512", secret).update(rawBody).digest("hex");
  return digest === signature;
}
