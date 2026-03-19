import "server-only";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slugify";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type Flow = {
  id: string;
  product_id: string;
  organization_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// getFlows
// ---------------------------------------------------------------------------
export async function getFlows(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("flows")
    .select("id, product_id, organization_id, name, slug, sort_order, created_at, updated_at")
    .eq("organization_id", orgId)
    .eq("product_id", productId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return { data: data as Flow[] | null, error };
}

// ---------------------------------------------------------------------------
// getFlowBySlug
// ---------------------------------------------------------------------------
export async function getFlowBySlug(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("flows")
    .select("id, product_id, organization_id, name, slug, sort_order, created_at, updated_at")
    .eq("organization_id", orgId)
    .eq("product_id", productId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  return { data: data as Flow | null, error };
}

// ---------------------------------------------------------------------------
// createFlow
// ---------------------------------------------------------------------------
export async function createFlow(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  input: { name: string },
) {
  let slug = slugify(input.name);

  // Ensure slug is unique within the product
  const { data: existing } = await supabase
    .from("flows")
    .select("slug")
    .eq("organization_id", orgId)
    .eq("product_id", productId)
    .like("slug", `${slug}%`)
    .is("deleted_at", null);

  if (existing && existing.length > 0) {
    const existingSlugs = new Set(existing.map((r) => r.slug));
    if (existingSlugs.has(slug)) {
      let suffix = 1;
      while (existingSlugs.has(`${slug}-${suffix}`)) {
        suffix++;
      }
      slug = `${slug}-${suffix}`;
    }
  }

  const { data, error } = await supabase
    .from("flows")
    .insert({
      organization_id: orgId,
      product_id: productId,
      name: input.name,
      slug,
    })
    .select("id, product_id, organization_id, name, slug, sort_order, created_at, updated_at")
    .single();

  return { data: data as Flow | null, error };
}

// ---------------------------------------------------------------------------
// updateFlow
// ---------------------------------------------------------------------------
export async function updateFlow(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
  input: { name?: string; sort_order?: number },
) {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("flows")
    .update(updates)
    .eq("id", flowId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id, product_id, organization_id, name, slug, sort_order, created_at, updated_at")
    .single();

  return { data: data as Flow | null, error };
}

// ---------------------------------------------------------------------------
// deleteFlow (soft delete)
// ---------------------------------------------------------------------------
export async function deleteFlow(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
) {
  const { data, error } = await supabase
    .from("flows")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", flowId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id")
    .single();

  return { data, error };
}

// ---------------------------------------------------------------------------
// reorderFlows
// ---------------------------------------------------------------------------
export async function reorderFlows(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  orderedIds: string[],
) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("flows")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("organization_id", orgId)
      .eq("product_id", productId)
      .is("deleted_at", null)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  return { data: !firstError, error: firstError?.error ?? null };
}
