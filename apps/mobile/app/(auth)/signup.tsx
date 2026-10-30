import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { useAuth } from "../../lib/auth";
import { Btn, C, Card, Field, H1, Screen, Sub } from "../../lib/ui";

export default function Signup() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    if (password.length < 8) {
      setMsg("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await signup(name.trim(), email.trim(), password);
      router.replace("/onboarding");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen center>
      <H1>Create account</H1>
      <Sub>Free to start. Thirty seconds.</Sub>
      <Card>
        <Field placeholder="Name" value={name} onChange={setName} />
        <Field placeholder="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Field placeholder="Password (8+ chars)" value={password} onChange={setPassword} secret />
        <Btn title={busy ? "Creating…" : "Sign up"} onPress={submit} disabled={busy} primary />
        {!!msg && <Text style={{ color: C.sell, fontSize: 13, marginTop: 8 }}>{msg}</Text>}
      </Card>
      <Link href="/(auth)/login" style={{ color: C.cobalt, fontWeight: "700", marginTop: 4 }}>
        Have an account? Log in →
      </Link>
    </Screen>
  );
}
