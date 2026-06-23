import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserGroups } from "../lib/groups";

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    async function routeUser() {
      const groups = await getUserGroups(user.id);
      router.replace(groups.length === 0 ? "/(app)/onboarding" : "/(app)/home");
    }

    routeUser();
  }, [loading, user]);

  return (
    <View style={styles.center}>
      <ActivityIndicator color="#1b4332" />
      <Text style={styles.text}>Opening Halaqa...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f6f0"
  },
  text: {
    marginTop: 12,
    color: "#6f776d"
  }
});

