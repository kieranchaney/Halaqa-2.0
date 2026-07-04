import { supabase } from "./supabaseClient";

async function withMemberCounts(groups) {
  return Promise.all(
    groups.map(async (group) => {
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id);
      return { ...group, memberCount: count || 0 };
    })
  );
}

export async function getUserGroups(userId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("role, groups(id, name, description, is_public, invite_code, created_at)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });
  if (error) throw error;

  const groups = (data || [])
    .filter((row) => row.groups)
    .map((row) => ({ ...row.groups, role: row.role }));
  return withMemberCounts(groups);
}

export async function getGroupMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select("id, group_id, user_id, role, joined_at, users(display_name, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((member) => ({
    ...member,
    display_name: member.users?.display_name || "Member"
  }));
}

export async function createGroup(userId, name, description = "", isPublic = false) {
  const { data: rpcId, error: rpcError } = await supabase.rpc("create_group", {
    group_name: name,
    group_description: description || null,
    group_is_public: isPublic
  });

  if (!rpcError && rpcId) return getGroupById(rpcId);

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      description: description || null,
      is_public: isPublic,
      invite_code: crypto.randomUUID(),
      created_by: userId
    })
    .select("*")
    .single();
  if (groupError) throw groupError;

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "admin" });
  if (memberError) throw memberError;

  return getGroupById(group.id);
}

export async function getGroupById(groupId) {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (error) throw error;
  const [group] = await withMemberCounts([{ ...data, role: "admin" }]);
  return group;
}

export async function joinGroupByCode(inviteCode) {
  const { data: group, error } = await supabase
    .from("groups")
    .select("id")
    .eq("invite_code", inviteCode.trim())
    .maybeSingle();
  if (error || !group) throw new Error("Invite code not found.");

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { error: joinError } = await supabase
    .from("join_requests")
    .insert({ group_id: group.id, user_id: userId, status: "pending" });
  if (joinError) throw joinError;
  return group;
}

export async function leaveGroup(groupId, userId) {
  const members = await getGroupMembers(groupId);
  const currentMember = members.find((member) => member.user_id === userId);
  if (!currentMember) throw new Error("You are not a member of this group.");

  const otherMembers = members.filter((member) => member.user_id !== userId);

  if (currentMember.role === "admin") {
    if (otherMembers.length === 0) {
      const { error: deleteError } = await supabase.from("groups").delete().eq("id", groupId);
      if (deleteError) throw deleteError;
      return { deletedGroup: true };
    }

    const nextAdmin = otherMembers[0];
    const { error: transferError } = await supabase
      .from("group_members")
      .update({ role: "admin" })
      .eq("group_id", groupId)
      .eq("user_id", nextAdmin.user_id);
    if (transferError) throw transferError;
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
  return { deletedGroup: false };
}

export async function removeGroupMember(groupId, userId) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getLatestGroupLesson(groupId) {
  const { data, error } = await supabase
    .from("group_lessons")
    .select(
      "id, group_id, lesson_id, scheduled_for, sent_at, reflection_unlocked_at, lessons(title, theme, body_text, ayat, ayat_transliteration, ayat_translation, ayat_reference, hadith, hadith_reference, reflection_prompts)"
    )
    .eq("group_id", groupId)
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReflectionResponse(groupLessonId, userId) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .select("*")
    .eq("group_lesson_id", groupLessonId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReflectionResponses(groupLessonId) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .select("*, users(display_name, avatar_url)")
    .eq("group_lesson_id", groupLessonId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((response) => ({
    ...response,
    display_name: response.users?.display_name || "Member"
  }));
}

export async function submitReflection(groupLessonId, groupId, userId, body) {
  const { data, error } = await supabase
    .from("reflection_responses")
    .insert({ group_lesson_id: groupLessonId, group_id: groupId, user_id: userId, body })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
