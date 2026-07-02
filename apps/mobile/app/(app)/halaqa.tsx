import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  createGroup,
  getGroupMembers,
  getLatestGroupLesson,
  getReflectionResponse,
  getReflectionResponses,
  getUserGroups,
  joinGroupByCode,
  leaveGroup,
  removeGroupMember,
  submitReflection
} from "../../lib/groups";
<<<<<<< HEAD
import { getMessages, sendLessonMessage, sendMessage, subscribeToMessages, unsubscribe } from "../../lib/messages";
=======
import { getVisibleMessages, sendMessage, subscribeToMessages, unsubscribe } from "../../lib/messages";
import { blockUser, getBlockedUserIds, reportContent } from "../../lib/moderation";
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd

const BLOCKED_KEY = "halaqa_blocked_users";
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

function formatCountdown(target: string | null | undefined) {
  if (!target) return "00d 00h 00m 00s";
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function preview(text: string) {
  return text.length > 84 ? `${text.slice(0, 84)}...` : text;
}

export default function HalaqaScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [groupLesson, setGroupLesson] = useState<any | null>(null);
  const [reflection, setReflection] = useState<any | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [expandedReflections, setExpandedReflections] = useState<Record<string, boolean>>({});
  const [reflectionReplyId, setReflectionReplyId] = useState<string | null>(null);
  const [reflectionReplyBody, setReflectionReplyBody] = useState("");
  const [reflectionBody, setReflectionBody] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
<<<<<<< HEAD
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
=======
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
  const [now, setNow] = useState(Date.now());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [groupInput, setGroupInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const lesson = groupLesson?.lessons;
  const currentMember = members.find((member) => member.user_id === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const visibleMessages = messages.filter((message) => !message.user_id || !blockedUsers.includes(message.user_id));
  const visibleReflections = reflections.filter((item) => !blockedUsers.includes(item.user_id));
  const chatUnlocked = useMemo(() => {
    if (!groupLesson?.reflection_unlocked_at) return false;
    return now >= new Date(groupLesson.reflection_unlocked_at).getTime();
  }, [groupLesson?.reflection_unlocked_at, now]);

  async function loadBlockedUsers() {
    const raw = await AsyncStorage.getItem(BLOCKED_KEY);
    setBlockedUsers(raw ? JSON.parse(raw) : []);
  }

  async function blockUser(userId: string) {
    if (userId === user?.id) return;
    const next = Array.from(new Set([...blockedUsers, userId]));
    setBlockedUsers(next);
    await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
  }

  async function loadGroups(preferredGroupId?: string) {
    if (!user?.id) return;
    const nextGroups = await getUserGroups(user.id);
    setGroups(nextGroups);
    const preferred = preferredGroupId ? nextGroups.find((group) => group.id === preferredGroupId) : null;
    setActiveGroup(preferred || nextGroups[0] || null);
  }

  async function loadGroupData(group: any) {
    if (!user?.id || !group?.id) return;
<<<<<<< HEAD
    const [latest, nextMembers, nextMessages] = await Promise.all([
      getLatestGroupLesson(group.id),
      getGroupMembers(group.id),
      getMessages(group.id)
    ]);
=======
    const latest = await getLatestGroupLesson(group.id);
    const hiddenUserIds = await getBlockedUserIds(user.id);
    setBlockedUserIds(hiddenUserIds);
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
    setGroupLesson(latest);
    setMembers(nextMembers);
    setMessages(nextMessages);
    setReflection(null);
    setReflections([]);

    if (latest?.id) {
      const [existing, allReflections] = await Promise.all([
        getReflectionResponse(latest.id, user.id),
        getReflectionResponses(latest.id)
      ]);
      setReflection(existing);
      setReflections(allReflections);
    }
<<<<<<< HEAD
=======

    const nextMessages = await getVisibleMessages(group.id, hiddenUserIds);
    setMessages(nextMessages);
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
  }

  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        if (!user?.id) return;
        setLoading(true);
        await loadBlockedUsers();
        const nextGroups = await getUserGroups(user.id);
        if (!active) return;
        setGroups(nextGroups);
        setActiveGroup(nextGroups[0] || null);
      } catch (error: any) {
        Alert.alert("Unable to load halaqa", error.message || "Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activeGroup) return;
    let active = true;
    async function load() {
      try {
        setLoading(true);
        await loadGroupData(activeGroup);
      } catch (error: any) {
        if (active) Alert.alert("Unable to load lesson", error.message || "Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [activeGroup?.id]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeGroup?.id || !chatUnlocked) return;
    const subscription = subscribeToMessages(activeGroup.id, async () => {
      const nextMessages = await getVisibleMessages(activeGroup.id, blockedUserIds);
      setMessages(nextMessages);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    });
    return () => {
      unsubscribe(subscription);
    };
  }, [activeGroup?.id, chatUnlocked, blockedUserIds]);

  async function reportMessage(message: any) {
    if (!user?.id || !message?.user_id || message.user_id === user.id) return;
    try {
      await reportContent(user.id, message.user_id, message.id, "Reported from group message");
      Alert.alert("Thank you, we will review this report");
    } catch (error: any) {
      Alert.alert("Unable to report message", error.message || "Please try again.");
    }
  }

  async function blockMember(memberId: string) {
    if (!user?.id || !memberId || memberId === user.id) return;
    try {
      await blockUser(user.id, memberId);
      setBlockedUserIds((current) => Array.from(new Set([...current, memberId])));
      setMessages((current) => current.filter((message) => message.is_system || message.user_id !== memberId));
      Alert.alert("User blocked");
    } catch (error: any) {
      Alert.alert("Unable to block user", error.message || "Please try again.");
    }
  }

  function showMessageActions(message: any) {
    if (!message?.user_id || message.user_id === user?.id) return;
    Alert.alert(message.display_name || "Member", "Choose an action", [
      { text: "Report", onPress: () => reportMessage(message) },
      { text: "Block User", style: "destructive", onPress: () => blockMember(message.user_id) },
      { text: "Cancel", style: "cancel" }
    ]);
  }

  async function submitGroupAction() {
    if (!user?.id || !groupInput.trim() || !modal) return;
    setSubmitting(true);
    try {
      if (modal === "create") await createGroup(user.id, groupInput.trim());
      if (modal === "join") await joinGroupByCode(groupInput.trim());
      setModal(null);
      setGroupInput("");
      await loadGroups(activeGroup?.id);
    } catch (error: any) {
      Alert.alert("Unable to continue", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitUserReflection() {
    if (!user?.id || !activeGroup?.id || !groupLesson?.id || !reflectionBody.trim()) return;
    setSubmitting(true);
    try {
      const saved = await submitReflection(groupLesson.id, activeGroup.id, user.id, reflectionBody.trim());
      setReflection(saved);
      setReflectionBody("");
      setReflections(await getReflectionResponses(groupLesson.id));
    } catch (error: any) {
      Alert.alert("Unable to submit reflection", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitChatMessage(bodyOverride?: string) {
    if (!user?.id || !activeGroup?.id) return;
    const body = (bodyOverride || messageBody).trim();
    if (!body) return;
    setMessageBody("");
    try {
      const saved = groupLesson?.id
        ? await sendLessonMessage(activeGroup.id, user.id, body, groupLesson.id, null)
        : await sendMessage(activeGroup.id, user.id, body);
      setMessages((current) => [...current, saved]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } catch (error: any) {
      setMessageBody(body);
      Alert.alert("Unable to send message", error.message || "Please try again.");
    }
  }

  async function submitReflectionReply(reflectionItem: any) {
    if (!user?.id || !activeGroup?.id || !groupLesson?.id || !reflectionReplyBody.trim()) return;
    const body = `Replying to ${reflectionItem.display_name}'s reflection:\n"${preview(reflectionItem.body)}"\n\n${reflectionReplyBody.trim()}`;
    setReflectionReplyBody("");
    setReflectionReplyId(null);
    await submitChatMessage(body);
  }

  async function replyToMessage(message: any) {
    const body = `Replying to ${message.display_name}:\n"${preview(message.body)}"\n\n`;
    setMessageBody(body);
  }

  async function leaveCurrentGroup() {
    if (!activeGroup?.id || !user?.id) return;
    setSubmitting(true);
    try {
      await leaveGroup(activeGroup.id, user.id);
      setDrawerOpen(false);
      await loadGroups();
    } catch (error: any) {
      Alert.alert("Unable to leave group", error.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeUserFromCurrentGroup(userId: string) {
    if (!activeGroup?.id || !isAdmin || userId === user?.id) return;
    try {
      await removeGroupMember(activeGroup.id, userId);
      setMembers(await getGroupMembers(activeGroup.id));
      Alert.alert("Member removed", "This user has been removed from the group.");
    } catch (error: any) {
      Alert.alert("Unable to remove member", error.message || "Please try again.");
    }
  }

  function showUserOptions(target: any, canReply: boolean, onReply?: () => void) {
    if (!target?.user_id) return;
    const buttons: any[] = [];
    if (canReply && onReply) buttons.push({ text: "Reply", onPress: onReply });
    if (target.user_id !== user?.id) buttons.push({ text: "Block User", onPress: () => blockUser(target.user_id) });
    if (isAdmin && target.user_id !== user?.id) {
      buttons.push({ text: "Remove from Group", style: "destructive", onPress: () => removeUserFromCurrentGroup(target.user_id) });
    }
    buttons.push({ text: "Cancel", style: "cancel" });
    Alert.alert(target.display_name || "Member", "Choose an action.", buttons);
  }

  if (loading && !activeGroup) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.muted}>Preparing your circle...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.topBar}>
        <Pressable style={styles.menuButton} onPress={() => setDrawerOpen(true)}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.kicker}>Halaqa</Text>
          <Text style={styles.topTitle}>{activeGroup?.name || "Your Circle"}</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={[styles.content, chatUnlocked && styles.chatContent]} keyboardShouldPersistTaps="handled">
        {!activeGroup && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Begin with a circle</Text>
            <Text style={styles.copy}>Create a private halaqa or join one with an invite code.</Text>
            <Pressable style={styles.primaryButton} onPress={() => setModal("create")}>
              <Text style={styles.primaryText}>Create Group</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setModal("join")}>
              <Text style={styles.secondaryText}>Join Group</Text>
            </Pressable>
          </View>
        )}

        {activeGroup && !loading && !groupLesson && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>No lesson yet</Text>
            <Text style={styles.copy}>When a weekly lesson is released for this group, it will appear here.</Text>
          </View>
        )}

        {lesson && (
          <>
            <View style={styles.lessonPanel}>
              <Text style={styles.lessonTheme}>{lesson.theme}</Text>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.bodyText}>{lesson.body_text}</Text>
              <View style={styles.quoteBlock}>
                <Text style={styles.arabic}>{lesson.ayat}</Text>
                <Text style={styles.transliteration}>{lesson.ayat_transliteration}</Text>
                <Text style={styles.translation}>{lesson.ayat_translation}</Text>
                <Text style={styles.reference}>{lesson.ayat_reference}</Text>
              </View>
              <View style={styles.quoteBlock}>
                <Text style={styles.bodyText}>{lesson.hadith}</Text>
                <Text style={styles.reference}>{lesson.hadith_reference}</Text>
              </View>
            </View>

            {!chatUnlocked && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Reflection Mode</Text>
                <Text style={styles.countdown}>{formatCountdown(groupLesson.reflection_unlocked_at)}</Text>
                <Text style={styles.copy}>Open Chat unlocks after everyone has quiet time to reflect.</Text>
                {reflection ? (
                  <View style={styles.readOnlyReflection}>
                    <Text style={styles.successText}>Your reflection has been submitted.</Text>
                    <Text style={styles.bodyText}>{reflection.body}</Text>
                  </View>
                ) : (
                  <>
                    <TextInput style={styles.reflectionInput} value={reflectionBody} onChangeText={setReflectionBody} placeholder="Write your reflection..." placeholderTextColor="#9B948A" multiline />
                    <Pressable style={[styles.primaryButton, (!reflectionBody.trim() || submitting) && styles.disabled]} onPress={submitUserReflection} disabled={!reflectionBody.trim() || submitting}>
                      <Text style={styles.primaryText}>{submitting ? "Submitting..." : "Submit Reflection"}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            )}

            {chatUnlocked && (
              <>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Reflections</Text>
                  {visibleReflections.length === 0 && <Text style={styles.copy}>No visible reflections yet.</Text>}
                  {visibleReflections.map((item) => {
                    const expanded = Boolean(expandedReflections[item.id]);
                    const replies = visibleMessages.filter((message) => message.group_lesson_id === groupLesson.id && message.body?.includes(`Replying to ${item.display_name}'s reflection:`));
                    return (
                      <Pressable key={item.id} style={styles.reflectionCard} onPress={() => setExpandedReflections((current) => ({ ...current, [item.id]: !expanded }))}>
                        <Pressable onLongPress={() => showUserOptions(item, true, () => setReflectionReplyId(item.id))}>
                          <Text style={styles.sender}>{item.display_name}</Text>
                        </Pressable>
                        <Text style={styles.bodyText}>{expanded ? item.body : preview(item.body)}</Text>
                        {expanded && (
                          <>
                            {replies.map((reply) => (
                              <View key={reply.id} style={styles.replyCard}>
                                <Text style={styles.sender}>{reply.display_name}</Text>
                                <Text style={styles.messageText}>{reply.body}</Text>
                              </View>
                            ))}
                            {reflectionReplyId === item.id ? (
                              <>
                                <TextInput style={styles.input} value={reflectionReplyBody} onChangeText={setReflectionReplyBody} placeholder="Write a reply..." placeholderTextColor="#9B948A" />
                                <Pressable style={styles.primaryButton} onPress={() => submitReflectionReply(item)}>
                                  <Text style={styles.primaryText}>Send Reply</Text>
                                </Pressable>
                              </>
                            ) : (
                              <Pressable style={styles.inlineButton} onPress={() => setReflectionReplyId(item.id)}>
                                <Text style={styles.secondaryText}>Reply</Text>
                              </Pressable>
                            )}
                          </>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.chatPanel}>
                  <Text style={styles.sectionTitle}>Open Chat</Text>
                  {visibleMessages.map((message) => {
                    const mine = message.user_id === user?.id;
                    if (message.is_system) {
                      return (
                        <View key={message.id} style={styles.systemMessage}>
                          <Text style={styles.systemText}>{message.body}</Text>
                        </View>
                      );
                    }
                    return (
                      <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
                        <Pressable style={[styles.messageBubble, mine && styles.messageBubbleMine]} onLongPress={() => showUserOptions(message, true, () => replyToMessage(message))}>
                          <Pressable onPress={() => showUserOptions(message, true, () => replyToMessage(message))}>
                            <Text style={[styles.sender, mine && styles.senderMine]}>{message.display_name}</Text>
                          </Pressable>
                          <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.body}</Text>
                          <Text style={[styles.timestamp, mine && styles.timestampMine]}>{formatTime(message.created_at)}</Text>
                        </Pressable>
                      </View>
                    );
<<<<<<< HEAD
                  })}
                </View>
              </>
=======
                  }
                  return (
                    <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
                      <Pressable
                        style={[styles.messageBubble, mine && styles.messageBubbleMine]}
                        onLongPress={() => showMessageActions(message)}
                      >
                        <View style={styles.senderRow}>
                          <Text style={[styles.sender, mine && styles.senderMine]}>{message.display_name}</Text>
                          {!mine && (
                            <Pressable hitSlop={8} onPress={() => blockMember(message.user_id)}>
                              <Text style={styles.blockText}>Block</Text>
                            </Pressable>
                          )}
                        </View>
                        <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.body}</Text>
                        <Text style={[styles.timestamp, mine && styles.timestampMine]}>{formatTime(message.created_at)}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
            )}
          </>
        )}
      </ScrollView>

      {chatUnlocked && activeGroup && (
        <View style={styles.inputBar}>
          <TextInput style={styles.messageInput} value={messageBody} onChangeText={setMessageBody} placeholder="Write a message..." placeholderTextColor="#9B948A" onSubmitEditing={() => submitChatMessage()} returnKeyType="send" multiline />
          <Pressable style={styles.sendButton} onPress={() => submitChatMessage()}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      )}

      <Modal transparent visible={drawerOpen} animationType="fade">
        <View style={styles.drawerBackdrop}>
          <View style={styles.drawer}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            {groups.map((group) => (
              <Pressable key={group.id} style={[styles.drawerItem, activeGroup?.id === group.id && styles.drawerItemActive]} onPress={() => { setActiveGroup(group); setDrawerOpen(false); }}>
                <Text style={[styles.drawerText, activeGroup?.id === group.id && styles.drawerTextActive]}>{group.name}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.primaryButton} onPress={() => { setDrawerOpen(false); setModal("join"); }}>
              <Text style={styles.primaryText}>Join a group</Text>
            </Pressable>
            {activeGroup && (
              <Pressable style={styles.dangerButton} onPress={leaveCurrentGroup} disabled={submitting}>
                <Text style={styles.primaryText}>Leave this group</Text>
              </Pressable>
            )}
            <Pressable style={styles.cancelButton} onPress={() => setDrawerOpen(false)}>
              <Text style={styles.secondaryText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={modal !== null} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalPanel}>
            <Text style={styles.sectionTitle}>{modal === "create" ? "Create Group" : "Join Group"}</Text>
            <TextInput style={styles.input} value={groupInput} onChangeText={setGroupInput} placeholder={modal === "create" ? "Group name" : "Invite code"} placeholderTextColor="#9B948A" autoCapitalize="none" />
            <Pressable style={[styles.primaryButton, (!groupInput.trim() || submitting) && styles.disabled]} onPress={submitGroupAction} disabled={!groupInput.trim() || submitting}>
              <Text style={styles.primaryText}>{submitting ? "Working..." : "Continue"}</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setModal(null)}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  topBar: { flexDirection: "row", alignItems: "center", paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: colors.background },
  menuButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  menuIcon: { color: colors.green, fontSize: 26, fontWeight: "800" },
  topTitleWrap: { flex: 1 },
  topTitle: { color: colors.green, fontSize: 24, fontWeight: "800" },
  content: { padding: 20, paddingBottom: 100 },
  chatContent: { paddingBottom: 170 },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  muted: { color: colors.muted, marginTop: 12 },
  card: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  lessonPanel: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 18, marginBottom: 16 },
  lessonTheme: { color: colors.gold, fontSize: 13, fontWeight: "800", marginBottom: 8 },
  lessonTitle: { color: colors.green, fontSize: 24, fontWeight: "800", marginBottom: 14 },
  sectionTitle: { color: colors.green, fontSize: 20, fontWeight: "800", marginBottom: 10 },
  bodyText: { color: colors.text, fontSize: 15, lineHeight: 23, flexShrink: 1, flexWrap: "wrap" },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12, flexShrink: 1, flexWrap: "wrap" },
  quoteBlock: { borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 12, marginTop: 18 },
  arabic: { color: colors.green, fontSize: 20, lineHeight: 34, textAlign: "right", marginBottom: 10, flexShrink: 1, flexWrap: "wrap" },
  transliteration: { color: colors.text, fontStyle: "italic", lineHeight: 22, marginBottom: 8, flexShrink: 1, flexWrap: "wrap" },
  translation: { color: colors.text, lineHeight: 22, flexShrink: 1, flexWrap: "wrap" },
  reference: { color: colors.muted, fontSize: 13, fontWeight: "700", marginTop: 8 },
  countdown: { color: colors.green, fontSize: 26, fontWeight: "800", marginBottom: 8 },
  reflectionInput: { minHeight: 150, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: "#FFFFFF", padding: 12, color: colors.text, textAlignVertical: "top", marginBottom: 12 },
  readOnlyReflection: { borderWidth: 1, borderColor: "#D9E6D9", borderRadius: 8, backgroundColor: "#F4FAF2", padding: 12 },
  reflectionCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: "#FFFFFF", marginBottom: 10 },
  replyCard: { borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 10, marginTop: 10 },
  successText: { color: colors.green, fontWeight: "800", marginBottom: 8 },
  primaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginTop: 10 },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#E8E1D5", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryText: { color: colors.green, fontWeight: "800" },
  dangerButton: { minHeight: 48, borderRadius: 8, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", marginTop: 10 },
  inlineButton: { minHeight: 40, alignItems: "flex-start", justifyContent: "center", marginTop: 8 },
  disabled: { opacity: 0.45 },
  chatPanel: { marginBottom: 12 },
  messageRow: { alignItems: "flex-start", marginBottom: 10 },
  messageRowMine: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "82%", minWidth: 80, borderRadius: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 10, flexShrink: 1 },
  messageBubbleMine: { backgroundColor: colors.green, borderColor: colors.green },
  senderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  sender: { color: colors.green, fontSize: 12, fontWeight: "800", marginBottom: 4 },
  senderMine: { color: "#E8D59A" },
<<<<<<< HEAD
  messageText: { color: colors.text, lineHeight: 20, flex: 1, flexShrink: 1, flexWrap: "wrap" },
=======
  blockText: { color: "#7D1F1F", fontSize: 12, fontWeight: "800" },
  messageText: { color: colors.text, lineHeight: 20 },
>>>>>>> fa75a8d9704cf037efe003dbf2fdfd94d7602bcd
  messageTextMine: { color: "#FFFFFF" },
  timestamp: { color: colors.muted, fontSize: 11, marginTop: 6 },
  timestampMine: { color: "#DCE8DE" },
  systemMessage: { alignSelf: "center", maxWidth: "88%", paddingVertical: 10 },
  systemText: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19, flexShrink: 1, flexWrap: "wrap" },
  inputBar: { position: "absolute", left: 0, right: 0, bottom: 66, flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  messageInput: { flex: 1, minHeight: 44, maxHeight: 96, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: "#FFFFFF", paddingHorizontal: 12, color: colors.text },
  sendButton: { minHeight: 44, borderRadius: 8, backgroundColor: colors.green, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  sendText: { color: "#FFFFFF", fontWeight: "800" },
  drawerBackdrop: { flex: 1, flexDirection: "row", backgroundColor: "rgba(0,0,0,0.35)" },
  drawer: { width: "82%", maxWidth: 340, padding: 20, backgroundColor: colors.background },
  drawerItem: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 8, backgroundColor: colors.panel },
  drawerItemActive: { backgroundColor: colors.green, borderColor: colors.green },
  drawerText: { color: colors.green, fontWeight: "800" },
  drawerTextActive: { color: "#FFFFFF" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.35)" },
  modalPanel: { borderRadius: 8, padding: 18, backgroundColor: colors.panel },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: "#FFFFFF", paddingHorizontal: 12, color: colors.text },
  cancelButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 }
});
