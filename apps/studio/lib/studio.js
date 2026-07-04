import { supabase } from "./supabase";

export async function isStudioOwner(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("role, is_studio_user")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.is_studio_user || data?.role === "owner");
}

export async function getLessons() {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveLesson(lesson) {
  const payload = {
    title: lesson.title,
    theme: lesson.theme,
    body_text: lesson.body_text,
    ayat: lesson.ayat,
    ayat_transliteration: lesson.ayat_transliteration,
    ayat_translation: lesson.ayat_translation,
    ayat_reference: lesson.ayat_reference,
    hadith: lesson.hadith,
    hadith_reference: lesson.hadith_reference,
    reflection_prompts: lesson.reflection_prompts,
    status: lesson.status || "published",
    is_custom: false
  };

  const query = lesson.id
    ? supabase.from("lessons").update(payload).eq("id", lesson.id).select("*").single()
    : supabase.from("lessons").insert(payload).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteLesson(id) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function getScheduledLessons() {
  const { data, error } = await supabase
    .from("scheduled_lessons")
    .select("*, lessons(title)")
    .order("scheduled_for", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveSchedule(slot) {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    lesson_id: slot.lesson_id,
    scheduled_for: slot.scheduled_for,
    timezone: slot.timezone,
    status: slot.status || "scheduled",
    created_by: user?.id
  };
  const query = slot.id
    ? supabase.from("scheduled_lessons").update(payload).eq("id", slot.id).select("*").single()
    : supabase.from("scheduled_lessons").insert(payload).select("*").single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteSchedule(id) {
  const { error } = await supabase.from("scheduled_lessons").delete().eq("id", id);
  if (error) throw error;
}

