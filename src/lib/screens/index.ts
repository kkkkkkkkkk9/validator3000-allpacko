import "server-only";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/utils/slugify";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type Screen = {
  id: string;
  flow_id: string;
  organization_id: string;
  name: string;
  slug: string;
  html_content: string;
  screen_type: string;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const SCREEN_COLUMNS =
  "id, flow_id, organization_id, name, slug, html_content, screen_type, metadata, sort_order, created_at, updated_at";

// ---------------------------------------------------------------------------
// getScreens
// ---------------------------------------------------------------------------
export async function getScreens(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
) {
  const { data, error } = await supabase
    .from("screens")
    .select(SCREEN_COLUMNS)
    .eq("organization_id", orgId)
    .eq("flow_id", flowId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return { data: data as Screen[] | null, error };
}

// ---------------------------------------------------------------------------
// getScreenBySlug
// ---------------------------------------------------------------------------
export async function getScreenBySlug(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from("screens")
    .select(SCREEN_COLUMNS)
    .eq("organization_id", orgId)
    .eq("flow_id", flowId)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  return { data: data as Screen | null, error };
}

// ---------------------------------------------------------------------------
// createScreen
// ---------------------------------------------------------------------------
export async function createScreen(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
  input: {
    name: string;
    html_content?: string;
    screen_type?: string;
    metadata?: Record<string, unknown>;
  },
) {
  let slug = slugify(input.name);

  // Ensure slug is unique within the flow
  const { data: existing } = await supabase
    .from("screens")
    .select("slug")
    .eq("organization_id", orgId)
    .eq("flow_id", flowId)
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
    .from("screens")
    .insert({
      organization_id: orgId,
      flow_id: flowId,
      name: input.name,
      slug,
      html_content: input.html_content ?? "",
      screen_type: input.screen_type ?? "standard",
      metadata: input.metadata ?? {},
    })
    .select(SCREEN_COLUMNS)
    .single();

  return { data: data as Screen | null, error };
}

// ---------------------------------------------------------------------------
// updateScreen
// ---------------------------------------------------------------------------
export async function updateScreen(
  supabase: SupabaseClient,
  orgId: string,
  screenId: string,
  input: {
    name?: string;
    html_content?: string;
    screen_type?: string;
    metadata?: Record<string, unknown>;
    sort_order?: number;
  },
) {
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.html_content !== undefined) updates.html_content = input.html_content;
  if (input.screen_type !== undefined) updates.screen_type = input.screen_type;
  if (input.metadata !== undefined) updates.metadata = input.metadata;
  if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

  const { data, error } = await supabase
    .from("screens")
    .update(updates)
    .eq("id", screenId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select(SCREEN_COLUMNS)
    .single();

  return { data: data as Screen | null, error };
}

// ---------------------------------------------------------------------------
// deleteScreen (soft delete)
// ---------------------------------------------------------------------------
export async function deleteScreen(
  supabase: SupabaseClient,
  orgId: string,
  screenId: string,
) {
  const { data, error } = await supabase
    .from("screens")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", screenId)
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .select("id")
    .single();

  return { data, error };
}

// ---------------------------------------------------------------------------
// reorderScreens
// ---------------------------------------------------------------------------
export async function reorderScreens(
  supabase: SupabaseClient,
  orgId: string,
  flowId: string,
  orderedIds: string[],
) {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("screens")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("organization_id", orgId)
      .eq("flow_id", flowId)
      .is("deleted_at", null)
  );

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);

  return { data: !firstError, error: firstError?.error ?? null };
}
