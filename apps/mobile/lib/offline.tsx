import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { C } from "./ui";

export function OfflineBar() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(s.isConnected ?? true));
    return unsub;
  }, []);
  if (online !== false) return null;
  return (
    <View style={{ backgroundColor: "#fef3c7", borderBottomWidth: 1, borderBottomColor: "#fde68a", padding: 8 }}>
      <Text style={{ color: "#92400e", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
        No internet. Aido will work again when you reconnect.
      </Text>
    </View>
  );
}
