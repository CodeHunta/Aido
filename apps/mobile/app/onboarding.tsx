import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { Btn, C, Card, Field, H1, Screen, Sub } from "../lib/ui";

const OBJECTIVES = [["growth", "Grow my money"], ["dividend", "Dividends"], ["income", "Regular income"], ["preservation", "Keep it safe"], ["combination", "A mix"]];
const RISKS = [["conservative", "Careful"], ["moderate", "Balanced"], ["aggressive", "Bold"]];
const HORIZONS = [["short", "Under 1 year"], ["medium", "1–5 years"], ["long", "5+ years"]];
const FREQS = [["once", "One-off"], ["monthly", "Monthly"], ["irregular", "When I can"]];

function Pick({ opts, value, onPick }: { opts: string[][]; value: string; onPick: (v: string) => void }) {
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {opts.map(([v, label]) => (
        <Pressable key={v} onPress={() => onPick(v ?? "")} style={{ borderWidth: 1, borderColor: value === v ? C.cobalt : C.border, backgroundColor: value === v ? "#E8F0FE" : C.card, borderRadius: 12, padding: 12 }}>
          <Text style={{ fontWeight: "700", color: C.text }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Onboarding() {
  const { authedFetch } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState("growth");
  const [capital, setCapital] = useState("");
  const [risk, setRisk] = useState("moderate");
  const [horizon, setHorizon] = useState("long");
  const [frequency, setFrequency] = useState("monthly");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (busy) return;
    setBusy(true);
    setMsg("Saving…");
    try {
      await authedFetch("/profiles/me", {
        method: "PUT",
        body: JSON.stringify({ risk, horizon, objective, capitalKobo: Math.round(Number(capital || 0) * 100), frequency }),
      });
      router.replace("/(tabs)");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Sub>
        STEP {step} OF 3
      </Sub>
      <H1>{step === 1 ? "What are you investing for?" : step === 2 ? "How much risk feels right?" : "How will you invest?"}</H1>
      <Card>
        {step === 1 && (
          <>
            <Pick opts={OBJECTIVES} value={objective} onPick={setObjective} />
            <Sub>Starting amount in ₦</Sub>
            <Field placeholder="e.g. 500000" value={capital} onChange={setCapital} keyboard="numeric" />
          </>
        )}
        {step === 2 && (
          <>
            <Pick opts={RISKS} value={risk} onPick={setRisk} />
            <Pick opts={HORIZONS} value={horizon} onPick={setHorizon} />
          </>
        )}
        {step === 3 && <Pick opts={FREQS} value={frequency} onPick={setFrequency} />}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
          {step > 1 ? <Btn title="← Back" onPress={() => setStep(step - 1)} /> : <View />}
          {step < 3 ? <Btn title="Next →" onPress={() => setStep(step + 1)} primary /> : <Btn title={busy ? "Saving…" : "Finish →"} onPress={finish} disabled={busy} primary />}
        </View>
        {!!msg && <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{msg}</Text>}
      </Card>
    </Screen>
  );
}
