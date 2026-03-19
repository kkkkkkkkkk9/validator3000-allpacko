import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseEnv();
  type CookieOptions = Parameters<typeof response.cookies.set>[2];
  type CookieMutation = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  await supabase.auth.getClaims();

  return response;
}
