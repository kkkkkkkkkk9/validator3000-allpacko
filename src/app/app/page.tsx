import { requireWorkspaceContext } from "@/lib/workspace";

export default async function AppHomePage() {
  const { membership, supabase } = await requireWorkspaceContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .single();

  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl text-primary mb-2">
          Welcome to Validator 3000
        </h1>
        {org?.name ? (
          <p className="text-sm text-tertiary">
            Workspace: {org.name}
          </p>
        ) : null}
      </div>
    </div>
  );
}
