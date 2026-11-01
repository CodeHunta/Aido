import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import type { Stock } from "../../lib/types";
import { ActionBadge, C, Card, Empty, H1, Loading, Sub, naira } from "../../lib/ui";

export default function Watchlist() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Stock[]>([]);
  const [msg, setMsg] = useState("");

  const fetchRows = useCallback(async () => {
    const data = await authedFetch("/watchlist");
    return Array.isArray(data) ? (data as Stock[]) : [];
  }, [authedFetch]);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      setRows(await fetchRows());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fetchRows]);

  // Update the list in place after a removal so the screen does not flash.
  const refresh = useCallback(async () => {
    try {
      setRows(await fetchRows());
    } catch {
      // Keep what is already on screen; the message reports the outcome.
    }
  }, [fetchRows]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function remove(ticker: string) {
    try {
      await authedFetch(`/watchlist?ticker=${ticker}`, { method: "DELETE" });
      setMsg(`Removed ${ticker} from your watchlist.`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : `Could not remove ${ticker}.`);
    }
  }

  // A single stray tap used to unfollow a stock. Confirm before deleting.
  function confirmRemove(ticker: string) {
    Alert.alert(
      `Remove ${ticker}?`,
      `This takes ${ticker} off your watchlist, so Aido stops alerting you about it.`,
      [
        { text: "Keep it", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => { void remove(ticker); } },
      ],
    );
  }

  if (loading) return <Loading />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Watchlist</H1>
        <Sub>Aido pings you only when something material changes.</Sub>
        {!!msg && <Text style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>{msg}</Text>}
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
                <Pressable onPress={() => confirmRemove(t.ticker)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 }}>
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
