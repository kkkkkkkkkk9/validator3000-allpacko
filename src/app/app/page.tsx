import { requireWorkspaceContext } from "@/lib/workspace";
import { getProducts } from "@/lib/products";

export default async function AppHomePage() {
  const { membership, supabase } = await requireWorkspaceContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .single();

  const { data: products } = await getProducts(
    supabase,
    membership.organization_id,
  );

  return (
    <div style={{ padding: "32px", maxWidth: "800px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "16px",
              color: "#fff",
              fontFamily:
                "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
              fontWeight: "normal",
            }}
          >
            Products
          </h1>
          {org?.name ? (
            <p
              style={{
                fontSize: "11px",
                color: "#555",
                fontFamily:
                  "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                marginTop: "4px",
              }}
            >
              Workspace: {org.name}
            </p>
          ) : null}
        </div>
        <div
          style={{
            border: "1px dashed #333",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "#555",
            fontFamily:
              "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: "11px",
            cursor: "default",
          }}
        >
          + Create product
        </div>
      </div>

      {products && products.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {products.map((product) => (
            <a
              key={product.id}
              href={`/app/products/${product.slug}`}
              className="block border border-border rounded-[10px] p-5 no-underline transition-colors hover:border-secondary"
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#fff",
                  fontFamily:
                    "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                  marginBottom: "6px",
                }}
              >
                {product.name}
              </div>
              {product.description && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#555",
                    fontFamily:
                      "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                    lineHeight: "1.5",
                    marginBottom: "8px",
                  }}
                >
                  {product.description}
                </div>
              )}
              <div
                style={{
                  fontSize: "10px",
                  color: "#333",
                  fontFamily:
                    "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Theme: {product.theme}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: "#444",
            fontFamily:
              "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: "12px",
          }}
        >
          No products yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
