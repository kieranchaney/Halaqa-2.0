import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Unable to log in", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>H</Text>
      <Text style={styles.title}>Log in</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
      <View style={styles.passwordRow}>
        <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry={!showPassword} />
        <Pressable style={styles.toggleButton} onPress={() => setShowPassword((current) => !current)}>
          <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>
      <Pressable style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Logging in..." : "Log In"}</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/(auth)/signup")}>
        <Text style={styles.link}>Create an account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#FAF8F5" },
  logo: { alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: "#1B4332", color: "#C9A84C", textAlign: "center", lineHeight: 72, fontSize: 32, fontWeight: "700", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "700", color: "#1B4332", marginBottom: 18 },
  input: { minHeight: 48, borderWidth: 0, borderRadius: 16, backgroundColor: "#FFFFFF", paddingHorizontal: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  passwordRow: { minHeight: 48, flexDirection: "row", alignItems: "center", borderRadius: 16, backgroundColor: "#FFFFFF", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  passwordInput: { flex: 1, minHeight: 48, paddingHorizontal: 14 },
  toggleButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14 },
  toggleText: { color: "#1B4332", fontWeight: "800" },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1B4332", alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { color: "white", fontWeight: "800" },
  link: { color: "#1B4332", fontWeight: "800", textAlign: "center", marginTop: 18 }
});

