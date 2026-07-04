import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { getRelationship, respondToFriendRequest, sendFriendRequest, unfriend } from "../../../lib/friends";
import { supabase } from "../../../lib/supabaseClient";

const colors = { background: "#FAF8F5", green: "#1B4332", gold: "#C9A84C", text: "#24352D", muted: "#6F776D" };

export default function UserProfileScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ userId?: string }>();
  const viewedId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const [profile, setProfile] = useState<any | null>(null);
  const [relationship, setRelationship] = useState<any | null>(null);

  async function load() {
    if (!user?.id || !viewedId) return;
    const [{ data, error }, rel] = await Promise.all([
      supabase.from("users").select("id, username, display_name, avatar_url, bio, is_private").eq("id", viewedId).maybeSingle(),
      getRelationship(user.id, viewedId)
    ]);
    if (error) return Alert.alert("Unable to load profile", error.message);
    setProfile(data);
    setRelationship(rel);
  }

  useEffect(() => { load(); }, [user?.id, viewedId]);

  const action = useMemo(() => {
    if (!relationship) return { label: "Add Friend", onPress: async () => { await sendFriendRequest(viewedId); await load(); } };
    if (relationship.status === "accepted") return { label: "Friends", onPress: async () => { await unfriend(relationship.id); await load(); } };
    if (relationship.status === "pending" && relationship.recipient_id === user?.id) return { label: "Accept Request", onPress: async () => { await respondToFriendRequest(relationship.id, true); await load(); } };
    if (relationship.status === "pending") return { label: "Requested", onPress: async () => {} };
    return { label: "Add Friend", onPress: async () => { await sendFriendRequest(viewedId); await load(); } };
  }, [relationship, user?.id, viewedId]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>{profile?.display_name || "Member"}</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.display_name || "H").slice(0, 1).toUpperCase()}</Text></View>
        <Text style={styles.username}>@{profile?.username || "username"}</Text>
        <Text style={styles.status}>{profile?.is_private ? "Private Account" : "Public Account"}</Text>
        <Text style={styles.bio}>{profile?.bio || "No bio yet."}</Text>
      </View>
      <Pressable style={styles.primaryButton} onPress={action.onPress}>
        <Text style={styles.primaryText}>{action.label}</Text>
      </Pressable>
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
  status: { color: colors.gold, fontWeight: "800", textAlign: "center", marginTop: 6 },
  bio: { color: colors.text, lineHeight: 22, textAlign: "center", marginTop: 10 },
  primaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" }
});
