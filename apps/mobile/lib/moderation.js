import { supabase } from "./supabaseClient";

export async function getBlockedUserIds(blockerId) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_user_id")
    .eq("blocker_id", blockerId);
  if (error) throw error;
  return (data || []).map((row) => row.blocked_user_id);
}

export async function reportContent(reporterId, reportedUserId, contentId, reason) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    content_id: contentId || null,
    reason
  });
  if (error) throw error;
}

export async function blockUser(blockerId, blockedUserId) {
  const { error } = await supabase
    .from("blocked_users")
    .upsert(
      { blocker_id: blockerId, blocked_user_id: blockedUserId },
      { onConflict: "blocker_id,blocked_user_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function getBlockedUsers(blockerId) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("id, blocked_user_id, created_at, users!blocked_users_blocked_user_id_fkey(id, username, display_name, avatar_url)")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    blocked_user_id: row.blocked_user_id,
    created_at: row.created_at,
    user: row.users
  }));
}

export async function unblockUser(blockerId, blockedUserId) {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_user_id", blockedUserId);
  if (error) throw error;
}
