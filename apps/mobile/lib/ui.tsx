import React from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { EyeIcon, EyeOffIcon } from "./icons";

export const C = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  cobalt: "#0047AB",
  buy: "#16a34a",
  buyBg: "#dcfce7",
  buyFg: "#166534",
  hold: "#d97706",
  holdBg: "#fef3c7",
  holdFg: "#92400e",
  sell: "#dc2626",
  sellBg: "#fee2e2",
  sellFg: "#991b1b",
  watch: "#2563eb",
  watchBg: "#dbeafe",
  watchFg: "#1e40af",
  neutralBg: "#e2e8f0",
  neutralFg: "#334155",
};

export const naira = (kobo: number | null | undefined): string =>
  kobo == null ? "No data" : "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: kobo >= 100000 ? 0 : 2 });

// `center` is for the auth screens: content sits in the middle of the screen
// instead of hugging the top edge, and scrolls when the keyboard opens.
export function Screen({ children, center }: { children: React.ReactNode; center?: boolean }) {
  if (!center) return <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>{children}</View>;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 4 }}>{children}</Text>;
}

export function Sub({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>{children}</Text>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      {children}
    </View>
  );
}

const pillColors: Record<string, [string, string]> = {
  BUY: [C.buyBg, C.buyFg],
  HOLD: [C.holdBg, C.holdFg],
  SELL: [C.sellBg, C.sellFg],
  WATCH: [C.watchBg, C.watchFg],
};

export function ActionBadge({ action }: { action: string | null }) {
  const a = action ?? "NO_SIGNAL";
  const [bg, fg] = pillColors[a] ?? [C.neutralBg, C.neutralFg];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontWeight: "800", fontSize: 12 }}>{a.replace("_", " ")}</Text>
    </View>
  );
}

export function ScoreRing({ score, size = 72 }: { score: number | null; size?: number }) {
  const s = score ?? 0;
  const color = s >= 75 ? C.buy : s >= 65 ? C.watch : s >= 50 ? C.hold : C.sell;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const off = circ - (circ * Math.min(100, Math.max(0, s))) / 100;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <Circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 48 48)" />
      <SvgText x="48" y="57" textAnchor="middle" fontWeight="800" fontSize="24" fill={C.text}>{s}</SvgText>
    </Svg>
  );
}

export function Btn({ title, onPress, disabled, primary }: { title: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: primary ? C.cobalt : C.card, borderColor: primary ? C.cobalt : C.border, borderWidth: 1, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 8, opacity: disabled ? 0.6 : 1 }}
    >
      <Text style={{ color: primary ? "#fff" : C.text, fontWeight: "800", fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  placeholder,
  value,
  onChange,
  secret,
  keyboard,
  autoCapitalize = "none",
  maxLength,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secret?: boolean;
  keyboard?: "default" | "numeric" | "email-address";
  // "characters" is for tickers. Never transform the value in onChange: doing
  // that on every keystroke fights Android's input method and makes keys
  // repeat, reorder, or paste text back while deleting.
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
}) {
  const [hidden, setHidden] = React.useState(true);
  const toggle = !!secret;
  return (
    <View style={{ justifyContent: "center", marginBottom: 10 }}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        secureTextEntry={toggle ? hidden : false}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        importantForAutofill="no"
        maxLength={maxLength}
        placeholderTextColor={C.muted}
        style={{
          borderColor: C.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          paddingRight: toggle ? 48 : 12,
          fontSize: 15,
          color: C.text,
          backgroundColor: C.card,
        }}
      />
      {toggle ? (
        <Pressable
          onPress={() => setHidden((h) => !h)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Show password" : "Hide password"}
          style={{ position: "absolute", right: 6, padding: 8 }}
        >
          {hidden ? <EyeIcon size={20} color={C.muted} /> : <EyeOffIcon size={20} color={C.cobalt} />}
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={C.cobalt} />
    </View>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <Card>
      <Text style={{ fontWeight: "800", fontSize: 16, color: C.text }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>{body}</Text>
      {action}
    </Card>
  );
}

interface BoundaryState {
  message: string | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, BoundaryState> {
  state: BoundaryState = { message: null };

  static getDerivedStateFromError(e: unknown): BoundaryState {
    return { message: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }

  render() {
    if (this.state.message) {
      return (
        <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: "center" }}>
          <Text style={{ fontWeight: "800", fontSize: 18, color: C.text }}>Aido hit a problem</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>{this.state.message}</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Screenshot this and send it to support. It tells us exactly what broke.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
