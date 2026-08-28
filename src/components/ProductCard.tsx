import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/ProductImage";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/db-types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const off = discountPercent(product);

  const outOfStock = product.stock_qty <= 0;
  const wished = wishlist.has(String(product.id));

  const primaryImage =
    product.images?.find((image) => image.is_primary)?.url ??
    product.images?.[0]?.url ??
    null;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated",
        className,
      )}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square bg-surface p-3"
        aria-label={product.name}
      >
        <ProductImage
          src={primaryImage}
          alt={product.name}
          className="size-full rounded-xl bg-transparent"
          imgClassName="transition-transform duration-500 group-hover:scale-105"
        />

        <span className="absolute left-3 top-3 flex flex-col gap-1">
          {off != null && <Badge variant="destructive">-{off}%</Badge>}

          {product.is_new_arrival && (
            <Badge variant="secondary">New</Badge>
          )}
        </span>

        {outOfStock && (
          <span className="absolute inset-0 grid place-items-center rounded-xl bg-background/70 backdrop-blur-[1px]">
            <Badge variant="outline" className="bg-card">
              Out of stock
            </Badge>
          </span>
        )}
      </Link>

      <button
        type="button"
        onClick={async () => {
          const added = await wishlist.toggle(String(product.id));

          toast.success(
            added ? "Added to wishlist" : "Removed from wishlist",
          );
        }}
        aria-label={
          wished ? "Remove from wishlist" : "Add to wishlist"
        }
        className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border bg-card/90 backdrop-blur transition-colors hover:bg-accent"
      >
        <Heart
          className={cn(
            "size-4",
            wished && "fill-destructive text-destructive",
          )}
        />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        {product.brand && (
          <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </span>
        )}

        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
        >
          {product.name}
        </Link>

        <StarRating
          value={product.rating}
          count={0}
        />

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            <span className="text-base font-bold text-primary">
              {formatPrice(effectivePrice(product))}
            </span>

            {off != null && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <Button
            size="icon"
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            onClick={async () => {
              await addItem(String(product.id), 1);

              toast.success("Added to cart", {
                description: product.name,
              });
            }}
          >
            <ShoppingCart className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="aspect-square skeleton-shimmer" />

      <div className="space-y-2 p-4">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-2/3 rounded skeleton-shimmer" />
        <div className="h-5 w-24 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}