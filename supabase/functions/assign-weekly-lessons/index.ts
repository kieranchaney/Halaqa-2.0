import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

function mondayKey(date: Date) {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const now = new Date();
  const scheduledFor = mondayKey(now);
  const reflectionUnlockedAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data: groups, error: groupError } = await supabase.from("groups").select("id");
  if (groupError) return Response.json({ error: groupError.message }, { status: 500 });

  const { data: manualSlot } = await supabase
    .from("scheduled_lessons")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select("id")
    .eq("status", "published")
    .eq("is_custom", false);
  if (lessonError) return Response.json({ error: lessonError.message }, { status: 500 });

  let assigned = 0;
  for (const group of groups || []) {
    const { data: existing } = await supabase
      .from("group_lessons")
      .select("id")
      .eq("group_id", group.id)
      .eq("scheduled_for", scheduledFor)
      .maybeSingle();
    if (existing) continue;

    let lessonId = manualSlot?.lesson_id;
    if (!lessonId) {
      const { data: delivered } = await supabase
        .from("group_lessons")
        .select("lesson_id")
        .eq("group_id", group.id);
      const deliveredIds = new Set((delivered || []).map((item) => item.lesson_id));
      let candidates = (lessons || []).filter((lesson) => !deliveredIds.has(lesson.id));
      if (candidates.length === 0) candidates = lessons || [];
      lessonId = candidates[Math.floor(Math.random() * candidates.length)]?.id;
    }
    if (!lessonId) continue;

    const { data: groupLesson, error: insertError } = await supabase
      .from("group_lessons")
      .insert({
        group_id: group.id,
        lesson_id: lessonId,
        scheduled_for: scheduledFor,
        sent_at: now.toISOString(),
        reflection_unlocked_at: reflectionUnlockedAt
      })
      .select("id")
      .single();
    if (insertError) continue;

    const { count } = await supabase
      .from("group_lessons")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id);

    if (count === 1) {
      await supabase.from("messages").insert({
        group_id: group.id,
        user_id: null,
        body: "Assalamu Alaikum and welcome to your halaqa. Your first lesson is ready above. Start by sharing your reflection on this week's prompt - there are no wrong answers, only honest ones.",
        is_system: true,
        group_lesson_id: groupLesson.id
      });
    }
    assigned += 1;
  }

  if (manualSlot?.id) {
    await supabase.from("scheduled_lessons").update({ status: "sent" }).eq("id", manualSlot.id);
  }

  return Response.json({ assigned });
});

