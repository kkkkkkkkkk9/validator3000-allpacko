export function getSupabaseEnv() {
  // IMPORTANT: env vars must be referenced as literal strings (not dynamic)
  // so Next.js can inline NEXT_PUBLIC_* values into the client bundle.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabasePublishableKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return { supabaseUrl, supabasePublishableKey };
}
