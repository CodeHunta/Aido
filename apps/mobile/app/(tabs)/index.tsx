import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import { ActionBadge, C, Card, H1, Loading, ScoreRing, naira } from "../../lib/ui";

interface Pick {
  ticker: string;
  score: number;
  action: string | null;
}

export default function Dashboard() {
  const { user, authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState(0);
  const [watched, setWatched] = useState(0);
  const [value, setValue] = useState(0);
  const [personal, setPersonal] = useState<Pick | null>(null);
  const [market, setMarket] = useState<Pick | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const [pf, wl, picks] = await Promise.all([
          authedFetch("/portfolio").catch(() => [] as unknown[]),
          authedFetch("/watchlist").catch(() => [] as unknown[]),
          authedFetch("/picks/current").catch(() => null as unknown),
        ]);
        const rows = Array.isArray(pf) ? (pf as { qty: number; priceKobo: number | null }[]) : [];
        setHoldings(rows.length);
        setWatched(Array.isArray(wl) ? wl.length : 0);
        setValue(rows.reduce((a, h) => a + h.qty * (h.priceKobo ?? 0), 0));
        const p = picks as { personal?: Pick | null; market?: Pick | null } | null;
        setPersonal(p?.personal ?? null);
        setMarket(p?.market ?? null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authedFetch],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <Loading />;
  const first = user?.name?.trim().split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", letterSpacing: 3, color: C.muted }}>AIDO DASHBOARD</Text>
        <H1>Good morning, {first}</H1>
        <Card>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>PORTFOLIO</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: C.text }}>{naira(value)}</Text>
          <Text style={{ fontSize: 13, color: C.muted }}>{holdings} holdings · {watched} watched</Text>
          <Link href="/(tabs)/portfolio" style={{ color: C.cobalt, fontWeight: "700", marginTop: 6 }}>Manage →</Link>
        </Card>
        <Card>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>YOUR AIDO PICK</Text>
          {personal ? (
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
              <ScoreRing score={personal.score} />
              <View>
                <ActionBadge action={personal.action} />
                <Link href={`/stocks/${personal.ticker}`} style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{personal.ticker}</Link>
              </View>
            </View>
          ) : (
            <Text style={{ color: C.muted }}>No strong opportunity this week.</Text>
          )}
        </Card>
        <Card>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>MARKET PICK</Text>
          {market ? (
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
              <ScoreRing score={market.score} />
              <View>
                <ActionBadge action={market.action} />
                <Link href={`/stocks/${market.ticker}`} style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{market.ticker}</Link>
              </View>
            </View>
          ) : (
            <Text style={{ color: C.muted }}>—</Text>
          )}
        </Card>
        <Link href="/alerts" style={{ color: C.cobalt, fontWeight: "700" }}>Alerts →</Link>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <Link href="/compare" style={{ color: C.cobalt, fontWeight: "700" }}>Compare</Link>
          <Link href="/premium" style={{ color: C.cobalt, fontWeight: "700" }}>Premium</Link>
          <Link href="/profile" style={{ color: C.cobalt, fontWeight: "700" }}>Profile</Link>
          <Link href="/methodology" style={{ color: C.muted, fontSize: 13 }}>How Aido thinks →</Link>
        </View>
      </View>
    </ScrollView>
  );
}
