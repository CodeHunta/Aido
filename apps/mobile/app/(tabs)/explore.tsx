import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import type { Stock } from "../../lib/types";
import { ActionBadge, C, Card, Empty, H1, Loading, naira } from "../../lib/ui";

const TABS = ["all", "stocks", "etfs", "reits"] as const;
const PER_PAGE = 20;

export default function Explore() {
  const { authedFetch } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await authedFetch("/stocks?sort=ticker")) as Stock[];
      setStocks(Array.isArray(data) ? data : []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // API has no asset filter yet — filter client-side like the tape does.
  const filtered = stocks.filter((s) => {
    if (tab === "stocks" && (s.asset ?? "stock") !== "stock") return false;
    if (tab === "etfs" && s.asset !== "etf") return false;
    if (tab === "reits" && s.asset !== "reit") return false;
    if (q && !s.ticker.toLowerCase().includes(q.toLowerCase()) && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  if (loading) return <Loading />;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
      <H1>Explore</H1>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => { setTab(t); setPage(1); }} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: tab === t ? C.text : C.card, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontWeight: "700", fontSize: 13, color: tab === t ? C.bg : C.text }}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput placeholder="Search ticker or name" value={q} onChangeText={(v) => { setQ(v); setPage(1); }} autoCapitalize="none" placeholderTextColor={C.muted} style={{ borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 10, backgroundColor: C.card, color: C.text, marginBottom: 10 }} />
      {slice.length === 0 ? (
        <Empty title="No matches" body="Try a shorter search or another tab." />
      ) : (
        <FlatList
          data={slice}
          keyExtractor={(s) => s.ticker}
          renderItem={({ item: s }) => (
            <Link href={`/stocks/${s.ticker}`} asChild>
              <Pressable>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{s.ticker}</Text>
                      <Text style={{ color: C.muted, fontSize: 12 }} numberOfLines={1}>{s.name}</Text>
                    </View>
                    <Text style={{ fontWeight: "800", color: C.text }}>{naira(s.closeKobo)}</Text>
                    <Text style={{ fontWeight: "800", color: C.text, width: 30, textAlign: "right" }}>{s.score ?? "—"}</Text>
                    <ActionBadge action={s.action} />
                  </View>
                </Card>
              </Pressable>
            </Link>
          )}
        />
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
        <Text style={{ color: C.muted, fontSize: 12 }}>Showing {total === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–{Math.min(total, safePage * PER_PAGE)} of {total}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {safePage > 1 && (
            <Pressable onPress={() => setPage(safePage - 1)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 }}><Text style={{ fontWeight: "700" }}>← Prev</Text></Pressable>
          )}
          {safePage < pages && (
            <Pressable onPress={() => setPage(safePage + 1)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 }}><Text style={{ fontWeight: "700" }}>Next →</Text></Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
