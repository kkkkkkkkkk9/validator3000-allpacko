"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ChangeEvent } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
};

type ProductSwitcherProps = {
  products: Product[];
  currentSlug?: string;
};

export function ProductSwitcher({ products, currentSlug }: ProductSwitcherProps) {
  const router = useRouter();

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const slug = e.target.value;
      if (slug) {
        router.push(`/app/products/${slug}`);
      }
    },
    [router],
  );

  if (products.length === 0) {
    return (
      <span
        style={{
          color: "#555",
          fontSize: 11,
          fontFamily: "inherit",
        }}
      >
        No products
      </span>
    );
  }

  return (
    <select
      value={currentSlug ?? ""}
      onChange={handleChange}
      style={{
        background: "none",
        border: "1px solid #333",
        color: "#aaa",
        fontFamily: "inherit",
        fontSize: 11,
        padding: "4px 8px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="" disabled>
        Select product...
      </option>
      {products.map((p) => (
        <option key={p.id} value={p.slug}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
