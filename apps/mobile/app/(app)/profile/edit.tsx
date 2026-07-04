import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { updateProfile } from "../../../lib/friends";
import { supabase } from "../../../lib/supabaseClient";

const colors = { background: "#FAF8F5", green: "#1B4332", gold: "#C9A84C", text: "#24352D", muted: "#6F776D" };
const validUsername = /^[a-z0-9_]{3,20}$/;

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const { data } = await supabase.from("users").select("username, bio, avatar_url, is_private").eq("id", user.id).maybeSingle();
      setUsername(data?.username || "");
      setBio(data?.bio || "");
      setAvatarUrl(data?.avatar_url || "");
      setIsPrivate(Boolean(data?.is_private));
    }
    load();
  }, [user?.id]);

  async function save() {
    if (!user?.id) return;
    const cleanUsername = username.trim().toLowerCase();
    if (!validUsername.test(cleanUsername)) return Alert.alert("Invalid username", "Use 3-20 lowercase letters, numbers, or underscores.");
    setSaving(true);
    try {
      await updateProfile(user.id, { username: cleanUsername, bio: bio.trim(), avatar_url: avatarUrl.trim(), is_private: isPrivate });
      router.back();
    } catch (error: any) {
      Alert.alert("Unable to save profile", error.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>Edit Profile</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="username" autoCapitalize="none" />
      <Text style={styles.help}>3-20 lowercase letters, numbers, or underscores.</Text>
      <TextInput style={[styles.input, styles.bioInput]} value={bio} onChangeText={setBio} placeholder="Bio" multiline />
      <TextInput style={styles.input} value={avatarUrl} onChangeText={setAvatarUrl} placeholder="Avatar URL" autoCapitalize="none" />
      <Pressable style={styles.toggle} onPress={() => setIsPrivate((current) => !current)}>
        <Text style={styles.toggleText}>{isPrivate ? "Private Account" : "Public Account"}</Text>
      </Pressable>
      <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Profile"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 16 },
  input: { minHeight: 48, borderRadius: 16, backgroundColor: "#FFFFFF", paddingHorizontal: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bioInput: { minHeight: 120, paddingTop: 12, textAlignVertical: "top" },
  help: { color: colors.muted, marginBottom: 12 },
  toggle: { minHeight: 48, borderRadius: 16, backgroundColor: "#E8E1D5", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  toggleText: { color: colors.green, fontWeight: "800" },
  primaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  disabled: { opacity: 0.5 }
});
