import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import { ActionBadge, Btn, C, Card, Empty, H1, Loading, ScoreRing, Sub, naira } from "../../lib/ui";
import { HonestyNote, LabelWithTip, Tip } from "../../lib/glossary";

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
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = (await authedFetch(`/stocks/${String(ticker).toUpperCase()}`)) as Detail & { suitability: Detail["suitability"] };
      setD(data);
      const wl = (await authedFetch("/watchlist").catch(() => [])) as { ticker: string }[];
      setWatched(Array.isArray(wl) && wl.some((w) => w.ticker === data.ticker));
    } catch {
      setD(null);
      setFailed(true);
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
  if (!d)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <Empty
          title={failed ? "Could not reach Aido" : "Stock not found"}
          body={failed ? "Check your internet. The computer running Aido may also be asleep." : "Check the ticker and try again."}
          action={failed ? <Btn title="Try again" onPress={load} primary /> : undefined}
        />
      </View>
    );
  const max = Math.max(...d.prices.map((p) => p.closeKobo ?? 0), 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <H1>{d.name}</H1>
            <Sub>{d.ticker} · {d.sector}</Sub>
            <HonestyNote source={d.source} asOf={d.asOf} />
          </View>
          <Pressable onPress={toggleWatch} disabled={busy} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 9, backgroundColor: watched ? C.text : C.card }}>
            <Text style={{ fontWeight: "700", color: watched ? C.bg : C.text }}>{watched ? "✓ Watching" : "+ Watch"}</Text>
          </Pressable>
        </View>
        <Card>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <View>
              <ScoreRing score={d.score} />
              <LabelWithTip label="Score" term="score" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActionBadge action={d.action} />
                <Tip term={d.action ?? "NO_SIGNAL"} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text, marginTop: 4 }}>{naira(d.closeKobo)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Text style={{ fontSize: 13, color: C.muted }}>Confidence: {d.confidence ?? "No data"}</Text>
                <Tip term="confidence" />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Text style={{ fontSize: 13, color: C.muted }}>Fit: {d.suitability?.level === "low" ? "Outside profile" : (d.suitability?.level ?? "Not checked yet")}</Text>
                <Tip term="suitability" />
              </View>
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
          <Text style={{ fontWeight: "800", color: C.text, marginBottom: 4 }}>Numbers (tap ? for plain meaning)</Text>
          <Text style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>EXAMPLE: company profits and dividends are still examples. Price above is {d.source === "ngx-delayed" ? "real NGX (delayed)" : "also an example"}.</Text>
          {(
            [
            ["ROE", "roe", d.financials?.roe != null ? `${(Number(d.financials.roe) * 100).toFixed(1)}%` : "No data"],
            ["Dividend yield", "yield", d.dividendYield != null ? `${(d.dividendYield * 100).toFixed(1)}%` : "No data"],
            ["Volatility", "volatility", d.volatility != null ? `${(d.volatility * 100).toFixed(0)}%` : "No data"],
            ] as [string, string, string][]
          ).map(([k, tip, v]) => (
            <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: C.muted }}>{k}</Text>
                <Tip term={tip} />
              </View>
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
