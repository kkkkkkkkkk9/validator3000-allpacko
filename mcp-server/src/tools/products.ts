import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabase, getOrgId } from "../lib/supabase.js";
import { textResult, errorResult, slugify } from "../lib/helpers.js";

export function registerProductTools(server: McpServer) {
  server.tool(
    "list_products",
    "List all products in the organization.",
    {},
    async () => {
      try {
        const orgId = getOrgId();
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("organization_id", orgId)
          .is("deleted_at", null)
          .order("sort_order");

        if (error) return errorResult(`list_products failed: ${error.message}`);
        return textResult(data ?? []);
      } catch (err) {
        return errorResult(`list_products failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "create_product",
    "Create a new product in the organization.",
    {
      name: z.string().min(1).describe("Product name"),
      description: z.string().optional().describe("Product description"),
      theme: z.string().optional().default("cloud").describe("Visual theme (default: cloud)"),
    },
    async ({ name, description, theme }) => {
      try {
        const orgId = getOrgId();
        const slug = slugify(name);

        const { data, error } = await supabase
          .from("products")
          .insert({
            organization_id: orgId,
            name,
            slug,
            description: description ?? null,
            theme: theme ?? "cloud",
          })
          .select("*")
          .single();

        if (error) return errorResult(`create_product failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`create_product failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "update_product",
    "Update product settings.",
    {
      product_id: z.string().uuid().describe("Product ID"),
      name: z.string().optional().describe("New product name"),
      description: z.string().optional().describe("New description"),
      theme: z.string().optional().describe("New theme"),
    },
    async ({ product_id, name, description, theme }) => {
      try {
        const orgId = getOrgId();
        const updates: Record<string, unknown> = {};
        if (name !== undefined) {
          updates.name = name;
          updates.slug = slugify(name);
        }
        if (description !== undefined) updates.description = description;
        if (theme !== undefined) updates.theme = theme;

        if (Object.keys(updates).length === 0) {
          return errorResult("update_product: no fields to update");
        }

        const { data, error } = await supabase
          .from("products")
          .update(updates)
          .eq("id", product_id)
          .eq("organization_id", orgId)
          .select("*")
          .single();

        if (error) return errorResult(`update_product failed: ${error.message}`);
        return textResult(data);
      } catch (err) {
        return errorResult(`update_product failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );

  server.tool(
    "delete_product",
    "Soft-delete a product.",
    {
      product_id: z.string().uuid().describe("Product ID to delete"),
    },
    async ({ product_id }) => {
      try {
        const orgId = getOrgId();
        const { error } = await supabase
          .from("products")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", product_id)
          .eq("organization_id", orgId);

        if (error) return errorResult(`delete_product failed: ${error.message}`);
        return textResult({ deleted: true, product_id });
      } catch (err) {
        return errorResult(`delete_product failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
