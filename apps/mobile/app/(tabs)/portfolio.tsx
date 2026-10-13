import { Link } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import type { Holding } from "../../lib/types";
import { Btn, C, Card, Empty, Field, H1, Loading, Sub, naira } from "../../lib/ui";

export default function Portfolio() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Holding[]>([]);
  const [analysis, setAnalysis] = useState<{ valueKobo: number; pnlKobo: number; pnlPct: number; dividendYield: number; allocation: { key: string; weight: number }[]; weaknesses: string[] } | null>(null);
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, a] = await Promise.all([authedFetch("/portfolio"), authedFetch("/portfolio/analysis")]);
      setRows(Array.isArray(h) ? (h as Holding[]) : []);
      setAnalysis(a as typeof analysis);
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

  async function save() {
    setMsg("");
    try {
      const j = (await authedFetch("/portfolio", {
        method: "POST",
        body: JSON.stringify({ ticker, qty: Number(qty), avgCostKobo: Math.round(Number(price) * 100) }),
      })) as { added?: string; accumulated?: string; soldAll?: string; qty?: number; avgCostKobo?: number };
      if (j.soldAll) setMsg(`Sold all ${j.soldAll}.`);
      else if (j.accumulated) setMsg(`Now ${j.qty?.toLocaleString()} @ ₦${((j.avgCostKobo ?? 0) / 100).toLocaleString()}.`);
      else setMsg(`Added ${j.added}.`);
      setTicker("");
      setQty("");
      setPrice("");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function remove(t: string) {
    await authedFetch(`/portfolio?ticker=${t}`, { method: "DELETE" }).catch(() => null);
    await load();
  }

  if (loading) return <Loading />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Portfolio</H1>
        {analysis && (
          <Card>
            <Text style={{ fontSize: 12, color: C.muted, fontWeight: "800" }}>VALUE</Text>
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>{naira(analysis.valueKobo)}</Text>
            <Text style={{ fontWeight: "800", color: analysis.pnlKobo >= 0 ? C.buy : C.sell }}>
              {naira(analysis.pnlKobo)} ({(analysis.pnlPct * 100).toFixed(1)}%)
            </Text>
            <Text style={{ color: C.muted, fontSize: 13 }}>Div yield {(analysis.dividendYield * 100).toFixed(1)}%</Text>
          </Card>
        )}
        {rows.length === 0 ? (
          <Empty title="Nothing here yet" body="Record a stock you own. Aido tracks its live value and warns about concentration." />
        ) : (
          rows.map((h) => (
            <Card key={h.ticker}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Link href={`/stocks/${h.ticker}`} style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{h.ticker}</Link>
                  <Text style={{ color: C.muted, fontSize: 13 }}>{h.qty.toLocaleString()} @ {naira(h.avgCostKobo)} · now {naira(h.priceKobo)}</Text>
                </View>
                <Pressable onPress={() => remove(h.ticker)} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 8 }}>
                  <Text style={{ fontWeight: "700" }}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
        <Card>
          <Sub>Save holding (+qty buy / −qty sell)</Sub>
          <Field placeholder="TICKER" value={ticker} onChange={(v) => setTicker(v.toUpperCase())} />
          <Field placeholder="Qty" value={qty} onChange={setQty} keyboard="numeric" />
          <Field placeholder="Price ₦" value={price} onChange={setPrice} keyboard="numeric" />
          <Btn title="Save" onPress={save} primary />
          {!!msg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{msg}</Text>}
        </Card>
        {analysis && analysis.weaknesses.length > 0 && (
          <Card>
            <Text style={{ fontWeight: "800", color: C.text }}>Weaknesses</Text>
            {analysis.weaknesses.map((w) => (
              <Text key={w} style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>• {w}</Text>
            ))}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
