import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const checks = [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(password) },
    { label: "Contains a special character", valid: /[^A-Za-z0-9]/.test(password) },
    { label: "Contains an uppercase letter", valid: /[A-Z]/.test(password) }
  ];
  const passwordIsStrong = checks.every((check) => check.valid);

  async function submit() {
    if (!displayName.trim()) return Alert.alert("Display name required");
    if (!passwordIsStrong) return Alert.alert("Password incomplete", "Please complete every password rule.");
    if (password !== confirm) return Alert.alert("Passwords do not match");
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace("/");
    } catch (error: any) {
      const message = String(error.message || "Please try again.");
      const lower = message.toLowerCase();
      if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
        Alert.alert("Unable to sign up", "An account with this email already exists. Please log in instead.");
      } else {
        Alert.alert("Unable to sign up", message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function openTermsOfService() {
    Linking.openURL("https://sites.google.com/view/halaqatermsofservice/home");
  }

  function openPrivacyPolicy() {
    Linking.openURL("https://sites.google.com/view/halaqa-privacy-policy/privacy-policy");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>H</Text>
      <Text style={styles.title}>Join your halaqa</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
        />
        <Pressable style={styles.eyeButton} onPress={() => setShowPassword((current) => !current)}>
          <Text style={styles.eyeText}>{showPassword ? "Hide" : "Eye"}</Text>
        </Pressable>
      </View>
      <View style={styles.checklist}>
        {checks.map((check) => (
          <Text key={check.label} style={[styles.checkText, check.valid && styles.checkTextValid]}>
            {check.valid ? "✓" : "X"} {check.label}
          </Text>
        ))}
      </View>
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} placeholder="Confirm password" secureTextEntry={!showPassword} />
      <Pressable style={styles.button} onPress={submit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Creating..." : "Create Account"}</Text>
      </Pressable>
      <Text style={styles.agreementText}>
        By signing up, you agree to our{" "}
        <Text style={styles.agreementLink} onPress={openTermsOfService}>
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text style={styles.agreementLink} onPress={openPrivacyPolicy}>
          Privacy Policy
        </Text>
      </Text>
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
  passwordRow: { minHeight: 48, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ded5c5", borderRadius: 8, backgroundColor: "#fffdfa", marginBottom: 8 },
  passwordInput: { flex: 1, minHeight: 48, paddingHorizontal: 14 },
  eyeButton: { minHeight: 48, justifyContent: "center", paddingHorizontal: 12 },
  eyeText: { color: "#1b4332", fontWeight: "800" },
  checklist: { marginBottom: 12 },
  checkText: { color: "#7d1f1f", fontSize: 13, lineHeight: 20 },
  checkTextValid: { color: "#1b4332" },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1b4332", alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { color: "white", fontWeight: "800" },
  agreementText: { color: "#4d5d53", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 14 },
  agreementLink: { color: "#1b4332", fontWeight: "800", textDecorationLine: "underline" },
  link: { color: "#1b4332", fontWeight: "800", textAlign: "center", marginTop: 18 }
});
