import { Linking } from "react-native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import { Btn, C, Card, Field, H1, Loading, Sub } from "../lib/ui";

export default function Premium() {
  const { authedFetch, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("…");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = (await authedFetch("/paystack")) as { plan?: string };
      setPlan(p?.plan ?? "free");
    } catch {
      setPlan("?");
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useFocusEffect(
    useCallback(() => {
      setEmail(user?.email ?? "");
      load();
    }, [load, user]),
  );

  async function upgrade() {
    setMsg("Contacting Paystack…");
    try {
      const j = (await authedFetch("/paystack", { method: "POST", body: JSON.stringify({ email }) })) as { url?: string };
      if (j?.url) {
        await Linking.openURL(j.url);
        setMsg("Complete payment in your browser, then come back.");
      } else setMsg("No checkout link returned.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    }
  }

  if (loading) return <Loading />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Premium</H1>
        <Sub>Your plan: {plan}</Sub>
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Free</Text>
          <Text style={{ color: C.muted, fontSize: 14 }}>Market info · weekly market pick · basic watchlist & portfolio</Text>
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Premium: ₦1,500/mo</Text>
          <Text style={{ color: C.muted, fontSize: 14 }}>Full theses · personal picks · advanced alerts · deep history</Text>
          <Field placeholder="Email for receipt" value={email} onChange={setEmail} keyboard="email-address" />
          <Btn title="Upgrade with Paystack" onPress={upgrade} primary />
          {!!msg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{msg}</Text>}
        </Card>
      </View>
    </ScrollView>
  );
}
