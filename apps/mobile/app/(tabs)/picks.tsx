import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import { ActionBadge, C, Card, H1, Loading, ScoreRing } from "../../lib/ui";

interface Pick {
  ticker: string;
  score: number;
  action: string | null;
  level?: string | null;
}

export default function Picks() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState<Pick | null>(null);
  const [market, setMarket] = useState<Pick | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = (await authedFetch("/picks/current")) as { personal?: Pick | null; market?: Pick | null };
      setPersonal(p?.personal ?? null);
      setMarket(p?.market ?? null);
    } catch {
      setPersonal(null);
      setMarket(null);
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
        <H1>Your Aido Pick</H1>
        <Card>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>FOR YOU 🎯</Text>
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
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>MARKET PICK OF THE WEEK</Text>
          {market ? (
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
              <ScoreRing score={market.score} />
              <View>
                <ActionBadge action={market.action} />
                <Link href={`/stocks/${market.ticker}`} style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{market.ticker}</Link>
              </View>
            </View>
          ) : (
            <Text style={{ color: C.muted }}>No pick this week.</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
