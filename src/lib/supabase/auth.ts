import "server-only";
import { createClient } from "@/lib/supabase/server";

type ClaimRecord = Record<string, unknown>;

function claimString(claims: ClaimRecord, key: string): string | null {
  const value = claims[key];
  return typeof value === "string" ? value : null;
}

export type ClaimsUser = {
  id: string;
  email: string | null;
  claims: ClaimRecord;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getClaimsUser(supabase?: SupabaseServerClient): Promise<ClaimsUser | null> {
  const client = supabase ?? await createClient();
  const { data, error } = await client.auth.getClaims();

  if (error || !data?.claims) {
    if (error) {
      console.error("[auth] getClaims failed:", error.message, error);
    }
    return null;
  }

  const claims = data.claims as ClaimRecord;
  const id = claimString(claims, "sub");
  if (!id) {
    return null;
  }

  return {
    id,
    email: claimString(claims, "email"),
    claims
  };
}
