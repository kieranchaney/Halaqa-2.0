import { supabase } from "./supabaseClient";

export async function getCurrentGlobalPrompt() {
  const { data: prompt, error: rpcError } = await supabase.rpc("get_or_create_current_global_prompt");
  if (rpcError) throw rpcError;
  if (!prompt?.lesson_id) throw new Error("No global prompt is available yet.");

  const { data, error } = await supabase
    .from("global_prompts")
    .select("id, lesson_id, week_start, created_at, lessons(title, theme, body_text, reflection_prompts)")
    .eq("id", prompt.id)
    .single();
  if (error) throw error;
  return data;
}

export async function getMyResponse(userId, globalPromptId) {
  const { data, error } = await supabase
    .from("prompt_responses")
    .select("*")
    .eq("user_id", userId)
    .eq("global_prompt_id", globalPromptId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitOrUpdateResponse(userId, globalPromptId, body) {
  const { data, error } = await supabase
    .from("prompt_responses")
    .upsert(
      { user_id: userId, global_prompt_id: globalPromptId, body },
      { onConflict: "user_id,global_prompt_id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function likeResponse(responseId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("response_likes")
    .upsert(
      { response_id: responseId, user_id: userId },
      { onConflict: "response_id,user_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function unlikeResponse(responseId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("response_likes")
    .delete()
    .eq("response_id", responseId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getWeeklyGems(limit = 10) {
  const { data, error } = await supabase.rpc("get_weekly_gems", { result_limit: limit });
  if (error) throw error;
  return data || [];
}

export async function markGemViewed(responseId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("gem_views")
    .upsert(
      { user_id: userId, response_id: responseId },
      { onConflict: "user_id,response_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function reportResponse(responseId, reportedUserId, reason) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_user_id: reportedUserId,
    response_id: responseId,
    reason
  });
  if (error) throw error;
}

export async function reportComment(commentId, reportedUserId, reason) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    reported_user_id: reportedUserId,
    comment_id: commentId,
    reason
  });
  if (error) throw error;
}

export async function getLikesForResponses(responseIds) {
  const ids = Array.from(new Set(responseIds || [])).filter(Boolean);
  if (ids.length === 0) return {};

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;

  const { data, error } = await supabase
    .from("response_likes")
    .select("response_id, user_id")
    .in("response_id", ids);
  if (error) throw error;

  const meta = Object.fromEntries(ids.map((id) => [id, { likeCount: 0, hasLiked: false }]));
  for (const like of data || []) {
    if (!meta[like.response_id]) meta[like.response_id] = { likeCount: 0, hasLiked: false };
    meta[like.response_id].likeCount += 1;
    if (like.user_id === userId) meta[like.response_id].hasLiked = true;
  }
  return meta;
}

export async function addComment(responseId, body, parentCommentId = null) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("response_comments")
    .insert({ response_id: responseId, user_id: userId, parent_comment_id: parentCommentId, body })
    .select("*, users(username, display_name, avatar_url)")
    .single();
  if (error) throw error;
  return data;
}

function buildCommentTree(rows) {
  const map = new Map();
  const roots = [];
  for (const row of rows || []) {
    map.set(row.id, {
      ...row,
      username: row.users?.username,
      display_name: row.users?.display_name,
      avatar_url: row.users?.avatar_url,
      replies: []
    });
  }
  for (const comment of map.values()) {
    if (comment.parent_comment_id && map.has(comment.parent_comment_id)) {
      map.get(comment.parent_comment_id).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }
  return roots;
}

export async function getComments(responseId) {
  const { data, error } = await supabase
    .from("response_comments")
    .select("*, users(username, display_name, avatar_url)")
    .eq("response_id", responseId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return buildCommentTree(data || []);
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("response_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function getFriendsResponses(userId, globalPromptId) {
  const { data, error } = await supabase
    .from("prompt_responses")
    .select("*, users(username, display_name, avatar_url)")
    .eq("global_prompt_id", globalPromptId)
    .neq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const responseIds = rows.map((response) => response.id);
  const [likes, commentRows] = await Promise.all([
    getLikesForResponses(responseIds),
    responseIds.length
      ? supabase.from("response_comments").select("response_id").in("response_id", responseIds)
      : Promise.resolve({ data: [], error: null })
  ]);
  if (commentRows.error) throw commentRows.error;
  const commentCounts = {};
  for (const comment of commentRows.data || []) {
    commentCounts[comment.response_id] = (commentCounts[comment.response_id] || 0) + 1;
  }
  return rows.map((response) => ({
    ...response,
    username: response.users?.username,
    display_name: response.users?.display_name,
    avatar_url: response.users?.avatar_url,
    likeCount: likes[response.id]?.likeCount || 0,
    hasLiked: Boolean(likes[response.id]?.hasLiked),
    commentCount: commentCounts[response.id] || 0
  }));
}
