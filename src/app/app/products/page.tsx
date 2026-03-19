import Link from "next/link";
import { requireWorkspaceContext } from "@/lib/workspace";
import { getProducts } from "@/lib/products";

export default async function ProductsPage() {
  const { supabase, membership } = await requireWorkspaceContext();
  const orgId = membership.organization_id;

  const { data: products } = await getProducts(supabase, orgId);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 960, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <h1
          style={{
            fontSize: 14,
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: 2,
            fontWeight: "normal",
            fontFamily: "inherit",
            margin: 0,
          }}
        >
          Products
        </h1>
      </div>

      {!products || products.length === 0 ? (
        <div
          style={{
            border: "1px solid #222",
            borderRadius: 10,
            padding: "60px 32px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#555", fontSize: 12, marginBottom: 8 }}>
            No products yet
          </p>
          <p style={{ color: "#333", fontSize: 11 }}>
            Create your first product to get started
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/app/products/${product.slug}`}
              style={{
                display: "block",
                textDecoration: "none",
                border: "1px solid #222",
                borderRadius: 10,
                padding: "20px 16px",
                background: "#0a0a0a",
                transition: "border-color 150ms",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: "#aaa",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  {product.name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    border: "1px solid #333",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {product.theme}
                </span>
              </div>
              {product.description ? (
                <p
                  style={{
                    color: "#555",
                    fontSize: 11,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {product.description}
                </p>
              ) : (
                <p
                  style={{
                    color: "#333",
                    fontSize: 11,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  No description
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
