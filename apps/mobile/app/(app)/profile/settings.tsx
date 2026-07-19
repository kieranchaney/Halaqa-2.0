import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { getBlockedUsers, unblockUser } from "../../../lib/moderation";
import { supabase } from "../../../lib/supabaseClient";

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
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  async function loadBlockedUsers() {
    if (!user?.id) return;
    setBlockedUsers(await getBlockedUsers(user.id));
  }

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

  async function changePassword() {
    try {
      console.log("Change password pressed: fetching current auth user");
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const email = userData.user?.email;
      if (!email) return Alert.alert("No email found", "Your account email is not available.");

      console.log("Calling resetPasswordForEmail for current user");
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      console.log("resetPasswordForEmail completed successfully");
      Alert.alert("Check your email", "A password reset link has been sent to your email.");
    } catch (error: any) {
      console.log("resetPasswordForEmail failed", error);
      Alert.alert("Unable to send reset link", error.message || "Please try again.");
    }
  }

  async function unblockBlockedUser(blockedUserId: string) {
    if (!user?.id) return;
    await unblockUser(user.id, blockedUserId);
    await loadBlockedUsers();
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
              <Text style={styles.value}>{blocked.user?.display_name || blocked.user?.username || "Blocked user"}</Text>
              <Pressable onPress={() => unblockBlockedUser(blocked.blocked_user_id)}>
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Pressable style={styles.deleteLink} onPress={() => router.push("/(app)/delete-account")}>
        <Text style={styles.deleteText}>Delete Account</Text>
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
  secondaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#E8E1D5", alignItems: "center", justifyContent: "center", marginTop: 10, marginBottom: 16 },
  secondaryText: { color: colors.green, fontWeight: "800" },
  muted: { color: colors.muted, marginTop: 4 },
  blockedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 },
  unblockText: { color: colors.green, fontWeight: "800" },
  deleteLink: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 },
  disabled: { opacity: 0.45 },
  deleteText: { color: colors.danger, fontWeight: "800" }
});
