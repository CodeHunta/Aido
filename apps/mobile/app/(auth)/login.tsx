import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { useAuth } from "../../lib/auth";
import { Btn, C, Card, Field, H1, Screen, Sub } from "../../lib/ui";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <H1>Log in</H1>
      <Sub>Welcome back to your NGX intelligence.</Sub>
      <Card>
        <Field placeholder="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Field placeholder="Password" value={password} onChange={setPassword} secret />
        <Btn title={busy ? "Logging in…" : "Log in"} onPress={submit} disabled={busy} primary />
        {!!msg && <Text style={{ color: C.sell, fontSize: 13, marginTop: 8 }}>{msg}</Text>}
      </Card>
      <Link href="/(auth)/signup" style={{ color: C.cobalt, fontWeight: "700", marginTop: 4 }}>
        New here? Create account →
      </Link>
      <Link href="/forgot" style={{ color: C.cobalt, fontWeight: "700", marginTop: 12 }}>
        Forgot password?
      </Link>
      <Link href="/methodology" style={{ color: C.muted, marginTop: 12, fontSize: 13 }}>
        How Aido thinks →
      </Link>
    </Screen>
  );
}
