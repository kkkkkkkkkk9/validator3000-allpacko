import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClaimsUser } from "@/lib/supabase/auth";
import { resolveActiveOrganization } from "@/lib/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const membership = await resolveActiveOrganization(supabase, user.id);

  if (!membership) {
    redirect("/onboarding/create-workspace");
  }

  // Fetch org name for the nav bar
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .single();

  return (
    <div className="min-h-dvh flex flex-col">
      <nav className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <a href="/app" className="text-sm font-semibold text-primary hover:opacity-80">Validator 3000</a>
          {org?.name ? (
            <>
              <span className="text-muted">/</span>
              <span className="text-sm text-secondary">{org.name}</span>
            </>
          ) : null}
          <span className="text-muted">/</span>
          <a href="/app/products" className="text-sm text-tertiary hover:text-secondary">Products</a>
        </div>
        <div className="text-xs text-tertiary">
          {user.email}
        </div>
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
