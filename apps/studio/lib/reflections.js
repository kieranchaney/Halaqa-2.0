import { supabase } from "./supabase";

function normalizeReflection(row) {
  return {
    ...row,
    display_name: row.users?.display_name || "Member"
  };
}

export async function getReflections(groupLessonId) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .select("*, users(display_name, avatar_url)")
    .eq("group_lesson_id", groupLessonId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeReflection);
}

export async function submitReflection(groupLessonId, groupId, userId, body) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .insert({ group_lesson_id: groupLessonId, group_id: groupId, user_id: userId, body })
    .select("*, users(display_name, avatar_url)")
    .single();
  if (error) {
    if (error.code === "23505") return { duplicate: true };
    throw error;
  }
  return { reflection: normalizeReflection(data) };
}

export async function hasUserReflected(groupLessonId, userId) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .select("id")
    .eq("group_lesson_id", groupLessonId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function subscribeToReflections(groupLessonId, callback) {
  return supabase
    .channel(`reflection_responses:${groupLessonId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reflection_responses",
        filter: `group_lesson_id=eq.${groupLessonId}`
      },
      callback
    )
    .subscribe();
}

