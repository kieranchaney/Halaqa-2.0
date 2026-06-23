import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  async function logout() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Assalamu Alaikum</Text>
      <Text style={styles.title}>{user?.display_name || "Halaqa"}</Text>
      <Text style={styles.copy}>Your mobile halaqa app is ready for the weekly lesson and chat screens.</Text>
      <Pressable style={styles.button} onPress={() => router.push("/(app)/delete-account")}>
        <Text style={styles.buttonText}>Account Settings</Text>
      </Pressable>
      <Pressable style={styles.ghostButton} onPress={logout}>
        <Text style={styles.ghostText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f9f6f0" },
  kicker: { color: "#c9a84c", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: "#1b4332", fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 12 },
  copy: { color: "#6f776d", lineHeight: 22, marginBottom: 24 },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1b4332", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "white", fontWeight: "800" },
  ghostButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 },
  ghostText: { color: "#1b4332", fontWeight: "800" }
});

