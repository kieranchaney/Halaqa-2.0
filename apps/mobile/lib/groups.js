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

