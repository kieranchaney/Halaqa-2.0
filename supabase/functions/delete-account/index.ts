import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return new Response("Unauthorized", { status: 401 });

  const userId = user.id;

  const { data: ownedGroups } = await supabase.from("groups").select("id").eq("created_by", userId);
  const { data: adminMemberships } = await supabase.from("group_members").select("group_id").eq("user_id", userId).eq("role", "admin");
  const groupIdsToTransfer = Array.from(
    new Set([...(ownedGroups || []).map(({ id }) => id), ...(adminMemberships || []).map(({ group_id }) => group_id)])
  );

  for (const group_id of groupIdsToTransfer) {
    const { data: otherMembers } = await supabase
      .from("group_members")
      .select("user_id, joined_at")
      .eq("group_id", group_id)
      .neq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (otherMembers && otherMembers.length > 0) {
      await supabase
        .from("groups")
        .update({ created_by: otherMembers[0].user_id })
        .eq("id", group_id)
        .eq("created_by", userId);

      await supabase
        .from("group_members")
        .update({ role: "admin" })
        .eq("group_id", group_id)
        .eq("user_id", otherMembers[0].user_id);
    } else {
      await supabase.from("groups").delete().eq("id", group_id);
    }
  }

  await supabase.from("reports").delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`);
  await supabase.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
  await supabase.from("messages").delete().eq("user_id", userId);
  await supabase.from("reflection_responses").delete().eq("user_id", userId);
  await supabase.from("join_requests").delete().eq("user_id", userId);
  await supabase.from("group_members").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

  return Response.json({ success: true });
});
