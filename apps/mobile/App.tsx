import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>AIDO</Text>
      <Text style={styles.title}>Know what it means for you.</Text>
      <Text style={styles.sub}>Phase 2 shell — full screens land in Phase 6.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  kicker: { fontWeight: "800", letterSpacing: 3, color: "#64748b" },
  title: { fontSize: 24, fontWeight: "800", marginTop: 8, textAlign: "center" },
  sub: { marginTop: 8, color: "#64748b", textAlign: "center" },
});
