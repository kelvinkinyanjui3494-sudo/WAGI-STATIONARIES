import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Category, Product } from "@/lib/db-types";

type Search = {
  q?: string | undefined;
  category?: string | undefined;
  sort?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  inStock?: boolean | undefined;
};

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
    min: search["min"] != null && !Number.isNaN(Number(search["min"])) ? Number(search["min"]) : undefined,
    max: search["max"] != null && !Number.isNaN(Number(search["max"])) ? Number(search["max"]) : undefined,
    inStock: search["inStock"] === true || search["inStock"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Stationery | WAGI - STATIONARIES" },
      {
        name: "description",
        content:
          "Browse every WAGI product: whiteboard markers, Casio scientific calculators, mathematical tables, pens, notebooks and art supplies.",
      },
      { property: "og:title", content: "Shop All Stationery | WAGI - STATIONARIES" },
      {
        property: "og:description",
        content: "Filter by category, price and availability. Delivered across Kenya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Most popular" },
];

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

useEffect(() => {
  void (async () => {
    try {
      const response = await apiFetch<{
        data: Category[];
      }>("/categories");

      setCategories(response.data ?? []);
    } catch (error) {
      console.error("Failed to load categories:", error);
      setCategories([]);
    }
  })();
}, []);

  useEffect(() => setPage(0), [search.q, search.category, search.sort, search.min, search.max, search.inStock]);

  useEffect(() => {
  void (async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.q) params.set("q", search.q);
      if (search.category) params.set("category", search.category);
      if (search.min != null) params.set("min", String(search.min));
      if (search.max != null) params.set("max", String(search.max));
      if (search.inStock) params.set("inStock", "true");
      if (search.sort) params.set("sort", search.sort);

      params.set("page", String(page + 1));

      const response = await apiFetch<{
        data: Product[];
        current_page: number;
        last_page: number;
        total: number;
      }>(`/products?${params.toString()}`);

      setProducts(response.data ?? []);
      setTotal(response.total ?? 0);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  })();
}, [
  search.q,
  search.category,
  search.sort,
  search.min,
  search.max,
  search.inStock,
  page,
]);
  const activeFilters = useMemo(
    () =>
      [
        search.q
          ? { key: "q", label: `"${search.q}"` }
          : null,
        search.category
          ? {
              key: "category",
              label:
                categories.find((c) => String(c.id) === search.category)?.name ??
                "Category",
            }
          : null,
        search.min != null
          ? { key: "min", label: `From KES ${search.min}` }
          : null,
        search.max != null
          ? { key: "max", label: `Up to KES ${search.max}` }
          : null,
        search.inStock
          ? { key: "inStock", label: "In stock" }
          : null,
      ].filter(Boolean) as { key: string; label: string }[],
    [search, categories],
  );

  const update = (patch: Partial<Search>) =>
    void navigate({ search: (prev: Search) => ({ ...prev, ...patch }) });

  const filters = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Category</h2>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => update({ category: undefined })}
            className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent ${
              !search.category ? "bg-primary-soft font-medium text-primary" : ""
            }`}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update({ category: String(c.id) })}
              className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent ${
                search.category === String(c.id) ? "bg-primary-soft font-medium text-primary" : ""
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Price range (KES)</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={search.min ?? ""}
            onBlur={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={search.max ?? ""}
            onBlur={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="inStock"
          checked={Boolean(search.inStock)}
          onCheckedChange={(v) => update({ inStock: v === true ? true : undefined })}
        />
        <Label htmlFor="inStock" className="text-sm">
          In stock only
        </Label>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          void navigate({
            search: {},
          })
        }
      >
        Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        / <span className="text-foreground">Products</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {search.q ? `Results for “${search.q}”` : "All products"}
          </h1>
          <p className="text-sm text-muted-foreground">{total} product(s) found</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="mr-2 size-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-5">
              <SheetTitle className="mb-4">Filters</SheetTitle>
              {filters}
            </SheetContent>
          </Sheet>
          <Select
            value={search.sort ?? "newest"}
            onValueChange={(v) => update({ sort: v })}
          >
            <SelectTrigger className="w-[180px]" aria-label="Sort products">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => update({ [f.key]: undefined } as Partial<Search>)}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-medium hover:bg-accent"
            >
              {f.label} <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center shadow-card">
              <p className="text-lg font-semibold">No products matched your search</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword or clear the filters.
              </p>
              <Button className="mt-5" onClick={() => void navigate({ search: {} })}>
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {total > pageSize && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={(page + 1) * pageSize >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
