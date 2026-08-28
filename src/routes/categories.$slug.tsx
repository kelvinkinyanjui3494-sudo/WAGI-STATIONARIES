import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Product } from "@/lib/db-types";

export const Route = createFileRoute("/categories/$slug")({
  loader: async ({ params }) => {
    const response = await apiFetch<{
      data: Category[];
    }>("/categories?per_page=100");

    const category = (response.data ?? []).find(
      (c) => c.slug === params.slug
    );

    if (!category) {
      throw notFound();
    }

    return { category };
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Category unavailable | WAGI - STATIONARIES" },
          { name: "robots", content: "noindex" },
        ],
      };
    }

    const c = loaderData.category;

    const description =
      `Shop ${c.name} at WAGI - STATIONARIES with delivery across Kenya.`;

    return {
      meta: [
        { title: `${c.name} | WAGI - STATIONARIES` },
        { name: "description", content: description },
        { property: "og:title", content: `${c.name} | WAGI - STATIONARIES` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },

  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    void (async () => {
      setLoading(true);

      try {
        const response = await apiFetch<{
          data: Product[];
          total: number;
        }>(
          `/products?category=${category.id}&sort=${sort}&per_page=100`
        );

        setProducts(response.data ?? []);
      } catch (error) {
        console.error("Failed to load category products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [category.id, sort]);

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/categories" className="hover:text-primary">
          Categories
        </Link>{" "}
        / <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {category.name}
          </h1>

          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Shop {category.name} products at WAGI - STATIONARIES.
          </p>
        </div>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger
            className="w-[180px]"
            aria-label="Sort products"
          >
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price_asc">
              Price: low to high
            </SelectItem>
            <SelectItem value="price_desc">
              Price: high to low
            </SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
      </div>

      {!loading && products.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No products in this category yet. Check back soon.
        </p>
      )}
    </div>
  );
}
