import { supabase } from "./supabaseClient";

function normalizeMessage(row) {
  return {
    ...row,
    display_name: row.is_system ? "Halaqa" : row.users?.display_name || "Member"
  };
}

export async function getMessages(groupId, limit = 100, cursor) {
  let query = supabase
    .from("messages")
    .select("*, users(display_name, avatar_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeMessage).reverse();
}

export async function sendMessage(groupId, userId, body) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ group_id: groupId, user_id: userId, body, is_system: false })
    .select("*, users(display_name, avatar_url)")
    .single();
  if (error) throw error;
  return normalizeMessage(data);
}

export function subscribeToMessages(groupId, callback) {
  return supabase
    .channel(`messages:${groupId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
      callback
    )
    .subscribe();
}

export function unsubscribe(subscription) {
  return supabase.removeChannel(subscription);
}

