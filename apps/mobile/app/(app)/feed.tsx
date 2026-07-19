import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { addComment, getComments, getCurrentGlobalPrompt, getFriendsResponses, getMyResponse, getResponseImageUrl, getWeeklyGems, likeResponse, markGemViewed, pickResponseImage, reportComment, reportResponse, submitOrUpdateResponse, unlikeResponse } from "../../lib/feed";
import { blockUser } from "../../lib/moderation";

const colors = {
  background: "#FAF8F5",
  green: "#1B4332",
  gold: "#C9A84C",
  text: "#24352D",
  muted: "#6F776D",
  border: "#E6DED2"
};

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState<any | null>(null);
  const [myResponse, setMyResponse] = useState<any | null>(null);
  const [body, setBody] = useState("");
  const [responses, setResponses] = useState<any[]>([]);
  const [gems, setGems] = useState<any[]>([]);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const gemsRef = useRef<any[]>([]);
  const markedGemIdsRef = useRef<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByResponse, setCommentsByResponse] = useState<Record<string, any[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [currentPrompt, weeklyGems] = await Promise.all([getCurrentGlobalPrompt(), getWeeklyGems(10)]);
      setPrompt(currentPrompt);
      setGems(weeklyGems);
      const mine = await getMyResponse(user.id, currentPrompt.id);
      setMyResponse(mine);
      setBody(mine?.body || "");
      if (mine) setResponses(await getFriendsResponses(user.id, currentPrompt.id));
      else setResponses([]);
    } catch (error: any) {
      Alert.alert("Unable to load feed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    gemsRef.current = gems;
  }, [gems]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        const idsToMark = gemsRef.current
          .map((gem: any) => gem.response_id)
          .filter((id: string) => id && !markedGemIdsRef.current.has(id));

        if (idsToMark.length === 0) return;
        idsToMark.forEach((id) => markedGemIdsRef.current.add(id));
        Promise.all(idsToMark.map((id: string) => markGemViewed(id))).catch(() => {});
      };
    }, [])
  );

  async function submit() {
    if (!user?.id || !prompt?.id || !body.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const saved = await submitOrUpdateResponse(user.id, prompt.id, body.trim(), localImageUri);
      setMyResponse(saved);
      setLocalImageUri(null);
      setResponses(await getFriendsResponses(user.id, prompt.id));
    } catch (error: any) {
      const message = error.message || "Please try again.";
      setSaveError(message);
      Alert.alert("Unable to save response", message);
    } finally {
      setSaving(false);
    }
  }

  async function addPhoto() {
    try {
      const uri = await pickResponseImage();
      if (uri) setLocalImageUri(uri);
    } catch (error: any) {
      Alert.alert("Unable to choose photo", error.message || "Please try again.");
    }
  }

  async function refreshResponses() {
    if (!user?.id || !prompt?.id) return;
    setResponses(await getFriendsResponses(user.id, prompt.id));
  }

  async function toggleLike(response: any) {
    try {
      if (response.hasLiked) await unlikeResponse(response.id);
      else await likeResponse(response.id);
      await refreshResponses();
    } catch (error: any) {
      Alert.alert("Unable to update like", error.message || "Please try again.");
    }
  }

  async function toggleComments(responseId: string) {
    const nextOpen = !expandedComments[responseId];
    setExpandedComments((current) => ({ ...current, [responseId]: nextOpen }));
    if (nextOpen) {
      setCommentsByResponse((current) => ({ ...current, [responseId]: current[responseId] || [] }));
      try {
        setCommentsByResponse((current) => ({ ...current, [responseId]: [] }));
        const comments = await getComments(responseId);
        setCommentsByResponse((current) => ({ ...current, [responseId]: comments }));
      } catch (error: any) {
        Alert.alert("Unable to load comments", error.message || "Please try again.");
      }
    }
  }

  async function submitComment(responseId: string, parentCommentId: string | null = null) {
    const key = parentCommentId || responseId;
    const draft = (commentDrafts[key] || "").trim();
    if (!draft) return;
    try {
      await (addComment as any)(responseId, draft, parentCommentId);
      setCommentDrafts((current) => ({ ...current, [key]: "" }));
      setReplyingTo(null);
      const comments = await getComments(responseId);
      setCommentsByResponse((current) => ({ ...current, [responseId]: comments }));
      await refreshResponses();
    } catch (error: any) {
      Alert.alert("Unable to add comment", error.message || "Please try again.");
    }
  }

  function removeCommentsByUser(comments: any[], blockedUserId: string): any[] {
    return (comments || [])
      .filter((comment) => comment.user_id !== blockedUserId)
      .map((comment) => ({ ...comment, replies: removeCommentsByUser(comment.replies || [], blockedUserId) }));
  }

  function removeUserFromFeed(blockedUserId: string) {
    setResponses((current) => current.filter((response) => response.user_id !== blockedUserId));
    setCommentsByResponse((current) => {
      const next: Record<string, any[]> = {};
      for (const [responseId, comments] of Object.entries(current)) {
        next[responseId] = removeCommentsByUser(comments, blockedUserId);
      }
      return next;
    });
  }

  function openReport(target: any) {
    setOpenMenuKey(null);
    setReportTarget(target);
    setReportReason("");
  }

  async function submitReport() {
    const reason = reportReason.trim();
    if (!reportTarget || !reason) return;
    setReporting(true);
    try {
      if (reportTarget.type === "response") {
        await reportResponse(reportTarget.id, reportTarget.userId, reason);
      } else {
        await reportComment(reportTarget.id, reportTarget.userId, reason);
      }
      setReportTarget(null);
      setReportReason("");
      Alert.alert("Report sent", "Thank you. We will review it.");
    } catch (error: any) {
      Alert.alert("Unable to send report", error.message || "Please try again.");
    } finally {
      setReporting(false);
    }
  }

  function confirmBlock(person: any) {
    if (!user?.id || !person?.userId) return;
    setOpenMenuKey(null);
    const name = person.name || "this user";
    Alert.alert(
      `Block ${name}?`,
      "You won't see their posts and they won't see yours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block user",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUser(user.id, person.userId);
              removeUserFromFeed(person.userId);
              Alert.alert("User blocked", `${name} has been blocked.`);
            } catch (error: any) {
              Alert.alert("Unable to block user", error.message || "Please try again.");
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.muted}>Opening this week's prompt...</Text>
      </View>
    );
  }

  const lesson = prompt?.lessons;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>Weekly Feed</Text>
      <Text style={styles.title}>{lesson?.theme || "This Week"}</Text>

      <View style={styles.gemsSection}>
        <Text style={styles.sectionTitle}>Weekly Gems</Text>
        {gems.length > 0 ? (
          gems.map((gem: any) => (
            <View key={gem.response_id} style={styles.gemCard}>
              <View style={styles.responseHeader}>
                <View style={styles.avatarGold}>
                  <Text style={styles.avatarGoldText}>{(gem.display_name || gem.username || "M").slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.gemIdentity}>
                  <Text style={styles.name}>{gem.display_name || gem.username || "Member"}</Text>
                  <Text style={styles.username}>@{gem.username || "member"} - {formatDate(gem.created_at)}</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{gem.body}</Text>
              <View style={styles.gemFooter}>
                <Text style={styles.gemLikes}>Likes {gem.like_count || 0}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.gemEmptyCard}>
            <Text style={styles.lockedText}>You're all caught up</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.promptTitle}>{lesson?.title || "Weekly Prompt"}</Text>
        <Text style={styles.bodyText}>{lesson?.body_text || "No prompt is available yet."}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Reflection</Text>
        <TextInput
          style={styles.responseInput}
          value={body}
          onChangeText={setBody}
          placeholder="Write your response..."
          placeholderTextColor="#9B948A"
          multiline
          textAlignVertical="top"
        />
        <View style={styles.photoActions}>
          <Pressable style={styles.photoButton} onPress={addPhoto} disabled={saving}>
            <Text style={styles.photoButtonText}>{localImageUri ? "Change photo" : "Add photo"}</Text>
          </Pressable>
        </View>
        {localImageUri && (
          <View style={styles.localImageWrap}>
            <Image source={{ uri: localImageUri }} style={styles.localImage} />
            <Pressable style={styles.removeImageButton} onPress={() => setLocalImageUri(null)} disabled={saving}>
              <Text style={styles.removeImageText}>x</Text>
            </Pressable>
          </View>
        )}
        <Pressable style={[styles.primaryButton, (!body.trim() || saving) && styles.disabled]} onPress={submit} disabled={!body.trim() || saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{myResponse ? "Update" : "Post"}</Text>}
        </Pressable>
        {saveError ? <Text style={styles.inlineError}>{saveError}</Text> : null}
        {myResponse ? (
          <View style={styles.savedResponseCard}>
            <View style={styles.responseHeader}>
              <View style={styles.savedAvatar}>
                <Text style={styles.savedAvatarText}>{(user?.display_name || user?.email || "Y").slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.responseIdentity}>
                <Text style={styles.savedLabel}>Your reflection is live</Text>
                <Text style={styles.username}>{formatDate(myResponse.created_at)}</Text>
              </View>
            </View>
            {myResponse.image_url && <SignedImage imagePath={myResponse.image_url} />}
            <Text style={styles.bodyText}>{myResponse.body}</Text>
          </View>
        ) : null}
      </View>

      {myResponse ? (
        <View>
          <Text style={styles.sectionTitle}>Friends' Reflections</Text>
          {responses.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.muted}>No visible friend reflections yet.</Text>
            </View>
          ) : (
            responses.map((response) => (
              <View key={response.id} style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(response.display_name || response.username || "M").slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.responseIdentity}>
                    <Text style={styles.name}>{response.display_name || response.username || "Member"}</Text>
                    <Text style={styles.username}>@{response.username || "member"} - {formatDate(response.created_at)}</Text>
                  </View>
                  <View style={styles.menuWrap}>
                    <Pressable style={styles.overflowButton} onPress={() => setOpenMenuKey(openMenuKey === `response-${response.id}` ? null : `response-${response.id}`)}>
                      <Text style={styles.overflowText}>...</Text>
                    </Pressable>
                    {openMenuKey === `response-${response.id}` && (
                      <View style={styles.menu}>
                        <Pressable style={styles.menuItem} onPress={() => openReport({ type: "response", id: response.id, userId: response.user_id })}>
                          <Text style={styles.menuText}>Report</Text>
                        </Pressable>
                        <Pressable style={styles.menuItem} onPress={() => confirmBlock({ userId: response.user_id, name: response.display_name || response.username || "this user" })}>
                          <Text style={styles.menuDangerText}>Block user</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
                {response.image_url && <SignedImage imagePath={response.image_url} />}
                <Text style={styles.bodyText}>{response.body}</Text>
                <View style={styles.engagementRow}>
                  <Pressable style={styles.engagementButton} onPress={() => toggleLike(response)}>
                    <Text style={styles.engagementText}>{response.hasLiked ? "Heart" : "Like"} {response.likeCount || 0}</Text>
                  </Pressable>
                  <Pressable style={styles.engagementButton} onPress={() => toggleComments(response.id)}>
                    <Text style={styles.engagementText}>Comments {response.commentCount || 0}</Text>
                  </Pressable>
                </View>
                {expandedComments[response.id] && (
                  <View style={styles.commentsPanel}>
                    {(commentsByResponse[response.id] || []).map((comment) => (
                      <CommentNode
                        key={comment.id}
                        comment={comment}
                        responseId={response.id}
                        depth={0}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        drafts={commentDrafts}
                        setDrafts={setCommentDrafts}
                        submitComment={submitComment}
                        openMenuKey={openMenuKey}
                        setOpenMenuKey={setOpenMenuKey}
                        openReport={openReport}
                        confirmBlock={confirmBlock}
                      />
                    ))}
                    <TextInput
                      style={styles.commentInput}
                      value={commentDrafts[response.id] || ""}
                      onChangeText={(text) => setCommentDrafts((current) => ({ ...current, [response.id]: text }))}
                      placeholder="Add a comment..."
                      placeholderTextColor="#9B948A"
                      multiline
                    />
                    <Pressable style={styles.commentButton} onPress={() => submitComment(response.id)}>
                      <Text style={styles.commentButtonText}>Post Comment</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.lockedText}>Answer this week's prompt to see your friends' reflections</Text>
        </View>
      )}
      <Modal visible={Boolean(reportTarget)} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModal}>
            <Text style={styles.sectionTitle}>Report</Text>
            <Text style={styles.muted}>Tell us what needs review.</Text>
            <TextInput
              style={styles.reportInput}
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Reason for report..."
              placeholderTextColor="#9B948A"
              multiline
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setReportTarget(null)} disabled={reporting}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primarySmallButton, (!reportReason.trim() || reporting) && styles.disabled]} onPress={submitReport} disabled={!reportReason.trim() || reporting}>
                <Text style={styles.primaryText}>{reporting ? "Sending..." : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SignedImage({ imagePath }: { imagePath: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUri(null);
    getResponseImageUrl(imagePath)
      .then((signedUrl) => {
        if (active) setUri(signedUrl);
      })
      .catch(() => {
        if (active) setUri(null);
      });
    return () => {
      active = false;
    };
  }, [imagePath]);

  if (!uri) {
    return (
      <View style={styles.signedImageLoading}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return <Image source={{ uri }} style={styles.signedImage} />;
}

function CommentNode({ comment, responseId, depth, replyingTo, setReplyingTo, drafts, setDrafts, submitComment, openMenuKey, setOpenMenuKey, openReport, confirmBlock }: any) {
  const key = comment.id;
  const isReplying = replyingTo?.id === comment.id;
  const displayName = comment.display_name || comment.username || "Member";
  return (
    <View style={[styles.commentNode, { marginLeft: Math.min(depth * 16, 48) }]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{displayName}</Text>
        <View style={styles.menuWrap}>
          <Pressable style={styles.commentOverflowButton} onPress={() => setOpenMenuKey(openMenuKey === `comment-${comment.id}` ? null : `comment-${comment.id}`)}>
            <Text style={styles.overflowText}>...</Text>
          </Pressable>
          {openMenuKey === `comment-${comment.id}` && (
            <View style={styles.commentMenu}>
              <Pressable style={styles.menuItem} onPress={() => openReport({ type: "comment", id: comment.id, userId: comment.user_id })}>
                <Text style={styles.menuText}>Report</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => confirmBlock({ userId: comment.user_id, name: displayName })}>
                <Text style={styles.menuDangerText}>Block user</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.commentBody}>{comment.body}</Text>
      <Pressable onPress={() => setReplyingTo(isReplying ? null : comment)}>
        <Text style={styles.replyText}>{isReplying ? "Cancel reply" : "Reply"}</Text>
      </Pressable>
      {isReplying && (
        <View>
          <TextInput
            style={styles.commentInput}
            value={drafts[key] || ""}
            onChangeText={(text) => setDrafts((current: any) => ({ ...current, [key]: text }))}
            placeholder={`Reply to ${comment.display_name || comment.username || "Member"}...`}
            placeholderTextColor="#9B948A"
            multiline
          />
          <Pressable style={styles.commentButton} onPress={() => submitComment(responseId, comment.id)}>
            <Text style={styles.commentButtonText}>Post Reply</Text>
          </Pressable>
        </View>
      )}
      {(comment.replies || []).map((reply: any) => (
        <CommentNode
          key={reply.id}
          comment={reply}
          responseId={responseId}
          depth={depth + 1}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          drafts={drafts}
          setDrafts={setDrafts}
          submitComment={submitComment}
          openMenuKey={openMenuKey}
          setOpenMenuKey={setOpenMenuKey}
          openReport={openReport}
          confirmBlock={confirmBlock}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 96, backgroundColor: colors.background },
  kicker: { color: colors.gold, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  title: { color: colors.green, fontSize: 30, fontWeight: "800", marginTop: 6, marginBottom: 16 },
  card: { borderRadius: 16, padding: 16, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  promptTitle: { color: colors.green, fontSize: 22, fontWeight: "800", marginBottom: 10 },
  sectionTitle: { color: colors.green, fontSize: 20, fontWeight: "800", marginBottom: 10 },
  bodyText: { color: colors.text, fontSize: 15, lineHeight: 23 },
  muted: { color: colors.muted, marginTop: 10 },
  gemsSection: { marginBottom: 16 },
  gemCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.gold, borderLeftWidth: 5, padding: 16, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  gemEmptyCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatarGold: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  avatarGoldText: { color: colors.green, fontWeight: "800" },
  gemIdentity: { flex: 1, flexShrink: 1 },
  gemFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 },
  gemLikes: { color: colors.muted, fontWeight: "800" },
  gemNextButton: { borderRadius: 14, backgroundColor: colors.green, paddingHorizontal: 18, paddingVertical: 10 },
  gemNextText: { color: "#FFFFFF", fontWeight: "800" },
  responseInput: { minHeight: 150, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 12, color: colors.text, lineHeight: 22, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  photoActions: { flexDirection: "row", marginTop: 12 },
  photoButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.gold, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.background },
  photoButtonText: { color: colors.green, fontWeight: "800" },
  localImageWrap: { marginTop: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  localImage: { width: "100%", aspectRatio: 4 / 3 },
  removeImageButton: { position: "absolute", right: 10, top: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  removeImageText: { color: "#FFFFFF", fontWeight: "900", marginTop: -1 },
  primaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginTop: 12 },
  primaryText: { color: "#FFFFFF", fontWeight: "800" },
  inlineError: { color: "#9F2E2E", fontWeight: "700", lineHeight: 20, marginTop: 10 },
  disabled: { opacity: 0.45 },
  lockedText: { color: colors.green, fontWeight: "800", lineHeight: 22, textAlign: "center" },
  savedResponseCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.gold, borderLeftWidth: 5, padding: 14, backgroundColor: "#FFFDF9", marginTop: 14 },
  savedAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  savedAvatarText: { color: colors.green, fontWeight: "900" },
  savedLabel: { color: colors.green, fontWeight: "900" },
  responseCard: { borderRadius: 16, padding: 16, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 12 },
  responseHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  signedImage: { width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 12, backgroundColor: colors.background },
  signedImageLoading: { width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginBottom: 12, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  responseIdentity: { flex: 1, flexShrink: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.green, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "800" },
  name: { color: colors.text, fontWeight: "800" },
  username: { color: colors.muted, marginTop: 2 },
  menuWrap: { position: "relative" },
  overflowButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F4EFE8" },
  commentOverflowButton: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#F4EFE8" },
  overflowText: { color: colors.green, fontWeight: "900", marginTop: -6 },
  menu: { position: "absolute", right: 0, top: 38, zIndex: 20, minWidth: 132, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, elevation: 4, overflow: "hidden" },
  commentMenu: { position: "absolute", right: 0, top: 32, zIndex: 20, minWidth: 132, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, elevation: 4, overflow: "hidden" },
  menuItem: { paddingHorizontal: 12, paddingVertical: 11 },
  menuText: { color: colors.text, fontWeight: "700" },
  menuDangerText: { color: "#9F2E2E", fontWeight: "800" },
  engagementRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  engagementButton: { borderRadius: 12, backgroundColor: "#E8E1D5", paddingHorizontal: 12, paddingVertical: 8 },
  engagementText: { color: colors.green, fontWeight: "800" },
  commentsPanel: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  commentNode: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10, marginTop: 10 },
  commentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  commentAuthor: { color: colors.green, fontWeight: "800" },
  commentBody: { color: colors.text, lineHeight: 21, marginTop: 4 },
  replyText: { color: colors.gold, fontWeight: "800", marginTop: 6 },
  commentInput: { minHeight: 44, borderRadius: 12, backgroundColor: "#FFFFFF", padding: 10, color: colors.text, marginTop: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  commentButton: { minHeight: 40, borderRadius: 12, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", marginTop: 8 },
  commentButtonText: { color: "#FFFFFF", fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(36, 53, 45, 0.34)", alignItems: "center", justifyContent: "center", padding: 20 },
  reportModal: { width: "100%", maxWidth: 460, borderRadius: 16, padding: 18, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.16, shadowRadius: 14, elevation: 6 },
  reportInput: { minHeight: 120, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFFFF", padding: 12, color: colors.text, lineHeight: 22, marginTop: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  secondaryButton: { minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.green, fontWeight: "800" },
  primarySmallButton: { minHeight: 42, borderRadius: 14, backgroundColor: colors.green, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }
});
