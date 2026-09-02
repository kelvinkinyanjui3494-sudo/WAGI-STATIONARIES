import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Sparkles,
  Truck,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { STORE } from "@/lib/store-config";
import type { Category, Product } from "@/lib/db-types";
import { useRecentlyViewed } from "@/hooks/useLocalHistory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "WAGI - STATIONARIES | Quality Stationery Delivered in Kenya",
      },
      {
        name: "description",
        content:
          "Shop whiteboard supplies, Casio calculators, KLB mathematical tables, pens and art supplies. Countrywide delivery, pay with M-Pesa or cash on delivery.",
      },
      {
        property: "og:title",
        content: "WAGI - STATIONARIES | Stationery Shop in Nairobi",
      },
      {
        property: "og:description",
        content:
          "Markers, calculators, mathematical tables, pens and art supplies delivered across Kenya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { ids: recentIds } = useRecentlyViewed();

  useEffect(() => {
    void (async () => {
      try {
        const [
          categoryResponse,
          featuredResponse,
          newResponse,
          bestResponse,
        ] = await Promise.all([
          apiFetch<{ data: Category[] }>("/categories?per_page=100"),
          apiFetch<{ data: Product[] }>("/products?sort=newest&per_page=8"),
          apiFetch<{ data: Product[] }>("/products?sort=newest&per_page=8"),
          apiFetch<{ data: Product[] }>("/products?sort=popular&per_page=8"),
        ]);

        setCategories(categoryResponse.data ?? []);

        setFeatured(
          (featuredResponse.data ?? []).filter(
            (product) => Boolean(product.is_featured),
          ),
        );

        setNewArrivals(
          (newResponse.data ?? []).filter(
            (product) => Boolean(product.is_new_arrival),
          ),
        );

        setBestSellers(bestResponse.data ?? []);
      } catch (error) {
        console.error("Failed to load homepage data:", error);
        setCategories([]);
        setFeatured([]);
        setNewArrivals([]);
        setBestSellers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (recentIds.length === 0) {
      setRecentProducts([]);
      return;
    }

    void (async () => {
      try {
        const products = await Promise.all(
          recentIds.slice(0, 6).map(async (id) => {
            try {
              return await apiFetch<Product>(`/products/${id}`);
            } catch {
              return null;
            }
          }),
        );

        setRecentProducts(
          products.filter(
            (product): product is Product => product !== null,
          ),
        );
      } catch (error) {
        console.error("Failed to load recently viewed products:", error);
        setRecentProducts([]);
      }
    })();
  }, [recentIds]);

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-surface">
        <div className="container-page grid gap-8 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
          <div className="animate-fade-up space-y-5">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1"
            >
              <Sparkles className="mr-1 size-3.5" />
              Trusted by schools & offices
            </Badge>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Everything you need,{" "}
              <span className="text-brand-gradient">
                from pen to whiteboard
              </span>
            </h1>

            <p className="max-w-md text-base text-muted-foreground">
              {STORE.name} stocks genuine Casio calculators, KLB mathematical
              tables, whiteboard supplies, pens and art materials — delivered
              anywhere in Kenya.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Shop now
                <ArrowRight className="ml-1 size-4" />
              </Link>

              <Link
                to="/categories"
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Browse categories
              </Link>
            </div>

            <dl className="grid max-w-md grid-cols-3 gap-3 pt-2">
              {[
                { icon: Truck, label: "Countrywide delivery" },
                { icon: Smartphone, label: "M-Pesa & cash" },
                { icon: ShieldCheck, label: "Genuine products" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-xl border bg-card p-3 text-center shadow-card"
                >
                  <Icon className="mx-auto size-5 text-primary" />
                  <dt className="mt-1.5 text-[0.7rem] font-medium leading-tight">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-scale-in">
            <div className="brand-gradient absolute -inset-4 rounded-[2rem] opacity-10 blur-2xl" />

            <div className="relative grid grid-cols-2 gap-3">
              {(featured.length > 0 ? featured : newArrivals)
                .slice(0, 4)
                .map((p, i) => (
                  <Link
                    key={p.id}
                    to="/products/$slug"
                    params={{ slug: p.slug }}
                    className={`overflow-hidden rounded-2xl border bg-card p-3 shadow-card transition-transform hover:-translate-y-1 ${
                      i % 2 === 1 ? "mt-6" : ""
                    }`}
                  >
                    <ProductImage
                      src={
                        p.images?.find((image) => image.is_primary)?.url ??
                        p.images?.[0]?.url ??
                        ""
                      }
                      alt={p.name}
                      className="aspect-square rounded-xl bg-surface"
                      priority={i < 2}
                    />

                    <p className="mt-2 line-clamp-1 text-xs font-semibold">
                      {p.name}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <SectionHeading
          title="Shop by category"
          href="/categories"
          linkLabel="All categories"
        />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/categories/$slug"
              params={{ slug: c.slug }}
              className="group rounded-2xl border bg-card p-4 text-center shadow-card transition-all hover:-translate-y-1 hover:border-primary hover:shadow-elevated"
            >
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-xl">
                ✏️
              </span>

              <p className="mt-3 text-sm font-semibold leading-tight">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <ProductRow
        title="Featured picks"
        products={featured}
        loading={loading}
        href="/products"
      />

      <ProductRow
        title="New arrivals"
        products={newArrivals}
        loading={loading}
        href="/products"
      />

      <ProductRow
        title="Best sellers"
        products={bestSellers}
        loading={loading}
        href="/products"
      />

      {recentProducts.length > 0 && (
        <ProductRow
          title="Recently viewed"
          products={recentProducts}
          loading={false}
        />
      )}

      {/* M-Pesa banner */}
      <section className="container-page py-10">
        <div className="brand-gradient flex flex-col items-start gap-4 rounded-3xl p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pay the easy way</h2>

            <p className="mt-1 max-w-lg text-sm opacity-90">
              M-Pesa checkout is coming soon. Until then send payment to{" "}
              <strong>{STORE.mpesaPhone}</strong> or simply pay cash on
              delivery.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-secondary px-8 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Start shopping
            <BadgeCheck className="ml-1 size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string | undefined;
  linkLabel?: string | undefined;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
        {title}
      </h2>

      {href === "/products" && (
        <Link
          to="/products"
          className="text-sm font-medium text-primary hover:underline"
        >
          {linkLabel ?? "See all"}
        </Link>
      )}

      {href === "/categories" && (
        <Link
          to="/categories"
          className="text-sm font-medium text-primary hover:underline"
        >
          {linkLabel ?? "See all"}
        </Link>
      )}
    </div>
  );
}

function ProductRow({
  title,
  products,
  loading,
  href,
}: {
  title: string;
  products: Product[];
  loading: boolean;
  href?: string | undefined;
}) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="container-page py-6">
      <SectionHeading title={title} href={href} />

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products
              .slice(0, 8)
              .map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}