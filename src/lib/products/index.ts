import "server-only";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slugify";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type Product = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  theme: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// getProducts
// ---------------------------------------------------------------------------
export async function getProducts(
  supabase: SupabaseClient,
  orgId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, organization_id, name, slug, description, theme, sort_order, created_at, updated_at")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return { data: data as Product[] | null, error };
}

// ---------------------------------------------------------------------------
// getProductBySlug
// ---------------------------------------------------------------------------
export async function getProductBySlug(
  supabase: SupabaseClient,
  orgId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, organization_id, name, slug, description, theme, sort_order, created_at, updated_at")
    .eq("organization_id", orgId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  return { data: data as Product | null, error };
}

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------
export async function createProduct(
  supabase: SupabaseClient,
  orgId: string,
  input: { name: string; description?: string; theme?: string },
) {
  let slug = slugify(input.name);

  // Ensure slug is unique within the org by appending a suffix if needed
  const { data: existing } = await supabase
    .from("products")
    .select("slug")
    .eq("organization_id", orgId)
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
    .from("products")
    .insert({
      organization_id: orgId,
      name: input.name,
      slug,
      description: input.description ?? null,
      theme: input.theme ?? "cloud",
    })
    .select("id, organization_id, name, slug, description, theme, sort_order, created_at, updated_at")
    .single();

  return { data: data as Product | null, error };
}

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------
export async function updateProduct(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  input: { name?: string; description?: string; theme?: string; sort_order?: number },
) {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.theme !== undefined) updates.theme = input.theme;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id, organization_id, name, slug, description, theme, sort_order, created_at, updated_at")
    .single();

  return { data: data as Product | null, error };
}

// ---------------------------------------------------------------------------
// deleteProduct (soft delete)
// ---------------------------------------------------------------------------
export async function deleteProduct(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id")
    .single();

  return { data, error };
}
