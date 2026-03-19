import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClaimsUser } from "@/lib/supabase/auth";

export type Membership = {
  organization_id: string;
  role: "owner" | "admin" | "member" | "viewer";
};

export type WorkspaceOrg = {
  id: string;
  name: string;
  slug: string;
};

const WORKSPACE_COOKIE = "v3k_workspace";

/**
 * Cookie contract for workspace persistence.
 * Name: v3k_workspace
 * Value: raw organization UUID
 * Attributes: Path=/, SameSite=Lax, Secure (production), HttpOnly, Max-Age=1y
 */
export async function setWorkspaceCookie(organizationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, organizationId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getWorkspaceCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value;
}

/**
 * Resolve the active organization for a user.
 * 1. Read v3k_workspace cookie
 * 2. If cookie set, verify user has membership in that org
 * 3. If valid, return that membership
 * 4. If invalid/missing, query oldest membership (default)
 * 5. Set/update cookie to the resolved org
 */
export async function resolveActiveOrganization(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Membership | null> {
  const cookieOrgId = await getWorkspaceCookie();

  // If cookie is set, try to verify membership
  if (cookieOrgId) {
    const { data: cookieMembership } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId)
      .eq("organization_id", cookieOrgId)
      .maybeSingle<Membership>();

    if (cookieMembership) {
      return cookieMembership;
    }
    // Cookie is stale — fall through to default resolution
  }

  // Default: oldest membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<Membership>();

  if (membership) {
    // Set cookie to the resolved org so subsequent requests use it.
    // This will throw in Server Components (read-only cookies) — safe to ignore
    // since the cookie will be set on the next navigation/action instead.
    try {
      await setWorkspaceCookie(membership.organization_id);
    } catch {
      // Server Component context — cookies are read-only
    }
  }

  return membership;
}

/**
 * Get all organizations a user belongs to (for the workspace switcher).
 */
export async function getAllMemberships(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<WorkspaceOrg[]> {
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (!memberships?.length) return [];

  const orgIds = memberships.map((m) => m.organization_id);
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .in("id", orgIds);

  if (!orgs) return [];

  // Preserve membership creation order
  return orgIds
    .map((id) => orgs.find((o) => o.id === id))
    .filter((o): o is WorkspaceOrg => o != null);
}

/**
 * Memoized within a single RSC render pass via React.cache().
 * Multiple layouts/pages calling this in the same request share one DB call.
 */
export const requireWorkspaceContext = cache(async () => {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const membership = await resolveActiveOrganization(supabase, user.id);

  if (!membership) {
    redirect("/onboarding/create-workspace");
  }

  return { supabase, user, membership };
});

/**
 * Resolve org membership for API routes.
 * API routes cannot use React.cache() — this is a standalone function.
 * Reads the v3k_workspace cookie from request headers.
 */
export async function requireApiWorkspaceContext() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) {
    return null;
  }

  const membership = await resolveActiveOrganization(supabase, user.id);
  if (!membership) return null;

  return { supabase, user, membership };
}
