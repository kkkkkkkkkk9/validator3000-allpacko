import { notFound, redirect } from "next/navigation";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getProductBySlug } from "@/lib/products";
import { getFlows } from "@/lib/flows";

interface PageProps {
  params: Promise<{ productSlug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { productSlug } = await params;
  const { supabase, membership } = await requireWorkspaceContext();
  const orgId = membership.organization_id;

  const { data: product } = await getProductBySlug(supabase, orgId, productSlug);
  if (!product) notFound();

  const { data: flows } = await getFlows(supabase, orgId, product.id);

  if (flows && flows.length > 0) {
    redirect(`/app/products/${product.slug}/flows/${flows[0].slug}`);
  }

  // No flows yet -- show empty state
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100dvh - 57px)",
        fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
        color: "#444",
        fontSize: "12px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
          {product.name}
        </div>
        <div>No flows yet. Create one to get started.</div>
      </div>
    </div>
  );
}
