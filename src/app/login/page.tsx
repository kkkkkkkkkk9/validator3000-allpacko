"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setLoading(false);
      window.location.href = `/login?error=${encodeURIComponent("Sign in failed. Please try again.")}&next=${encodeURIComponent(nextPath)}`;
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Sign in with your Google account to continue." error={errorParam ?? undefined}>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full rounded border border-border bg-bg-tertiary px-4 py-3 text-sm font-mono text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting\u2026" : "Continue with Google"}
      </button>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
