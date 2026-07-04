import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

const tags = ["Reflection", "Goal", "Gratitude", "Dua", "Note"];
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

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function JournalScreen() {
  const { user } = useAuth();
  const storageKey = user?.id ? `halaqa_journal_${user.id}` : "halaqa_journal_guest";
  const [entries, setEntries] = useState<any[]>([]);
  const [mode, setMode] = useState<"list" | "compose" | "read">("list");
  const [selected, setSelected] = useState<any | null>(null);
  const [body, setBody] = useState("");
  const [tag, setTag] = useState(tags[0]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [entries]
  );

  async function persist(nextEntries: any[]) {
    setEntries(nextEntries);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextEntries));
  }

  useEffect(() => {
    async function load() {
      const raw = await AsyncStorage.getItem(storageKey);
      setEntries(raw ? JSON.parse(raw) : []);
    }
    load();
  }, [storageKey]);

  async function saveEntry() {
    if (!body.trim()) return;
    const nextEntry = { id: makeId(), body: body.trim(), tag, created_at: new Date().toISOString() };
    await persist([nextEntry, ...entries]);
    setBody("");
    setTag(tags[0]);
    setMode("list");
  }

  async function deleteEntry(entryId: string) {
    await persist(entries.filter((entry) => entry.id !== entryId));
    if (selected?.id === entryId) {
      setSelected(null);
      setMode("list");
    }
  }

  async function exportEntries() {
    if (entries.length === 0) {
      Alert.alert("Nothing to export", "Your journal is empty.");
      return;
    }

    const text = sortedEntries
      .map((entry) => `[${entry.tag}] ${new Date(entry.created_at).toLocaleString()}\n${entry.body}`)
      .join("\n\n---\n\n");
    const fileUri = `${FileSystem.documentDirectory}halaqa-journal.txt`;
    await FileSystem.writeAsStringAsync(fileUri, text);
    await Sharing.shareAsync(fileUri, { mimeType: "text/plain", dialogTitle: "Export Halaqa Journal" });
  }

  if (mode === "compose") {
    return (
      <View style={styles.screen}>
        <Text style={styles.kicker}>Journal</Text>
        <Text style={styles.title}>New Entry</Text>
        <View style={styles.tagRow}>
          {tags.map((item) => (
            <Pressable key={item} style={[styles.tag, tag === item && styles.tagActive]} onPress={() => setTag(item)}>
              <Text style={[styles.tagText, tag === item && styles.tagTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.composeInput}
          value={body}
          onChangeText={setBody}
          placeholder="Write privately..."
          placeholderTextColor="#9B948A"
          multiline
          textAlignVertical="top"
        />
        <Pressable style={[styles.primaryButton, !body.trim() && styles.disabled]} onPress={saveEntry} disabled={!body.trim()}>
          <Text style={styles.primaryText}>Save Entry</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => setMode("list")}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  if (mode === "read" && selected) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{selected.tag}</Text>
        <Text style={styles.title}>{formatDate(selected.created_at)}</Text>
        <View style={styles.readPanel}>
          <Text style={styles.entryBody}>{selected.body}</Text>
        </View>
        <Pressable style={styles.deleteButton} onPress={() => deleteEntry(selected.id)}>
          <Text style={styles.deleteText}>Delete Entry</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => setMode("list")}>
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Journal</Text>
          <Text style={styles.title}>Private Notes</Text>
        </View>
        <Pressable style={styles.composeButton} onPress={() => setMode("compose")}>
          <Text style={styles.composeText}>Compose</Text>
        </Pressable>
      </View>

      <Pressable style={styles.exportButton} onPress={exportEntries}>
        <Text style={styles.secondaryText}>Export .txt</Text>
      </Pressable>

      {sortedEntries.length === 0 ? (
        <View style={styles.emptyPanel}>
          <Text style={styles.sectionTitle}>No entries yet</Text>
          <Text style={styles.copy}>Your journal stays on this device only.</Text>
        </View>
      ) : (
        sortedEntries.map((entry) => (
          <Pressable
            key={entry.id}
            style={styles.entryCard}
            onPress={() => {
              setSelected(entry);
              setMode("read");
            }}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryTag}>{entry.tag}</Text>
              <Pressable onPress={() => deleteEntry(entry.id)} hitSlop={10}>
                <Text style={styles.smallDelete}>Delete</Text>
              </Pressable>
            </View>
            <Text style={styles.preview}>{entry.body.length > 60 ? `${entry.body.slice(0, 60)}...` : entry.body}</Text>
            <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 12 },
  sectionTitle: { color: colors.green, fontSize: 20, fontWeight: "800", marginBottom: 8 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  composeButton: { minHeight: 42, borderRadius: 8, backgroundColor: colors.green, justifyContent: "center", paddingHorizontal: 14 },
  composeText: { color: "#FFFFFF", fontWeight: "800" },
  exportButton: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 14, backgroundColor: colors.panel },
  emptyPanel: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, backgroundColor: colors.panel },
  entryCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14, backgroundColor: colors.panel, marginBottom: 10 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  entryTag: { color: colors.gold, fontWeight: "800" },
  smallDelete: { color: colors.danger, fontSize: 12, fontWeight: "800" },
  preview: { color: colors.text, fontSize: 15, lineHeight: 22 },
  date: { color: colors.muted, fontSize: 12, marginTop: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.panel },
  tagActive: { backgroundColor: colors.green, borderColor: colors.green },
  tagText: { color: colors.green, fontWeight: "800" },
  tagTextActive: { color: "#FFFFFF" },
  composeInput: { flex: 1, minHeight: 260, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: "#FFFFFF", padding: 12, color: colors.text, lineHeight: 22 },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginTop: 12 },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
  secondaryText: { color: colors.green, fontWeight: "800" },
  readPanel: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, backgroundColor: colors.panel },
  entryBody: { color: colors.text, fontSize: 16, lineHeight: 25 },
  deleteButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", marginTop: 16 },
  deleteText: { color: "#FFFFFF", fontWeight: "800" }
});
