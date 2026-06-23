import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!displayName.trim()) return Alert.alert("Display name required");
    if (password.length < 8) return Alert.alert("Password must be at least 8 characters");
    if (password !== confirm) return Alert.alert("Passwords do not match");
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Unable to sign up", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>H</Text>
      <Text style={styles.title}>Join your halaqa</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry />
      <Pressable style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Creating..." : "Create Account"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>Log in instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9f6f0" },
  logo: { alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: "#1b4332", color: "#c9a84c", textAlign: "center", lineHeight: 72, fontSize: 32, fontWeight: "700", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#1b4332", marginBottom: 18 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#ded5c5", borderRadius: 8, backgroundColor: "#fffdfa", paddingHorizontal: 14, marginBottom: 12 },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1b4332", alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { color: "white", fontWeight: "800" },
  link: { color: "#1b4332", fontWeight: "800", textAlign: "center", marginTop: 18 }
});

