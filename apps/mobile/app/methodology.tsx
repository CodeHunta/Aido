import { ScrollView, Text, View } from "react-native";
import { C, Card, H1, Sub } from "../lib/ui";

export default function Methodology() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>How Aido thinks</H1>
        <Sub>Data → Analysis → Recommendation. Never a black box.</Sub>
        <Card>
          <Text style={{ color: C.text, fontSize: 14, lineHeight: 22 }}>
            Every stock gets an Aido Score (0–100) from six factors: fundamentals 25%, valuation 25%, growth 15%, market behaviour 10%, dividends 10% (20% for income goals), risk 15%.{"\n\n"}
            Opportunity ≠ suitability: a great stock can be wrong for you. Misfits appear under “Outside Your Profile” — never hidden.{"\n\n"}
            A BUY needs score ≥ 75, fair valuation, solid evidence and no blocking risk. “No strong opportunity this week” is a valid, honest answer.
          </Text>
        </Card>
        <Card>
          <Text style={{ fontSize: 14, color: C.text }}>
            <Text style={{ fontWeight: "800" }}>Important: </Text>
            Aido is educational investment intelligence, not financial advice.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
