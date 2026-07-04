import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function DeleteAccountScreen() {
  const { user, signOut } = useAuth();
  const [adminCount, setAdminCount] = useState(0);
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAdminGroups() {
      if (!user?.id) return;
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "admin");
      setAdminCount(count || 0);
    }

    loadAdminGroups();
  }, [user?.id]);

  async function deleteAccount() {
    if (confirm !== "DELETE") return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Unable to delete account", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Delete account</Text>
      <Text style={styles.warning}>This will permanently delete your account, remove you from all groups, and delete your messages.</Text>
      {adminCount > 0 && (
        <Text style={styles.warning}>
          You are an admin of one or more groups. Deleting your account will transfer admin status to another member, or delete the group if you are the only member.
        </Text>
      )}
      <Text style={styles.copy}>Type DELETE to confirm.</Text>
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} autoCapitalize="characters" placeholder="DELETE" />
      <Pressable style={[styles.deleteButton, confirm !== "DELETE" && styles.disabled]} onPress={deleteAccount} disabled={confirm !== "DELETE" || submitting}>
        <Text style={styles.deleteText}>{submitting ? "Deleting..." : "Delete My Account"}</Text>
      </Pressable>
      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9f6f0" },
  title: { fontSize: 30, fontWeight: "800", color: "#7d1f1f", marginBottom: 14 },
  warning: { borderWidth: 1, borderColor: "#e0c2c2", borderRadius: 8, backgroundColor: "#fff4f4", color: "#7d1f1f", padding: 12, lineHeight: 21, marginBottom: 12 },
  copy: { color: "#6f776d", marginBottom: 8 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#ded5c5", borderRadius: 8, backgroundColor: "#fffdfa", paddingHorizontal: 14 },
  deleteButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#7d1f1f", alignItems: "center", justifyContent: "center", marginTop: 16 },
  disabled: { opacity: 0.45 },
  deleteText: { color: "white", fontWeight: "800" },
  cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelText: { color: "#1b4332", fontWeight: "800" }
});

