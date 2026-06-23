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

  const { data: adminMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .eq("role", "admin");

  for (const { group_id } of adminMemberships || []) {
    const { data: otherMembers } = await supabase
      .from("group_members")
      .select("user_id, joined_at")
      .eq("group_id", group_id)
      .neq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (otherMembers && otherMembers.length > 0) {
      await supabase
        .from("group_members")
        .update({ role: "admin" })
        .eq("group_id", group_id)
        .eq("user_id", otherMembers[0].user_id);
    } else {
      await supabase.from("groups").delete().eq("id", group_id);
    }
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) return Response.json({ error: deleteError.message }, { status: 500 });

  return Response.json({ success: true });
});

