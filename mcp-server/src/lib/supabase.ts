import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export function getOrgId(): string {
  const orgId = process.env.V3K_ORG_ID;
  if (!orgId) throw new Error("V3K_ORG_ID is required — set it to your organization ID");
  return orgId;
}
