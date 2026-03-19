import { notFound } from "next/navigation";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getProductBySlug } from "@/lib/products";
import { getFlows, getFlowBySlug } from "@/lib/flows";
import { getScreens } from "@/lib/screens";
import PrototypeViewer from "@/components/prototype/prototype-viewer";

interface PageProps {
  params: Promise<{ productSlug: string; flowSlug: string }>;
}

export default async function FlowPage({ params }: PageProps) {
  const { productSlug, flowSlug } = await params;
  const { supabase, membership } = await requireWorkspaceContext();
  const orgId = membership.organization_id;

  // Load product
  const { data: product } = await getProductBySlug(supabase, orgId, productSlug);
  if (!product) notFound();

  // Load flow
  const { data: flow } = await getFlowBySlug(supabase, orgId, product.id, flowSlug);
  if (!flow) notFound();

  // Load all flows for this product (for the flow panel)
  const { data: flows } = await getFlows(supabase, orgId, product.id);

  // Load screens for this flow
  const { data: screens } = await getScreens(supabase, orgId, flow.id);

  // Compute comment counts per screen
  const screenIds = (screens ?? []).map((s) => s.id);
  const commentCounts: Record<string, number> = {};

  if (screenIds.length > 0) {
    const { data: counts } = await supabase
      .from("comments")
      .select("screen_id")
      .in("screen_id", screenIds)
      .is("deleted_at", null);

    if (counts) {
      for (const row of counts) {
        commentCounts[row.screen_id] = (commentCounts[row.screen_id] ?? 0) + 1;
      }
    }
  }

  const activeScreenId = (screens && screens.length > 0) ? screens[0].id : "";

  return (
    <PrototypeViewer
      flows={flows ?? []}
      screens={screens ?? []}
      activeFlowId={flow.id}
      activeScreenId={activeScreenId}
      productSlug={product.slug}
      theme={product.theme}
      organizationId={orgId}
      commentCounts={commentCounts}
    />
  );
}
