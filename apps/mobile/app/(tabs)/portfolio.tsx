import { Link } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth";
import type { Holding } from "../../lib/types";
import { Btn, C, Card, Empty, Field, H1, Loading, Sub, naira } from "../../lib/ui";
import { LabelWithTip } from "../../lib/glossary";

export default function Portfolio() {
  const { authedFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Holding[]>([]);
  const [analysis, setAnalysis] = useState<{ valueKobo: number; pnlKobo: number; pnlPct: number; dividendYield: number; allocation: { key: string; weight: number }[]; weaknesses: string[] } | null>(null);
  const [ticker, setTicker] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);
  // A ref, not just state: it flips synchronously, so even two taps in the same
  // frame cannot send the same holding twice.
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);

  const fetchData = useCallback(async () => {
    const [h, a] = await Promise.all([authedFetch("/portfolio"), authedFetch("/portfolio/analysis")]);
    return {
      rows: Array.isArray(h) ? (h as Holding[]) : [],
      analysis: a as typeof analysis,
    };
  }, [authedFetch]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const d = await fetchData();
      setRows(d.rows);
      setAnalysis(d.analysis);
    } catch {
      setRows([]);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  // Refresh after a save without swapping the screen for a spinner. The old
  // full-screen reload hid the result and made people tap Save a second time,
  // which is what recorded the same stock twice.
  const refresh = useCallback(async () => {
    try {
      const d = await fetchData();
      setRows(d.rows);
      setAnalysis(d.analysis);
    } catch {
      // Keep the list we already have; the save message still reports the write.
    }
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function save() {
    if (saving.current) return;
    // Uppercase once, here. Uppercasing inside onChange rewrote the controlled
    // value on every keypress, which is what made typing and deleting erratic.
    const symbol = ticker.trim().toUpperCase();
    const quantity = Number(qty);
    const unit = Number(price);
    if (!symbol) {
      setMsg("Enter a ticker, for example GTCO.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity === 0) {
      setMsg("Enter a quantity. Use a negative number to sell.");
      return;
    }
    if (!Number.isInteger(quantity)) {
      setMsg("Quantity must be a whole number of shares.");
      return;
    }
    if (!Number.isFinite(unit) || unit < 0 || price.trim() === "") {
      setMsg("Enter the price you paid, for example 1408.89.");
      return;
    }

    saving.current = true;
    setBusy(true);
    setMsg("");
    try {
      const j = (await authedFetch("/portfolio", {
        method: "POST",
        body: JSON.stringify({ ticker: symbol, qty: quantity, avgCostKobo: Math.round(unit * 100) }),
      })) as { added?: string; accumulated?: string; soldAll?: string; qty?: number; avgCostKobo?: number };
      if (j.soldAll) setMsg(`Sold all ${j.soldAll}.`);
      else if (j.accumulated) setMsg(`Now ${j.qty?.toLocaleString()} @ ${naira(j.avgCostKobo)}.`);
      else setMsg(`Added ${j.added}: ${quantity.toLocaleString()} @ ${naira(Math.round(unit * 100))}.`);
      setTicker("");
      setQty("");
      setPrice("");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function remove(t: string) {
    await authedFetch(`/portfolio?ticker=${t}`, { method: "DELETE" }).catch(() => null);
    await load();
  }

  if (loading) return <Loading />;
  if (failed && rows.length === 0)
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        <H1>Portfolio</H1>
        <Empty
          title="Could not reach Aido"
          body="Check your internet. The computer running Aido may also be asleep."
          action={<Btn title="Try again" onPress={load} primary />}
        />
      </View>
    );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} keyboardShouldPersistTaps="handled">
      <View style={{ padding: 16 }}>
        <H1>Portfolio</H1>
        {analysis && (
          <Card>
            <LabelWithTip label="VALUE: what all your stocks are worth now" term="price" />
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>{naira(analysis.valueKobo)}</Text>
            <LabelWithTip label="GAIN / LOSS vs what you paid" term="gain" />
            <Text style={{ fontWeight: "800", color: analysis.pnlKobo >= 0 ? C.buy : C.sell }}>
              {naira(analysis.pnlKobo)} ({(analysis.pnlPct * 100).toFixed(1)}%)
            </Text>
            <LabelWithTip label="Yearly cash you may get" term="dividend" />
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
          <Field placeholder="TICKER" value={ticker} onChange={setTicker} autoCapitalize="characters" maxLength={12} />
          <Field placeholder="Qty" value={qty} onChange={setQty} keyboard="numeric" />
          <Field placeholder="Price ₦" value={price} onChange={setPrice} keyboard="numeric" />
          <Btn title={busy ? "Saving…" : "Save"} onPress={save} primary disabled={busy} />
          {!!msg && <Text style={{ fontSize: 13, color: C.text, marginTop: 6 }}>{msg}</Text>}
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
