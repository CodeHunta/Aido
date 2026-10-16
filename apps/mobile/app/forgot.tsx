import { useState } from "react";
import { Text } from "react-native";
import { webBase } from "../lib/api";
import { Btn, Card, Field, H1, Screen, Sub } from "../lib/ui";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMsg("Sending…");
    try {
      const res = await fetch(`${webBase()}/api/auth/forget-password`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), redirectTo: "/reset" }),
      });
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } | string } | null;
      if (!res.ok) {
        const err = body?.error;
        throw new Error(typeof err === "string" ? err : (err?.message ?? "Could not send the link."));
      }
      setMsg("Check your email for the reset link. It opens in your browser.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not send the link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>Forgot password</H1>
      <Sub>We will email you a link to choose a new one.</Sub>
      <Card>
        <Field placeholder="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Btn title={busy ? "Sending…" : "Send reset link"} onPress={submit} disabled={busy} primary />
        {!!msg && <Text style={{ fontSize: 13, marginTop: 8 }}>{msg}</Text>}
      </Card>
    </Screen>
  );
}
