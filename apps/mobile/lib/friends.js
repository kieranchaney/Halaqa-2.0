import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not signed in.");
  return userId;
}

async function getBlockedIds(userId) {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_user_id")
    .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
  if (error) throw error;
  return new Set(
    (data || []).map((row) => (row.blocker_id === userId ? row.blocked_user_id : row.blocker_id))
  );
}

async function attachUsers(requests, viewerId) {
  const ids = Array.from(
    new Set(
      (requests || []).flatMap((request) => [request.requester_id, request.recipient_id])
    )
  );
  if (ids.length === 0) return [];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, bio, is_private")
    .in("id", ids);
  if (error) throw error;
  const userMap = new Map((users || []).map((user) => [user.id, user]));

  return (requests || []).map((request) => {
    const otherId = request.requester_id === viewerId ? request.recipient_id : request.requester_id;
    return {
      ...request,
      requester: userMap.get(request.requester_id) || null,
      recipient: userMap.get(request.recipient_id) || null,
      friend: userMap.get(otherId) || null
    };
  });
}

export async function searchUsers(query) {
  const userId = await getCurrentUserId();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const blockedIds = await getBlockedIds(userId);
  const { data, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, bio, is_private")
    .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
    .limit(20);
  if (error) throw error;
  return (data || []).filter((profile) => profile.id !== userId && !blockedIds.has(profile.id));
}

export async function sendFriendRequest(recipientId) {
  const requesterId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ requester_id: requesterId, recipient_id: recipientId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function respondToFriendRequest(requestId, accept) {
  const { data, error } = await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function cancelFriendRequest(requestId) {
  const { error } = await supabase.from("friend_requests").delete().eq("id", requestId);
  if (error) throw error;
}

export async function unfriend(friendRequestId) {
  const { error } = await supabase.from("friend_requests").delete().eq("id", friendRequestId);
  if (error) throw error;
}

export async function getFriends(userId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("responded_at", { ascending: false });
  if (error) throw error;
  return attachUsers(data || [], userId);
}

export async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("status", "pending")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const hydrated = await attachUsers(data || [], userId);
  return {
    incoming: hydrated.filter((request) => request.recipient_id === userId),
    outgoing: hydrated.filter((request) => request.requester_id === userId)
  };
}

export async function getRelationship(userId, otherUserId) {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*")
    .or(
      `and(requester_id.eq.${userId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, { username, bio, is_private, avatar_url }) {
  const payload = {
    username,
    bio: bio || null,
    is_private: Boolean(is_private),
    avatar_url: avatar_url || null
  };
  const { data, error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
