import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/auth";
import type { AlertItem } from "../lib/types";
import { C, Card, Empty, H1, Loading, Sub } from "../lib/ui";

export default function Alerts() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AlertItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authedFetch("/alerts");
      setRows(Array.isArray(data) ? (data as AlertItem[]) : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <Loading />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Alerts</H1>
        <Sub>Only when something material changes.</Sub>
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
