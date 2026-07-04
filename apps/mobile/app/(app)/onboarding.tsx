import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { createGroup, joinGroupByCode } from "../../lib/groups";

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      if (modal === "create") await createGroup(user.id, value.trim());
      if (modal === "join") await joinGroupByCode(value.trim());
      setModal(null);
      setValue("");
      router.replace("/(app)/home");
    } catch (error: any) {
      Alert.alert("Unable to continue", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>H</Text>
      <Text style={styles.title}>Welcome to Halaqa</Text>
      <Text style={styles.copy}>To get started, create a new circle or join one with an invite code.</Text>
      <Pressable style={styles.button} onPress={() => setModal("create")}>
        <Text style={styles.buttonText}>Create a Circle</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => setModal("join")}>
        <Text style={styles.secondaryText}>Join with Invite Code</Text>
      </Pressable>

      <Modal transparent visible={modal !== null} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>{modal === "create" ? "Create a Circle" : "Join with Invite Code"}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder={modal === "create" ? "Group name" : "Invite code"}
              autoCapitalize="none"
            />
            <Pressable style={styles.button} onPress={submit} disabled={!value.trim() || submitting}>
              <Text style={styles.buttonText}>{submitting ? "Working..." : "Continue"}</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setModal(null)}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9f6f0" },
  logo: { alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: "#1b4332", color: "#c9a84c", textAlign: "center", lineHeight: 72, fontSize: 32, fontWeight: "700", marginBottom: 24 },
  title: { fontSize: 30, fontWeight: "800", color: "#1b4332", textAlign: "center", marginBottom: 10 },
  copy: { color: "#6f776d", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  button: { minHeight: 48, borderRadius: 8, backgroundColor: "#1b4332", alignItems: "center", justifyContent: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "800" },
  secondaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#dfe9de", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryText: { color: "#1b4332", fontWeight: "800" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.35)" },
  modalPanel: { borderRadius: 8, padding: 18, backgroundColor: "#fffdfa" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1b4332", marginBottom: 12 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#ded5c5", borderRadius: 8, paddingHorizontal: 14 },
  cancelButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 }
});

