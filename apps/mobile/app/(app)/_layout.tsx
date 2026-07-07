import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="halaqa"
        options={{
          title: "Halaqa",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "book" : "book-outline"} color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "person-circle" : "person-circle-outline"} color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color, size }) => <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={size} />
        }}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="delete-account" options={{ href: null }} />
    </Tabs>
  );
}
