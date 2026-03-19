import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { getClaimsUser } from "@/lib/supabase/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function createWorkspaceAction(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/onboarding/create-workspace?error=Workspace%20name%20is%20required");
  }

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const baseSlug = slugify(name);
  const slug = `${baseSlug}-${Math.floor(Date.now() / 1000)}`;
  const organizationId = crypto.randomUUID();

  const { error: orgError } = await supabase
    .from("organizations")
    .insert({ id: organizationId, name, slug });

  if (orgError) {
    redirect(`/onboarding/create-workspace?error=${encodeURIComponent(`Failed to create workspace: ${orgError.message}`)}`);
  }

  const { error: memberError } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    redirect(`/onboarding/create-workspace?error=${encodeURIComponent(`Failed to create membership: ${memberError.message}`)}`);
  }

  redirect("/app");
}

export default async function CreateWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Create workspace"
      subtitle="Set up your organization before getting started."
      error={params.error}
    >
      <form action={createWorkspaceAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-secondary">
            Workspace name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="My Workspace"
            className="w-full rounded border border-border bg-bg-primary px-3 py-2 text-sm font-mono text-primary placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded border border-border bg-bg-tertiary px-4 py-2.5 text-sm font-mono text-primary hover:bg-border transition-colors"
        >
          Create workspace
        </button>
      </form>
    </AuthShell>
  );
}
