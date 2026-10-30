import { useState } from "react";
import { Text } from "react-native";
import { webBase } from "../lib/api";
import { Btn, C, Card, Field, H1, Screen, Sub } from "../lib/ui";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    setDone(false);
    try {
      const res = await fetch(`${webBase()}/api/v1/password-reset-request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !body?.ok) throw new Error(body?.error ?? "Could not record your request.");
      setDone(true);
      setMsg("Request received. Support will send a reset link to this email, usually within a working day.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not record your request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen center>
      <H1>Forgot password</H1>
      <Sub>Tell us the email on your account and we will send a reset link.</Sub>
      <Card>
        <Field placeholder="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Btn title={busy ? "Sending…" : "Request reset link"} onPress={submit} disabled={busy || !email.trim()} primary />
        {!!msg && <Text style={{ fontSize: 13, marginTop: 8, color: done ? C.buyFg : C.sell }}>{msg}</Text>}
        {done ? <Text style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>In a hurry? Email manstylo@gmail.com and mention the address above.</Text> : null}
      </Card>
    </Screen>
  );
}
