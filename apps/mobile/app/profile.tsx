import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import type { Profile } from "../lib/types";
import { Btn, C, Card, Field, H1, Loading, Sub } from "../lib/ui";

export default function ProfileScreen() {
  const { authedFetch, logout, changePassword, deleteAccount, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState("moderate");
  const [horizon, setHorizon] = useState("long");
  const [objective, setObjective] = useState("growth");
  const [capital, setCapital] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [age, setAge] = useState("");
  const [msg, setMsg] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delMsg, setDelMsg] = useState("");

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
        if (p.age != null) setAge(String(p.age));
      }
    } catch {
      // fresh account, so defaults stand
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
    const ageNum = age.trim() === "" ? null : Math.trunc(Number(age));
    if (ageNum !== null && (!Number.isFinite(ageNum) || ageNum < 13 || ageNum > 120)) {
      setMsg("Age must be between 13 and 120, or leave it blank.");
      return;
    }
    setMsg("Saving…");
    try {
      await authedFetch("/profiles/me", {
        method: "PUT",
        body: JSON.stringify({ risk, horizon, objective, capitalKobo: Math.round(Number(capital || 0) * 100), frequency, age: ageNum }),
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
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Age (optional)</Text>
          <Field placeholder="e.g. 34" value={age} onChange={setAge} keyboard="numeric" maxLength={3} />
          <Text style={{ fontWeight: "700", color: C.text, marginBottom: 4 }}>Frequency: {frequency}</Text>
          <Field placeholder="once / monthly / irregular" value={frequency} onChange={setFrequency} />
          <Btn title="Save profile" onPress={save} primary />
          {!!msg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{msg}</Text>}
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Options. Risk: {opts(["conservative", "moderate", "aggressive"])}</Text>
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Change password</Text>
          <Field placeholder="Current password" value={currentPw} onChange={setCurrentPw} secret />
          <Field placeholder="New password (8+ chars)" value={nextPw} onChange={setNextPw} secret />
          <Btn
            title="Change password"
            onPress={async () => {
              if (nextPw.length < 8) {
                setPwMsg("New password needs at least 8 characters.");
                return;
              }
              setPwMsg("Saving…");
              try {
                await changePassword(currentPw, nextPw);
                setPwMsg("Password changed.");
                setCurrentPw("");
                setNextPw("");
              } catch (e) {
                setPwMsg(e instanceof Error ? e.message : "Could not change it.");
              }
            }}
            primary
          />
          {!!pwMsg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{pwMsg}</Text>}
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Delete account</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>This removes your profile, portfolio, watchlist, alerts and settings for good. This cannot be undone.</Text>
          <Field placeholder="Type DELETE to confirm" value={delConfirm} onChange={setDelConfirm} autoCapitalize="characters" maxLength={6} />
          <Btn
            title="Delete my account"
            onPress={async () => {
              if (delConfirm.trim().toUpperCase() !== "DELETE") {
                setDelMsg("Type DELETE in the box to confirm.");
                return;
              }
              setDelMsg("Deleting…");
              try {
                await deleteAccount();
              } catch (e) {
                setDelMsg(e instanceof Error ? e.message : "Could not delete.");
              }
            }}
          />
          {!!delMsg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{delMsg}</Text>}
        </Card>
        <Btn title="Log out" onPress={logout} />
      </View>
    </ScrollView>
  );
}
