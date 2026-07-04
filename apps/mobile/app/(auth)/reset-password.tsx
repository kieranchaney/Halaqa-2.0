import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabaseClient";

function tokenFromUrl(url: string) {
  const parsed = new URL(url.replace("#", "?"));
  return {
    accessToken: parsed.searchParams.get("access_token"),
    refreshToken: parsed.searchParams.get("refresh_token")
  };
}

export default function ResetPasswordScreen() {
  const { url } = useLocalSearchParams<{ url?: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function setRecoverySession() {
      if (!url) return;
      const { accessToken, refreshToken } = tokenFromUrl(decodeURIComponent(url));
      if (!accessToken || !refreshToken) {
        Alert.alert("Invalid reset link", "Please request a new password reset email.");
        return;
      }
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (error) Alert.alert("Invalid reset link", error.message);
      else setReady(true);
    }

    setRecoverySession();
  }, [url]);

  async function submit() {
    if (password.length < 8) return Alert.alert("Password must be at least 8 characters");
    if (password !== confirm) return Alert.alert("Passwords do not match");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return Alert.alert("Unable to update password", error.message);
    Alert.alert("Password updated", "You can continue to Halaqa.");
    router.replace("/");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.copy}>{ready ? "Choose a new password." : "Opening your reset link..."}</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="New password" secureTextEntry />
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry />
      <Pressable style={styles.button} onPress={submit} disabled={!ready}>
        <Text style={styles.buttonText}>Update Password</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9f6f0" },
  title: { fontSize: 28, fontWeight: "700", color: "#1b4332", marginBottom: 10 },
  copy: { color: "#6f776d", lineHeight: 22, marginBottom: 18 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#ded5c5", borderRadius: 8, backgroundColor: "#fffdfa", paddingHorizontal: 14, marginBottom: 12 },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1b4332", alignItems: "center", justifyContent: "center" },
  buttonText: { color: "white", fontWeight: "800" }
});

