import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { updateProfile } from "../../../lib/friends";
import { supabase } from "../../../lib/supabaseClient";

const colors = { background: "#FAF8F5", green: "#1B4332", gold: "#C9A84C", text: "#24352D", muted: "#6F776D", border: "#E6DED2" };

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);

  async function loadProfile() {
    if (!user?.id) return;
    const { data, error } = await supabase.from("users").select("id, username, display_name, avatar_url, bio, is_private").eq("id", user.id).maybeSingle();
    if (error) return Alert.alert("Unable to load profile", error.message);
    setProfile(data);
  }

  useEffect(() => { loadProfile(); }, [user?.id]);

  async function togglePrivate(is_private: boolean) {
    if (!user?.id || !profile) return;
    try { setProfile(await updateProfile(user.id, { ...profile, is_private })); }
    catch (error: any) { Alert.alert("Unable to update profile", error.message || "Please try again."); }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>{profile?.display_name || user?.display_name || "Member"}</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.display_name || "H").slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.username}>@{profile?.username || "username"}</Text>
        <Text style={styles.bio}>{profile?.bio || "No bio yet."}</Text>
        <View style={styles.row}>
          <View><Text style={styles.label}>Private Account</Text><Text style={styles.help}>Private accounts approve friend requests.</Text></View>
          <Switch value={Boolean(profile?.is_private)} onValueChange={togglePrivate} />
        </View>
      </View>
      <Pressable style={styles.primaryButton} onPress={() => router.push("/(app)/profile/edit")}><Text style={styles.primaryText}>Edit Profile</Text></Pressable>
      <Pressable style={styles.secondaryButton} onPress={() => router.push("/(app)/profile/friends")}><Text style={styles.secondaryText}>Friends</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 16 },
  card: { borderRadius: 16, padding: 18, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 12 },
  avatarText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  username: { color: colors.green, fontSize: 18, fontWeight: "800", textAlign: "center" },
  bio: { color: colors.text, lineHeight: 22, textAlign: "center", marginTop: 10, marginBottom: 18 },
  row: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.text, fontWeight: "800" },
  help: { color: colors.muted, lineHeight: 20, maxWidth: 230 },
  primaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: "#E8E1D5", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryText: { color: colors.green, fontWeight: "800" }
});
