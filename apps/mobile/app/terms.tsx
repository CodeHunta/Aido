import { ScrollView, Text, View } from "react-native";
import { C, Card, H1, Sub } from "../lib/ui";

const SECTIONS: [string, string][] = [
  ["1. Learning help, not financial advice", "Aido gives educational investment intelligence. Scores and BUY, HOLD, SELL or WATCH calls are model outputs. They are not advice from a licensed advisor."],
  ["2. Data honesty", "Prices are real NGX prices, a little delayed. Company profits, debts and dividends are still examples. Do not treat example numbers as facts."],
  ["3. Your account", "You keep your login details safe. Free accounts get basic features. Premium unlocks deeper intelligence and bills monthly through Paystack until you cancel."],
  ["4. Fair use", "Use Aido for your own learning. Do not copy, resell or scrape the analysis."],
  ["5. Beta reality", "Aido runs in beta. Features can change, scores can be wrong, and the service can pause for fixes. Past patterns do not guarantee future results."],
];

export default function Terms() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Terms</H1>
        <Sub>Plain words first. Last updated October 2026.</Sub>
        {SECTIONS.map(([h, b]) => (
          <Card key={h}>
            <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{h}</Text>
            <Text style={{ color: C.text, fontSize: 14, marginTop: 4, lineHeight: 20 }}>{b}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
