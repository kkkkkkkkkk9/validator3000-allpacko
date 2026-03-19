import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const oauthErrorDescription = request.nextUrl.searchParams.get("error_description");
  const rawNext = request.nextUrl.searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";

  // Handle OAuth provider or Supabase Auth errors
  if (oauthError) {
    console.error("[auth/callback] OAuth error:", oauthError, oauthErrorDescription);
    const loginUrl = new URL("/login", getBaseUrl(request));
    loginUrl.searchParams.set("error", oauthErrorDescription ?? oauthError);
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  // No code and no error — unexpected state
  if (!code) {
    console.error("[auth/callback] No code or error param received");
    const loginUrl = new URL("/login", getBaseUrl(request));
    loginUrl.searchParams.set("error", "Authentication failed. Please try again.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const redirectUrl = new URL(next, getBaseUrl(request));
  const response = NextResponse.redirect(redirectUrl);

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
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    const loginUrl = new URL("/login", getBaseUrl(request));
    loginUrl.searchParams.set("error", "Authentication failed. Please try again.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  // Sync profile from OAuth provider metadata
  const authUser = sessionData?.user;
  if (authUser) {
    const meta = authUser.user_metadata ?? {};
    const displayName = (meta.full_name ?? meta.name ?? null) as string | null;
    const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null;

    if (displayName || avatarUrl) {
      await supabase.from("profiles").upsert(
        {
          id: authUser.id,
          ...(displayName ? { display_name: displayName } : {}),
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        },
        { onConflict: "id" },
      );
    }
  }

  return response;
}
