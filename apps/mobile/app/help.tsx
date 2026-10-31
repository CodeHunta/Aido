import { Link } from "expo-router";
import { useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Btn, C, Card, Field, H1, Sub } from "../lib/ui";

export const SUPPORT_EMAIL = "manstylo@gmail.com";

const FAQS: [string, string][] = [
  ["What is Aido?", "Aido turns noisy Nigerian stock market data into clear personal moves: BUY, HOLD, SELL or WATCH, always with the reason why. It is learning help, not advice from a licensed advisor."],
  ["What does the score mean?", "0 to 100. Higher means Aido finds the stock more attractive right now. 75 or more can be a BUY, 65 to 74 is WATCH, 50 to 64 is HOLD, below 40 is weak."],
  ["Is the data real?", "Prices are real NGX prices, a little delayed. Company profits, debts and dividends are still examples until we connect company reports."],
  ["When do I get my pick?", "Every Sunday, on your dashboard and the Picks tab. Some weeks honestly say no strong opportunity."],
  ["How do I stop some messages?", "Open Alerts and use the switches at the top. Off means no message for that kind."],
  ["How do I delete my account?", "Open Profile, scroll to Delete account, type DELETE and confirm. This removes everything for good."],
];

export default function Help() {
  const [ticker, setTicker] = useState("");
  const [seen, setSeen] = useState("");
  const [msg, setMsg] = useState("");

  function report() {
    if (!ticker.trim() || !seen.trim()) {
      setMsg("Tell us the stock and what you saw first.");
      return;
    }
    const subject = encodeURIComponent(`Wrong data report: ${ticker.trim().toUpperCase()}`);
    const body = encodeURIComponent(`Stock: ${ticker.trim().toUpperCase()}\nWhat I saw: ${seen.trim()}\nPage date: ${new Date().toLocaleString()}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    setMsg("Your email app should open now. Just press send.");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Help</H1>
        <Sub>Short answers for beginners.</Sub>
        {FAQS.map(([q, a]) => (
          <Card key={q}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{q}</Text>
            <Text style={{ color: C.text, fontSize: 14, marginTop: 4, lineHeight: 20 }}>{a}</Text>
          </Card>
        ))}
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Contact us</Text>
          <Text style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Email {SUPPORT_EMAIL}. We read everything and answer on working days.</Text>
          <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: C.cobalt, fontWeight: "700", marginTop: 6 }}>Email support</Link>
        </Card>
        <Card>
          <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>Report wrong data</Text>
          <Field placeholder="Ticker, e.g. GTCO" value={ticker} onChange={setTicker} autoCapitalize="characters" maxLength={12} />
          <Field placeholder="What did you see?" value={seen} onChange={setSeen} />
          <Btn title="Open report email" onPress={report} primary />
          {!!msg && <Text style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{msg}</Text>}
        </Card>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
          <Link href="/methodology" style={{ color: C.cobalt, fontWeight: "700" }}>How Aido thinks</Link>
          <Link href="/terms" style={{ color: C.cobalt, fontWeight: "700" }}>Terms</Link>
          <Link href="/privacy" style={{ color: C.cobalt, fontWeight: "700" }}>Privacy</Link>
        </View>
      </View>
    </ScrollView>
  );
}
