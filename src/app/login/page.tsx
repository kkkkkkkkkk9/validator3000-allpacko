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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

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

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEmailError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Try sign up if sign in fails
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });

      if (signUpError) {
        setEmailError(signUpError.message);
        setLoading(false);
        return;
      }

      // After signup, try signing in again (local Supabase has auto-confirm)
      const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
      if (retryError) {
        setEmailError("Account created. Check your email to confirm, then sign in.");
        setLoading(false);
        return;
      }
    }

    window.location.href = nextPath;
  }

  return (
    <AuthShell title="Log in" subtitle="Sign in to continue." error={errorParam ?? undefined}>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full rounded border border-border bg-bg-tertiary px-4 py-3 text-sm font-mono text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Redirecting\u2026" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted font-mono">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded border border-border bg-bg-secondary px-3 py-2.5 text-sm font-mono text-primary placeholder:text-muted outline-none focus:border-secondary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded border border-border bg-bg-secondary px-3 py-2.5 text-sm font-mono text-primary placeholder:text-muted outline-none focus:border-secondary"
        />
        {emailError && <p className="text-xs text-error">{emailError}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded border border-primary bg-bg-primary px-4 py-2.5 text-sm font-mono text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in\u2026" : "Sign in with Email"}
        </button>
      </form>
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
