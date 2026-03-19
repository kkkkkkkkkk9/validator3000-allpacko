import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  type CookieOptions = Parameters<typeof cookieStore.set>[2];
  type CookieMutation = { name: string; value: string; options?: CookieOptions };

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll is called from Supabase client when refreshing tokens.
          // This can be ignored in Server Components where cookies are read-only.
          // The middleware will handle refreshing the session cookie instead.
        }
      }
    }
  });
}
