import { Tabs } from "expo-router";

const colors = {
  background: "#FAF8F5",
  green: "#1B4332",
  gold: "#C9A84C",
  muted: "#6F776D"
};

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: "#E6DED2",
          height: 66,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800"
        }
      }}
    >
      <Tabs.Screen name="halaqa" options={{ title: "Halaqa", tabBarIcon: () => null }} />
      <Tabs.Screen name="journal" options={{ title: "Journal", tabBarIcon: () => null }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: () => null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="delete-account" options={{ href: null }} />
    </Tabs>
  );
}
