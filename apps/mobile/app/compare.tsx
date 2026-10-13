import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import { ActionBadge, Btn, C, Card, Field, H1, Sub, naira } from "../lib/ui";

interface Cmp {
  ticker: string;
  closeKobo: number | null;
  score: number | null;
  action: string | null;
  dividendYield: number | null;
  volatility: number | null;
  financials: { roe: number | null; profitMargin: number | null; debtToEquity: number | null } | null;
}

export default function Compare() {
  const { authedFetch } = useAuth();
  const [input, setInput] = useState("GTCO,DANGCEM");
  const [cols, setCols] = useState<Cmp[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setMsg("");
    try {
      const data = (await authedFetch(`/compare?tickers=${encodeURIComponent(input)}`)) as Cmp[];
      setCols(Array.isArray(data) ? data.slice(0, 3) : []);
      if (!Array.isArray(data) || data.length === 0) setMsg("No matches — check tickers.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed. Use like GTCO,DANGCEM.");
    } finally {
      setBusy(false);
    }
  }

  const rows: [string, (c: Cmp) => string][] = [
    ["Price", (c) => naira(c.closeKobo)],
    ["Score", (c) => `${c.score ?? "—"}`],
    ["Yield", (c) => (c.dividendYield != null ? `${(c.dividendYield * 100).toFixed(1)}%` : "—")],
    ["ROE", (c) => (c.financials?.roe != null ? `${(Number(c.financials.roe) * 100).toFixed(1)}%` : "—")],
    ["Volatility", (c) => (c.volatility != null ? `${(c.volatility * 100).toFixed(0)}%` : "—")],
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Compare</H1>
        <Sub>How are these opportunities different?</Sub>
        <Card>
          <Field placeholder="GTCO,DANGCEM" value={input} onChange={setInput} />
          <Btn title={busy ? "Comparing…" : "Compare"} onPress={run} disabled={busy} primary />
          {!!msg && <Text style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>{msg}</Text>}
        </Card>
        {cols.length > 0 && (
          <Card>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: C.text, paddingVertical: 8 }}>Fact</Text>
                {rows.map(([k]) => (
                  <Text key={k} style={{ color: C.muted, paddingVertical: 8 }}>{k}</Text>
                ))}
                <Text style={{ color: C.muted, paddingVertical: 8 }}>Action</Text>
              </View>
              {cols.map((c) => (
                <View key={c.ticker} style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "800", color: C.text, paddingVertical: 8 }}>{c.ticker}</Text>
                  {rows.map(([k, fn]) => (
                    <Text key={k} style={{ fontWeight: "700", color: C.text, paddingVertical: 8, textAlign: "right" }}>{fn(c)}</Text>
                  ))}
                  <View style={{ paddingVertical: 8, alignItems: "flex-end" }}><ActionBadge action={c.action} /></View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
