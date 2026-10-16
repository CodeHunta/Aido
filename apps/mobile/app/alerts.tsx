import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import type { AlertItem } from "../lib/types";
import { Btn, C, Card, Empty, H1, Loading, Sub } from "../lib/ui";

const PREF_ITEMS: [string, string, string][] = [
  ["weeklyPick", "Sunday pick", "Your personal pick each Sunday."],
  ["recChange", "Rating change", "When Aido changes its mind."],
  ["priceMove", "Big price move", "Watched stock jumps or falls a lot."],
  ["dividend", "Dividend news", "Dividend declared or paid."],
  ["news", "Big company news", "Results and major announcements."],
];

export default function Alerts() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AlertItem[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ weeklyPick: true, recChange: true, priceMove: true, dividend: true, news: true });
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [alertsR, prefsR] = await Promise.allSettled([authedFetch("/alerts"), authedFetch("/alerts/settings")]);
      if (alertsR.status === "rejected") {
        setRows([]);
        setFailed(true);
        return;
      }
      const alertsData = alertsR.value;
      setRows(Array.isArray(alertsData) ? (alertsData as AlertItem[]) : []);
      if (prefsR.status === "fulfilled" && prefsR.value && typeof prefsR.value === "object") setPrefs(prefsR.value as Record<string, boolean>);
    } catch {
      setRows([]);
      setFailed(true);
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
      await authedFetch("/alerts/settings", { method: "PATCH", body: JSON.stringify(prefs) });
      setMsg("Saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save.");
    }
  }

  if (loading) return <Loading />;
  if (failed && rows.length === 0)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <H1>Alerts</H1>
        <Empty
          title="Could not reach Aido"
          body="Check your internet. The computer running Aido may also be asleep."
          action={<Btn title="Try again" onPress={load} primary />}
        />
      </View>
    );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Alerts</H1>
        <Sub>Only when something material changes.</Sub>
        <Card>
          <Text style={{ fontWeight: "800", color: C.text, marginBottom: 4 }}>What should Aido tell you about?</Text>
          {PREF_ITEMS.map(([key, label, sub]) => (
            <Pressable key={key} onPress={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))} style={{ flexDirection: "row", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, alignItems: "flex-start" }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: prefs[key] ? C.cobalt : C.card, alignItems: "center", justifyContent: "center" }}>
                {prefs[key] ? <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: C.text }}>{label}</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>{sub}</Text>
              </View>
            </Pressable>
          ))}
          <Btn title="Save choices" onPress={save} primary />
          {!!msg && <Text style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{msg}</Text>}
        </Card>
        {rows.length === 0 ? (
          <Empty title="All quiet" body="Weekly picks, rating switches and watchlist moves land here." />
        ) : (
          rows.map((a) => (
            <Card key={a.id}>
              <Text style={{ fontSize: 12, color: C.muted }}>{a.type.replace("_", " ")} · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</Text>
              <Text style={{ fontWeight: "800", color: C.text, marginTop: 4 }}>{a.title}</Text>
              {!!a.body && <Text style={{ color: C.muted, fontSize: 14 }}>{a.body}</Text>}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
