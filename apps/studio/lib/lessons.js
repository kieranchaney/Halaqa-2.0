import { supabase } from "./supabase";

export async function getCurrentLesson(groupId) {
  const { data, error } = await supabase
    .from("group_lessons")
    .select("id, group_id, lesson_id, scheduled_for, sent_at, reflection_unlocked_at, lessons(*)")
    .eq("group_id", groupId)
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    groupLessonId: data.id,
    reflection_unlocked_at: data.reflection_unlocked_at,
    sent_at: data.sent_at,
    ...(data.lessons || {}),
    reflection_prompts: Array.isArray(data.lessons?.reflection_prompts)
      ? data.lessons.reflection_prompts
      : []
  };
}

export function isReflectionMode(reflectionUnlockedAt) {
  return reflectionUnlockedAt ? new Date(reflectionUnlockedAt).getTime() > Date.now() : false;
}

