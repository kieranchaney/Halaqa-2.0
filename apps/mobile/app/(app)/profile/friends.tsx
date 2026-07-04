import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { cancelFriendRequest, getFriends, getPendingRequests, respondToFriendRequest, searchUsers, unfriend } from "../../../lib/friends";

const colors = { background: "#FAF8F5", green: "#1B4332", gold: "#C9A84C", text: "#24352D", muted: "#6F776D" };

export default function FriendsScreen() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function load() {
    if (!user?.id) return;
    const [pending, accepted] = await Promise.all([getPendingRequests(user.id), getFriends(user.id)]);
    setIncoming(pending.incoming);
    setOutgoing(pending.outgoing);
    setFriends(accepted);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function runSearch(text: string) {
    setQuery(text);
    try { setResults(await searchUsers(text)); }
    catch (error: any) { Alert.alert("Unable to search", error.message || "Please try again."); }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Profile</Text>
      <Text style={styles.title}>Friends</Text>
      <TextInput style={styles.input} value={query} onChangeText={runSearch} placeholder="Search username or name" autoCapitalize="none" />
      {results.map((result) => (
        <Pressable key={result.id} style={styles.card} onPress={() => router.push(`/(app)/profile/${result.id}`)}>
          <Text style={styles.name}>{result.display_name || result.username}</Text>
          <Text style={styles.muted}>@{result.username}</Text>
        </Pressable>
      ))}
      <Section title="Incoming Requests" empty="No incoming requests.">
        {incoming.map((request) => <RequestRow key={request.id} request={request} label={request.requester?.display_name || request.requester?.username} actions={[
          ["Accept", () => respondToFriendRequest(request.id, true).then(load)],
          ["Decline", () => respondToFriendRequest(request.id, false).then(load)]
        ]} />)}
      </Section>
      <Section title="Outgoing Requests" empty="No outgoing requests.">
        {outgoing.map((request) => <RequestRow key={request.id} request={request} label={request.recipient?.display_name || request.recipient?.username} actions={[["Cancel", () => cancelFriendRequest(request.id).then(load)]]} />)}
      </Section>
      <Section title="Current Friends" empty="No friends yet.">
        {friends.map((request) => <RequestRow key={request.id} request={request} label={request.friend?.display_name || request.friend?.username} actions={[["Unfriend", () => unfriend(request.id).then(load)]]} />)}
      </Section>
    </ScrollView>
  );
}

function Section({ title, empty, children }: any) {
  const count = Array.isArray(children) ? children.length : 0;
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{count ? children : <Text style={styles.muted}>{empty}</Text>}</View>;
}

function RequestRow({ label, actions }: any) {
  return <View style={styles.card}><Text style={styles.name}>{label || "Member"}</Text><View style={styles.actions}>{actions.map(([text, onPress]: any[]) => <Pressable key={text} style={styles.smallButton} onPress={onPress}><Text style={styles.smallButtonText}>{text}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 16 },
  input: { minHeight: 48, borderRadius: 16, backgroundColor: "#FFFFFF", paddingHorizontal: 14, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  section: { marginTop: 18 },
  sectionTitle: { color: colors.green, fontSize: 20, fontWeight: "800", marginBottom: 10 },
  card: { borderRadius: 16, backgroundColor: "#FFFFFF", padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  name: { color: colors.text, fontWeight: "800" },
  muted: { color: colors.muted, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  smallButton: { borderRadius: 12, backgroundColor: colors.green, paddingHorizontal: 12, paddingVertical: 8 },
  smallButtonText: { color: "#FFFFFF", fontWeight: "800" }
});
