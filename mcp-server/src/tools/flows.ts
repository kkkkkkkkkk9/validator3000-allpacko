import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase, getOrgId } from "../lib/supabase.js";
import { textResult, errorResult, slugify } from "../lib/helpers.js";

export function registerFlowTools(server: McpServer) {
  server.tool(
    "list_flows",
    "List flows for a product.",
    {
      product_id: z.string().uuid().describe("Product ID"),
    },
    async ({ product_id }) => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("flows")
          .select("*")
          .eq("product_id", product_id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("sort_order");

        if (error) return errorResult(`list_flows failed: ${error.message}`);
        return textResult(data ?? []);
      } catch (err) {
        return errorResult(`list_flows failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "create_flow",
    "Create a new flow in a product.",
    {
      product_id: z.string().uuid().describe("Product ID"),
      name: z.string().min(1).describe("Flow name"),
    },
    async ({ product_id, name }) => {
      try {
        const orgId = getOrgId();
        const slug = slugify(name);

        // Determine next sort_order
        const { data: existing } = await supabase
          .from("flows")
          .select("sort_order")
          .eq("product_id", product_id)
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("sort_order", { ascending: false })
          .limit(1);

        const nextOrder = existing && existing.length > 0
          ? (existing[0].sort_order ?? 0) + 1
          : 0;

        const { data, error } = await supabase
          .from("flows")
          .insert({
            organization_id: orgId,
            product_id,
            name,
            slug,
            sort_order: nextOrder,
          })
          .select("*")
          .single();

        if (error) return errorResult(`create_flow failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`create_flow failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "update_flow",
    "Update a flow.",
    {
      flow_id: z.string().uuid().describe("Flow ID"),
      name: z.string().optional().describe("New flow name"),
    },
    async ({ flow_id, name }) => {
      try {
        const orgId = getOrgId();
        const updates: Record<string, unknown> = {};
        if (name !== undefined) {
          updates.name = name;
          updates.slug = slugify(name);
        }

        if (Object.keys(updates).length === 0) {
          return errorResult("update_flow: no fields to update");
        }

        const { data, error } = await supabase
          .from("flows")
          .update(updates)
          .eq("id", flow_id)
          .eq("organization_id", orgId)
          .select("*")
          .single();

        if (error) return errorResult(`update_flow failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`update_flow failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "delete_flow",
    "Soft-delete a flow.",
    {
      flow_id: z.string().uuid().describe("Flow ID to delete"),
    },
    async ({ flow_id }) => {
      try {
        const orgId = getOrgId();
        const { error } = await supabase
          .from("flows")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", flow_id)
          .eq("organization_id", orgId);

        if (error) return errorResult(`delete_flow failed: ${error.message}`);
        return textResult({ deleted: true, flow_id });
      } catch (err) {
        return errorResult(`delete_flow failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "reorder_flows",
    "Set the sort order of flows. Pass flow IDs in the desired order.",
    {
      flow_ids: z.array(z.string().uuid()).describe("Flow IDs in desired order"),
    },
    async ({ flow_ids }) => {
      try {
        const orgId = getOrgId();
        const updates = flow_ids.map((id, index) =>
          supabase
            .from("flows")
            .update({ sort_order: index })
            .eq("id", id)
            .eq("organization_id", orgId),
        );

        const results = await Promise.all(updates);
        const failed = results.filter((r) => r.error);
        if (failed.length > 0) {
          return errorResult(`reorder_flows: ${failed.length} update(s) failed`);
        }

        return textResult({ reordered: true, count: flow_ids.length });
      } catch (err) {
        return errorResult(`reorder_flows failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
