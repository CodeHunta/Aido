import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { C } from "./ui";

export const GLOSSARY: Record<string, string> = {
  score:
    "0 to 100. Higher means Aido finds it more attractive right now. 75+ can be BUY, 65-74 is WATCH, 50-64 is HOLD, below 40 is weak.",
  BUY: "Aido thinks this looks attractive at today's price, if it fits you. Open it to see why.",
  HOLD: "May be a good company, but the price is high now. No need to buy more today.",
  SELL: "Aido thinks you should consider reducing or leaving this. Check why before you act.",
  WATCH: "Interesting, but not strong enough to buy yet. Keep an eye on it.",
  NO_SIGNAL: "Nothing strong enough this week. That is normal.",
  NO_STRONG_OPPORTUNITY: "Nothing strong enough this week. That is normal.",
  confidence:
    "How strong the proof is. High = lots of clear proof. Low = little or mixed proof.",
  suitability:
    "Whether this fits YOUR goal, risk and time. Outside profile means good stock, wrong fit for you.",
  roe: "How well the company turns your money into profit. Higher % is usually better.",
  margin: "From every ₦100 of sales, how much stays as profit.",
  debt: "How much the company borrows vs owns. Lower is usually safer.",
  yield: "Yearly cash payout vs price. 5% means about ₦5 each year per ₦100 price.",
  volatility: "How much price jumps up and down. Big jumps = higher risk.",
  price: "Latest price we have. Updates after market close, a little delayed.",
  allocation: "How your money is spread. One big part = bigger hurt if it falls.",
  gain: "Made or lost vs what you paid. Green is gain, red is loss.",
  dividend: "Cash paid for holding the stock. Not every company pays it.",
};

export function Tip({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const text = GLOSSARY[term] ?? term;
  return (
    <View style={{ marginLeft: 4 }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityLabel={`What does ${term} mean`}
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.card,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "800", color: C.muted }}>?</Text>
      </Pressable>
      {open ? (
        <View
          style={{
            marginTop: 6,
            padding: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.card,
            maxWidth: 300,
          }}
        >
          <Text style={{ fontSize: 13, lineHeight: 19, color: C.text }}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function HonestyNote({ source, asOf }: { source: string | null; asOf: string | null }) {
  const real = source === "ngx-delayed";
  return (
    <View
      style={{
        marginTop: 8,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: real ? "#f0fdf4" : "#fffbeb",
      }}
    >
      <Text style={{ fontSize: 13, lineHeight: 19, color: C.text }}>
        {real ? (
          <>
            <Text style={{ fontWeight: "800" }}>Price: real NGX price</Text>
            <Text> (a little delayed{asOf ? ` · ${asOf}` : ""}). </Text>
            <Text style={{ fontWeight: "800" }}>Company profits and dividends below are still examples</Text>
            <Text>. Please be careful with big money.</Text>
          </>
        ) : (
          <>
            <Text style={{ fontWeight: "800" }}>Price: example, not real{asOf ? ` · ${asOf}` : ""}.</Text>
            <Text> Numbers below are also examples.</Text>
          </>
        )}
      </Text>
    </View>
  );
}

export function LabelWithTip({ label, term }: { label: string; term: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
      <Tip term={term} />
    </View>
  );
}
