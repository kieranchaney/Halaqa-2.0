import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const colors = {
  background: "#FAF8F5",
  panel: "#FFFDF9",
  green: "#1B4332",
  gold: "#C9A84C",
  text: "#24352D",
  muted: "#6F776D",
  border: "#E6DED2",
  danger: "#7D1F1F"
};
const BLOCKED_KEY = "halaqa_blocked_users";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
<<<<<<< HEAD
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  async function loadBlockedUsers() {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    if (ids.length === 0) {
      setBlockedUsers([]);
      return;
    }
    const { data, error } = await supabase.from("users").select("id, display_name").in("id", ids);
    if (error) {
      setBlockedUsers(ids.map((id: string) => ({ id, display_name: "Blocked user" })));
      return;
    }
    setBlockedUsers(data || []);
  }
=======
  const [deleting, setDeleting] = useState(false);
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const { data, error } = await supabase.from("users").select("display_name").eq("id", user.id).maybeSingle();
      if (!error) setProfile(data);
      await loadBlockedUsers();
    }
    load();
  }, [user?.id]);

  async function logout() {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Unable to sign out", error.message || "Please try again.");
    }
  }

<<<<<<< HEAD
  async function changePassword() {
    if (!user?.email) return Alert.alert("No email found", "Your account email is not available.");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      Alert.alert("Check your email", "A password reset link has been sent to your email.");
    } catch (error: any) {
      Alert.alert("Unable to send reset link", error.message || "Please try again.");
    }
  }

  async function unblockUser(userId: string) {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    const next = ids.filter((id: string) => id !== userId);
    await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
    await loadBlockedUsers();
=======
  async function deleteAccount() {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Unable to delete account", error.message || "Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Are you sure?",
      "This will permanently delete your account and all your data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Account", style: "destructive", onPress: deleteAccount }
      ]
    );
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Settings</Text>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Display Name</Text>
        <Text style={styles.value}>{profile?.display_name || user?.display_name || "Member"}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || "No email available"}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={logout}>
        <Text style={styles.primaryText}>Sign Out</Text>
      </Pressable>

<<<<<<< HEAD
      <Pressable style={styles.secondaryButton} onPress={changePassword}>
        <Text style={styles.secondaryText}>Change Password</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.label}>Blocked Users</Text>
        {blockedUsers.length === 0 ? (
          <Text style={styles.muted}>No blocked users.</Text>
        ) : (
          blockedUsers.map((blocked) => (
            <View key={blocked.id} style={styles.blockedRow}>
              <Text style={styles.value}>{blocked.display_name || "Blocked user"}</Text>
              <Pressable onPress={() => unblockUser(blocked.id)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.deleteLink} onPress={() => router.push("/(app)/delete-account")}>
        <Text style={styles.deleteText}>Delete Account</Text>
=======
      <View style={styles.links}>
        <Pressable onPress={() => Linking.openURL("https://sites.google.com/view/halaqatermsofservice/home")}>
          <Text style={styles.policyLink}>Terms of Service</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL("https://sites.google.com/view/halaqa-privacy-policy/privacy-policy")}>
          <Text style={styles.policyLink}>Privacy Policy</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.deleteLink, deleting && styles.disabled]} onPress={confirmDeleteAccount} disabled={deleting}>
        <Text style={styles.deleteText}>{deleting ? "Deleting..." : "Delete Account"}</Text>
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 16 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, backgroundColor: colors.panel, marginBottom: 16 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginBottom: 6 },
  value: { color: colors.text, fontSize: 17, fontWeight: "700" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
<<<<<<< HEAD
  secondaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#E8E1D5", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 16 },
  secondaryText: { color: colors.green, fontWeight: "800" },
  muted: { color: colors.muted, marginTop: 4 },
  blockedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 },
  unblockText: { color: colors.green, fontWeight: "800" },
=======
  links: { alignItems: "center", gap: 10, marginTop: 18 },
  policyLink: { color: colors.green, fontWeight: "800", textDecorationLine: "underline" },
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
  deleteLink: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 },
  disabled: { opacity: 0.45 },
  deleteText: { color: colors.danger, fontWeight: "800" }
});
