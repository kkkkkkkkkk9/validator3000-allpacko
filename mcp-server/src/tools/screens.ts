import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase, getOrgId } from "../lib/supabase.js";
import { textResult, errorResult } from "../lib/helpers.js";

export function registerScreenTools(server: McpServer) {
  server.tool(
    "list_screens",
    "List screens in a flow.",
    {
      flow_id: z.string().uuid().describe("Flow ID"),
    },
    async ({ flow_id }) => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("screens")
          .select("id, flow_id, name, sort_order, metadata, created_at, updated_at")
          .eq("flow_id", flow_id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("sort_order");

        if (error) return errorResult(`list_screens failed: ${error.message}`);
        return textResult(data ?? []);
      } catch (err) {
        return errorResult(`list_screens failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "get_screen",
    "Get full screen details including HTML content.",
    {
      screen_id: z.string().uuid().describe("Screen ID"),
    },
    async ({ screen_id }) => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("screens")
          .select("*")
          .eq("id", screen_id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .single();

        if (error) return errorResult(`get_screen failed: ${error.message}`);
        if (!data) return errorResult("get_screen: screen not found");
        return textResult(data);
      } catch (err) {
        return errorResult(`get_screen failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "create_screen",
    "Create a new screen in a flow.",
    {
      flow_id: z.string().uuid().describe("Flow ID"),
      name: z.string().min(1).describe("Screen name"),
      html_content: z.string().optional().describe("HTML content for the screen"),
      metadata: z.record(z.string(), z.unknown()).optional().describe("Optional metadata object"),
    },
    async ({ flow_id, name, html_content, metadata }) => {
      try {
        const orgId = getOrgId();

        // Determine next sort_order
        const { data: existing } = await supabase
          .from("screens")
          .select("sort_order")
          .eq("flow_id", flow_id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("sort_order", { ascending: false })
          .limit(1);

        const nextOrder = existing && existing.length > 0
          ? (existing[0].sort_order ?? 0) + 1
          : 0;

        const { data, error } = await supabase
          .from("screens")
          .insert({
            organization_id: orgId,
            flow_id,
            name,
            html_content: html_content ?? null,
            metadata: metadata ?? null,
            sort_order: nextOrder,
          })
          .select("*")
          .single();

        if (error) return errorResult(`create_screen failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`create_screen failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "update_screen",
    "Update a screen. This is the key tool for editing wireframe content.",
    {
      screen_id: z.string().uuid().describe("Screen ID"),
      name: z.string().optional().describe("New screen name"),
      html_content: z.string().optional().describe("New HTML content"),
      metadata: z.record(z.string(), z.unknown()).optional().describe("Updated metadata object"),
    },
    async ({ screen_id, name, html_content, metadata }) => {
      try {
        const orgId = getOrgId();
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (html_content !== undefined) updates.html_content = html_content;
        if (metadata !== undefined) updates.metadata = metadata;

        if (Object.keys(updates).length === 0) {
          return errorResult("update_screen: no fields to update");
        }

        const { data, error } = await supabase
          .from("screens")
          .update(updates)
          .eq("id", screen_id)
          .eq("organization_id", orgId)
          .select("*")
          .single();

        if (error) return errorResult(`update_screen failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`update_screen failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "delete_screen",
    "Soft-delete a screen.",
    {
      screen_id: z.string().uuid().describe("Screen ID to delete"),
    },
    async ({ screen_id }) => {
      try {
        const orgId = getOrgId();
        const { error } = await supabase
          .from("screens")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", screen_id)
          .eq("organization_id", orgId);

        if (error) return errorResult(`delete_screen failed: ${error.message}`);
        return textResult({ deleted: true, screen_id });
      } catch (err) {
        return errorResult(`delete_screen failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "reorder_screens",
    "Set the sort order of screens. Pass screen IDs in the desired order.",
    {
      screen_ids: z.array(z.string().uuid()).describe("Screen IDs in desired order"),
    },
    async ({ screen_ids }) => {
      try {
        const orgId = getOrgId();
        const updates = screen_ids.map((id, index) =>
          supabase
            .from("screens")
            .update({ sort_order: index })
            .eq("id", id)
            .eq("organization_id", orgId),
        );

        const results = await Promise.all(updates);
        const failed = results.filter((r) => r.error);
        if (failed.length > 0) {
          return errorResult(`reorder_screens: ${failed.length} update(s) failed`);
        }

        return textResult({ reordered: true, count: screen_ids.length });
      } catch (err) {
        return errorResult(`reorder_screens failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
