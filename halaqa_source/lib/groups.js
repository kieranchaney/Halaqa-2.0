import { supabase } from "./supabase";

async function withMemberCounts(groups) {
  return Promise.all(
    groups.map(async (group) => {
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id);
      return { ...group, memberCount: count || 0, unreadCount: 0 };
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

export async function createGroup(name, description, isPublic, userId) {
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

export async function requestToJoin(groupId, userId) {
  const { data, error } = await supabase
    .from("join_requests")
    .insert({ group_id: groupId, user_id: userId, status: "pending" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function approveRequest(requestId) {
  const { data: request, error: readError } = await supabase
    .from("join_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (readError) throw readError;

  const { error: updateError } = await supabase
    .from("join_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (updateError) throw updateError;

  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: request.group_id, user_id: request.user_id, role: "member" });
  if (memberError) throw memberError;
}

export async function denyRequest(requestId) {
  const { error } = await supabase
    .from("join_requests")
    .update({ status: "denied" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getJoinRequests(groupId) {
  const { data, error } = await supabase
    .from("join_requests")
    .select("*, users(display_name, avatar_url)")
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("requested_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

