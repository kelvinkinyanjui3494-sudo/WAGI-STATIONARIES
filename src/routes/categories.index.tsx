import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Category, Product } from "@/lib/db-types";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Stationery Categories | WAGI - STATIONARIES" },
      {
        name: "description",
        content:
          "Explore WAGI categories: whiteboard supplies, Casio calculators, mathematical tables and sets, pens and writing, art supplies and more.",
      },
      {
        property: "og:title",
        content: "Stationery Categories | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Find exactly what you need — organised by category.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          apiFetch<{
            data: Category[];
            current_page: number;
            last_page: number;
            total: number;
          }>("/categories"),

          apiFetch<{
            data: Product[];
            current_page: number;
            last_page: number;
            total: number;
          }>("/products?per_page=1000"),
        ]);

        setCategories(categoryResponse.data ?? []);

        const map: Record<number, number> = {};

        for (const product of productResponse.data ?? []) {
          if (product.category_id !== null) {
            map[product.category_id] =
              (map[product.category_id] ?? 0) + 1;
          }
        }

        setCounts(map);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
        setCounts({});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        / <span className="text-foreground">Categories</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight">
        Shop by category
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        Everything from whiteboard markers to scientific calculators.
      </p>

      {loading ? (
        <div className="mt-6 text-sm text-muted-foreground">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">No categories found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            There are currently no stationery categories available.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/categories/$slug"
              params={{ slug: category.slug }}
              className="group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary hover:shadow-elevated"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">
                📚
              </span>

              <span className="min-w-0">
                <span className="block font-semibold group-hover:text-primary">
                  {category.name}
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  {counts[category.id] ?? 0} product(s)
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
