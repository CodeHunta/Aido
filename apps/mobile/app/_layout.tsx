import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { OfflineBar } from "../lib/offline";
import { C, ErrorBoundary, Loading } from "../lib/ui";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    else if (user && inAuth) router.replace("/(tabs)");
  }, [user, loading, segments, router]);

  if (loading) return <Loading />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Gate>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
            <StatusBar style="auto" />
            <OfflineBar />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="forgot" />
              <Stack.Screen name="help" />
              <Stack.Screen name="terms" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="stocks/[ticker]" />
              <Stack.Screen name="compare" />
              <Stack.Screen name="alerts" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="premium" />
              <Stack.Screen name="methodology" />
            </Stack>
          </SafeAreaView>
        </Gate>
      </ErrorBoundary>
    </AuthProvider>
  );
}
