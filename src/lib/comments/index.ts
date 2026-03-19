import "server-only";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type Comment = {
  id: string;
  screen_id: string;
  organization_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

// ---------------------------------------------------------------------------
// getComments
// ---------------------------------------------------------------------------
export async function getComments(
  supabase: SupabaseClient,
  orgId: string,
  screenId: string,
) {
  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, screen_id, organization_id, user_id, body, created_at, updated_at, profiles(display_name, avatar_url)"
    )
    .eq("organization_id", orgId)
    .eq("screen_id", screenId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return { data: data as Comment[] | null, error };
}

// ---------------------------------------------------------------------------
// createComment
// ---------------------------------------------------------------------------
export async function createComment(
  supabase: SupabaseClient,
  orgId: string,
  screenId: string,
  userId: string,
  input: { body: string },
) {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      organization_id: orgId,
      screen_id: screenId,
      user_id: userId,
      body: input.body,
    })
    .select(
      "id, screen_id, organization_id, user_id, body, created_at, updated_at, profiles(display_name, avatar_url)"
    )
    .single();

  return { data: data as Comment | null, error };
}

// ---------------------------------------------------------------------------
// deleteComment (soft delete)
// ---------------------------------------------------------------------------
export async function deleteComment(
  supabase: SupabaseClient,
  orgId: string,
  commentId: string,
) {
  const { data, error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id")
    .single();

  return { data, error };
}
