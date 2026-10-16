import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import type { Stock } from "../../lib/types";
import { ActionBadge, C, Card, Empty, H1, Loading, Sub, naira } from "../../lib/ui";

export default function Watchlist() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Stock[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authedFetch("/watchlist");
      setRows(Array.isArray(data) ? (data as Stock[]) : []);
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

  async function remove(ticker: string) {
    await authedFetch(`/watchlist?ticker=${ticker}`, { method: "DELETE" }).catch(() => null);
    await load();
  }

  if (loading) return <Loading />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Watchlist</H1>
        <Sub>Aido pings you only when something material changes.</Sub>
        {rows.length === 0 ? (
          <Empty title="Nothing watched" body="Open any stock and tap Watch. Aido alerts you on rating switches and big moves." action={<Link href="/(tabs)/explore" style={{ color: C.cobalt, fontWeight: "700", marginTop: 8 }}>Find stocks →</Link>} />
        ) : (
          rows.map((t) => (
            <Card key={t.ticker}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Link href={`/stocks/${t.ticker}`} style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{t.ticker}</Link>
                  <Text style={{ color: C.muted, fontSize: 13 }}>{naira(t.closeKobo)} · score {t.score ?? "No data"}</Text>
                </View>
                <ActionBadge action={t.action} />
                <Pressable onPress={() => remove(t.ticker)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 }}>
                  <Text style={{ fontWeight: "700" }}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
