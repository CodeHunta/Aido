import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import { ActionBadge, C, Card, H1, Loading, ScoreRing, Sub, naira } from "../../lib/ui";

interface Detail {
  ticker: string;
  name: string;
  sector: string;
  categories: string[];
  closeKobo: number | null;
  asOf: string | null;
  source: string | null;
  score: number | null;
  action: string | null;
  confidence: string | null;
  volatility: number | null;
  dividendYield: number | null;
  suitability: { level: string; reasons: string[] } | null;
  financials: { roe: number | null; profitMargin: number | null; debtToEquity: number | null } | null;
  recommendation: { why: string[]; keyRisk: string } | null;
  prices: { date: string; closeKobo: number | null }[];
}

export default function StockDetail() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState<Detail | null>(null);
  const [watched, setWatched] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await authedFetch(`/stocks/${String(ticker).toUpperCase()}`)) as Detail & { suitability: Detail["suitability"] };
      setD(data);
      const wl = (await authedFetch("/watchlist").catch(() => [])) as { ticker: string }[];
      setWatched(Array.isArray(wl) && wl.some((w) => w.ticker === data.ticker));
    } catch {
      setD(null);
    } finally {
      setLoading(false);
    }
  }, [authedFetch, ticker]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleWatch() {
    if (!d || busy) return;
    setBusy(true);
    try {
      if (watched) await authedFetch(`/watchlist?ticker=${d.ticker}`, { method: "DELETE" });
      else await authedFetch("/watchlist", { method: "POST", body: JSON.stringify({ ticker: d.ticker }) });
      setWatched(!watched);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;
  if (!d) return <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}><Text>Stock not found.</Text></View>;
  const max = Math.max(...d.prices.map((p) => p.closeKobo ?? 0), 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <H1>{d.name}</H1>
            <Sub>{d.ticker} · {d.sector} · {d.source === "ngx-delayed" ? "NGX delayed" : "Sample"} data as of {d.asOf}</Sub>
          </View>
          <Pressable onPress={toggleWatch} disabled={busy} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 9, backgroundColor: watched ? C.text : C.card }}>
            <Text style={{ fontWeight: "700", color: watched ? C.bg : C.text }}>{watched ? "✓ Watching" : "+ Watch"}</Text>
          </Pressable>
        </View>
        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <ScoreRing score={d.score} />
            <View style={{ flex: 1 }}>
              <ActionBadge action={d.action} />
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text, marginTop: 4 }}>{naira(d.closeKobo)}</Text>
              <Text style={{ fontSize: 13, color: C.muted }}>Confidence: {d.confidence ?? "—"} · Suitability: {d.suitability?.level === "low" ? "Outside profile" : (d.suitability?.level ?? "—")}</Text>
            </View>
          </View>
          {d.recommendation && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontWeight: "800", color: C.text }}>Why Aido thinks so</Text>
              {d.recommendation.why.map((w) => (
                <Text key={w} style={{ color: C.text, fontSize: 14, marginTop: 2 }}>• {w}</Text>
              ))}
              <Text style={{ marginTop: 8, backgroundColor: "#fef2f2", padding: 10, borderRadius: 10, fontSize: 14 }}>Key risk: {d.recommendation.keyRisk}</Text>
            </View>
          )}
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", color: C.text, marginBottom: 8 }}>Last 30 sessions</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 80 }}>
            {d.prices.map((p) => (
              <View key={p.date} style={{ flex: 1, backgroundColor: C.watch, height: Math.max(4, ((p.closeKobo ?? 0) / max) * 80), borderRadius: 2 }} />
            ))}
          </View>
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", color: C.text, marginBottom: 8 }}>Numbers</Text>
          {[
            ["ROE", d.financials?.roe != null ? `${(Number(d.financials.roe) * 100).toFixed(1)}%` : "—"],
            ["Dividend yield", d.dividendYield != null ? `${(d.dividendYield * 100).toFixed(1)}%` : "—"],
            ["Volatility", d.volatility != null ? `${(d.volatility * 100).toFixed(0)}%` : "—"],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ color: C.muted }}>{k}</Text>
              <Text style={{ fontWeight: "700", color: C.text }}>{v}</Text>
            </View>
          ))}
        </Card>
        {d.suitability && (
          <Card>
            <Text style={{ fontWeight: "800", color: C.text }}>Why for you</Text>
            <Text style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>{d.suitability.reasons.join("; ")}</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
