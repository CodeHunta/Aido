import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

// On a real phone, localhost is the phone itself — set EXPO_PUBLIC_API_URL to
// your PC's LAN IP, e.g. http://192.168.1.10:3000/api/v1 (see .env.example).
const API =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "http://localhost:3000/api/v1";

type Tab = "Discover" | "Picks" | "Portfolio" | "Watchlist";
interface Stock {
  ticker: string;
  name: string;
  score: number | null;
  action: string | null;
  suitability: string | null;
  closeKobo: number | null;
}

const naira = (k: number | null) => (k == null ? "—" : "₦" + (k / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 }));
const pill: Record<string, string> = { BUY: "#dcfce7", HOLD: "#fef3c7", SELL: "#fee2e2", WATCH: "#dbeafe", NO_SIGNAL: "#e2e8f0" };

function Row({ s, onOpen }: { s: Stock; onOpen: (t: string) => void }) {
  return (
    <Pressable onPress={() => onOpen(s.ticker)} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ticker}>{s.ticker}</Text>
        <Text style={styles.sub}>{s.name}</Text>
      </View>
      <Text style={styles.score}>{s.score ?? "—"}</Text>
      <Text style={[styles.badge, { backgroundColor: pill[s.action ?? "NO_SIGNAL"] ?? "#e2e8f0" }]}>{(s.action ?? "—").replace("_", " ")}</Text>
    </Pressable>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Discover");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticker: string; score: number | null; action: string | null; why: string[]; keyRisk: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const path = tab === "Watchlist" ? "/watchlist?user=demo-moderate" : "/stocks?user=demo-moderate";
    fetch(`${API}${path}`)
      .then((r) => r.json())
      .then((j) => setStocks(j.ok ? j.data : []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/stocks/${open}/thesis`)
      .then((r) => r.json())
      .then((j) => setDetail(j.ok ? j.data : null))
      .catch(() => setDetail(null));
  }, [open ]);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>AIDO</Text>
      {open && detail ? (
        <View style={{ width: "100%", flex: 1 }}>
          <Pressable onPress={() => { setOpen(null); setDetail(null); }}><Text style={styles.back}>← Back</Text></Pressable>
          <Text style={styles.title}>{detail.ticker} · {detail.score} · {detail.action}</Text>
          {detail.why.map((w) => <Text key={w} style={styles.body}>• {w}</Text>)}
          <Text style={styles.risk}>Key risk: {detail.keyRisk}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>{tab}</Text>
          {loading ? <ActivityIndicator /> : (
            <FlatList style={{ width: "100%" }} data={tab === "Picks" || tab === "Portfolio" ? [] : stocks} keyExtractor={(s) => s.ticker} renderItem={({ item }) => <Row s={item} onOpen={setOpen} />} />
          )}
          {(tab === "Picks" || tab === "Portfolio") && <Text style={styles.sub}>Opens with your data in Phase 6 polish — API already live.</Text>}
        </>
      )}
      <View style={styles.tabs}>
        {(["Discover", "Picks", "Portfolio", "Watchlist"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => { setTab(t); setOpen(null); }} style={[styles.tab, tab === t && styles.tabOn]}>
            <Text style={tab === t ? styles.tabOnText : styles.tabText}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20, paddingTop: 56, backgroundColor: "#fff" },
  kicker: { fontWeight: "800", letterSpacing: 3, color: "#64748b", fontSize: 12 },
  title: { fontSize: 24, fontWeight: "800", marginVertical: 8 },
  back: { color: "#2563eb", fontWeight: "700", marginBottom: 8 },
  body: { fontSize: 15, marginTop: 6 },
  risk: { marginTop: 12, backgroundColor: "#fef2f2", padding: 10, borderRadius: 10, fontSize: 14 },
  sub: { color: "#64748b", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  ticker: { fontWeight: "800", fontSize: 16 },
  score: { fontWeight: "800", fontSize: 16, minWidth: 32, textAlign: "right" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, fontWeight: "800", fontSize: 12, overflow: "hidden" },
  tabs: { flexDirection: "row", gap: 6, marginTop: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#f1f5f9" },
  tabOn: { backgroundColor: "#0f172a" },
  tabText: { fontWeight: "700", fontSize: 13 },
  tabOnText: { fontWeight: "700", fontSize: 13, color: "#fff" },
});
