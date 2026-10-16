import { ScrollView, Text, View } from "react-native";
import { C, Card, H1, Sub } from "../lib/ui";

const SECTIONS: [string, string][] = [
  ["1. What we store", "Your name, email and login details. Your investor profile. Your portfolio entries, watchlist, alert choices and picks. That is all we need to run Aido."],
  ["2. What we never do", "We never sell your data. We never share it with advertisers. We never see your bank or brokerage login."],
  ["3. Who else touches it", "Hosting and email providers process data only to deliver Aido. Payments go through Paystack under their own policy."],
  ["4. Delete any time", "Open Profile, scroll to Delete account, type DELETE and confirm. This removes everything for good."],
];

export default function Privacy() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 16 }}>
        <H1>Privacy</H1>
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
