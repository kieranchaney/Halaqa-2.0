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
