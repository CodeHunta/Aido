import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import type { Profile } from "../lib/types";
import { Btn, C, Card, Field, H1, Loading, Sub } from "../lib/ui";

export default function ProfileScreen() {
  const { authedFetch, logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState("moderate");
  const [horizon, setHorizon] = useState("long");
  const [objective, setObjective] = useState("growth");
  const [capital, setCapital] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = (await authedFetch("/profiles/me")) as Profile;
      if (p) {
        setRisk(p.risk);
        setHorizon(p.horizon);
        setObjective(p.objective);
        setFrequency(p.frequency);
        if (p.capitalKobo) setCapital(String(p.capitalKobo / 100));
      }
    } catch {
      // fresh account — defaults stand
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    setMsg("Saving…");
    try {
      await authedFetch("/profiles/me", {
        method: "PUT",
        body: JSON.stringify({ risk, horizon, objective, capitalKobo: Math.round(Number(capital || 0) * 100), frequency }),
      });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  if (loading) return <Loading />;
  const opts = (vals: string[]) => vals.join(" / ");
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Your profile</H1>
        <Sub>{user?.email ?? ""} · Aido matches every stock against this.</Sub>
        <Card>
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Risk: {risk}</Text>
          <Field placeholder="conservative / moderate / aggressive" value={risk} onChange={setRisk} />
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Horizon: {horizon}</Text>
          <Field placeholder="short / medium / long" value={horizon} onChange={setHorizon} />
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Objective: {objective}</Text>
          <Field placeholder="growth / dividend / income / preservation / combination" value={objective} onChange={setObjective} />
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Capital ₦</Text>
          <Field placeholder="e.g. 500000" value={capital} onChange={setCapital} keyboard="numeric" />
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Frequency: {frequency}</Text>
          <Field placeholder="once / monthly / irregular" value={frequency} onChange={setFrequency} />
          <Btn title="Save profile" onPress={save} primary />
          {!!msg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{msg}</Text>}
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Options — risk: {opts(["conservative", "moderate", "aggressive"])}</Text>
        </Card>
        <Btn title="Log out" onPress={logout} />
      </View>
    </ScrollView>
  );
}
