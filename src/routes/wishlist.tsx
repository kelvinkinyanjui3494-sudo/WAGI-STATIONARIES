import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/db-types";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist | WAGI - STATIONARIES" },
      {
        name: "description",
        content: "Stationery you saved for later at WAGI - STATIONARIES.",
      },
      {
        property: "og:title",
        content: "Your Wishlist | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Keep track of the products you love.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);

      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetch<{
          data: Product[];
         }>("/products");

       const wishlistProducts = response.data.filter((product) =>
       ids.includes(String(product.id)),
    );

        setProducts(wishlistProducts);
      } catch (error) {
        console.error("Failed to load wishlist products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [ids]);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold tracking-tight">My wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {ids.length} saved item(s)
      </p>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft">
            <Heart className="size-7 text-primary" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">Nothing saved yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any product to save it here.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}