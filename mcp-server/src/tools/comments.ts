import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase, getOrgId } from "../lib/supabase.js";
import { textResult, errorResult } from "../lib/helpers.js";

export function registerCommentTools(server: McpServer) {
  server.tool(
    "list_comments",
    "List comments for a screen. Includes author display names.",
    {
      screen_id: z.string().uuid().describe("Screen ID"),
    },
    async ({ screen_id }) => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("comments")
          .select("id, screen_id, body, user_id, created_at")
          .eq("screen_id", screen_id)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: true });

        if (error) return errorResult(`list_comments failed: ${error.message}`);

        // Resolve author display names
        const userIds = [...new Set((data ?? []).map((c) => c.user_id).filter(Boolean))];
        let profileMap = new Map<string, string>();

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);

          profileMap = new Map(
            (profiles ?? []).map((p) => [p.id, p.display_name ?? "Unknown"]),
          );
        }

        const comments = (data ?? []).map((c) => ({
          id: c.id,
          screen_id: c.screen_id,
          body: c.body,
          user_id: c.user_id,
          author: c.user_id ? profileMap.get(c.user_id) ?? "Unknown" : "System",
          created_at: c.created_at,
        }));

        return textResult({ comments, total: comments.length });
      } catch (err) {
        return errorResult(`list_comments failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "add_comment",
    "Add a comment to a screen.",
    {
      screen_id: z.string().uuid().describe("Screen ID"),
      body: z.string().min(1).describe("Comment text"),
      user_id: z.string().uuid().optional().describe("User ID (defaults to system user)"),
    },
    async ({ screen_id, body, user_id }) => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("comments")
          .insert({
            organization_id: orgId,
            screen_id,
            body,
            user_id: user_id ?? null,
          })
          .select("id, created_at")
          .single();

        if (error) return errorResult(`add_comment failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`add_comment failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "delete_comment",
    "Delete a comment.",
    {
      comment_id: z.string().uuid().describe("Comment ID to delete"),
    },
    async ({ comment_id }) => {
      try {
        const orgId = getOrgId();
        const { error } = await supabase
          .from("comments")
          .delete()
          .eq("id", comment_id)
          .eq("organization_id", orgId);

        if (error) return errorResult(`delete_comment failed: ${error.message}`);
        return textResult({ deleted: true, comment_id });
      } catch (err) {
        return errorResult(`delete_comment failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
