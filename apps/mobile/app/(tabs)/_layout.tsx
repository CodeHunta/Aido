import { Tabs } from "expo-router";
import { C } from "../../lib/ui";
import { HomeIcon, PicksIcon, PortfolioIcon, SearchIcon, WatchlistIcon } from "../../lib/icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.cobalt,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { height: 62, paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: "Explore", tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{ title: "Portfolio", tabBarIcon: ({ color, size }) => <PortfolioIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{ title: "Watchlist", tabBarIcon: ({ color, size }) => <WatchlistIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="picks"
        options={{ title: "Picks", tabBarIcon: ({ color, size }) => <PicksIcon color={color} size={size} /> }}
      />
    </Tabs>
  );
}
