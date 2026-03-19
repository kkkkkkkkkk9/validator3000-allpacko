"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

const COMMENT_SELECT =
  "id, screen_id, organization_id, user_id, body, created_at, updated_at, profiles(display_name, avatar_url)";

export function useComments(screenId: string, orgId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch comments when screenId or orgId changes
  const fetchComments = useCallback(async () => {
    if (!screenId || !orgId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("organization_id", orgId)
      .eq("screen_id", screenId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[useComments] fetch error:", error.message);
    }

    setComments((data as unknown as Comment[] | null) ?? []);
    setLoading(false);
  }, [screenId, orgId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = useCallback(
    async (body: string) => {
      if (!body.trim() || !screenId || !orgId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("[useComments] no authenticated user");
        return;
      }

      const { data, error } = await supabase
        .from("comments")
        .insert({
          organization_id: orgId,
          screen_id: screenId,
          user_id: user.id,
          body: body.trim(),
        })
        .select(COMMENT_SELECT)
        .single();

      if (error) {
        console.error("[useComments] submit error:", error.message);
        return;
      }

      if (data) {
        setComments((prev) => [...prev, data as unknown as Comment]);
      }
    },
    [screenId, orgId, supabase],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", commentId)
        .eq("organization_id", orgId)
        .is("deleted_at", null);

      if (error) {
        console.error("[useComments] delete error:", error.message);
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    },
    [orgId, supabase],
  );

  return { comments, loading, submitComment, deleteComment };
}
