import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/ProductImage";
import { useCart } from "@/hooks/useCart";
import { effectivePrice, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | WAGI - STATIONARIES" },
      {
        name: "description",
        content: "Review the stationery in your cart and continue to checkout.",
      },
      { property: "og:title", content: "Your Cart | WAGI - STATIONARIES" },
      { property: "og:description", content: "Review your items and check out securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { activeLines, savedLines, subtotal, setQuantity, removeItem, setSavedForLater, loading } =
    useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (activeLines.length === 0 && savedLines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft">
          <ShoppingBag className="size-7 text-primary" />
        </div>
        <h1 className="mt-5 text-xl font-bold">Your cart is empty</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our stationery and add your favourites.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold tracking-tight">Shopping cart</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {activeLines.map((line) => (
            <div
              key={line.productId}
              className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card"
            >
              <Link
                to="/products/$slug"
                params={{ slug: line.product.slug }}
                className="size-24 shrink-0 overflow-hidden rounded-xl bg-surface p-2"
              >
                <ProductImage
                  src={line.product.image_url ?? null}
                  alt={line.product.name}
                  className="size-full bg-transparent"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Link
                  to="/products/$slug"
                  params={{ slug: line.product.slug }}
                  className="line-clamp-2 text-sm font-semibold hover:text-primary"
                >
                  {line.product.name}
                </Link>
                <span className="text-sm font-bold text-primary">
                  {formatPrice(effectivePrice(line.product))}
                </span>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-full border">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      aria-label="Decrease quantity"
                      onClick={() => void setQuantity(line.productId, line.quantity - 1)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      aria-label="Increase quantity"
                      onClick={() => void setQuantity(line.productId, line.quantity + 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void setSavedForLater(line.productId, true)}
                  >
                    Save for later
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={async () => {
                      await removeItem(line.productId);
                      toast.success("Removed from cart");
                    }}
                  >
                    <Trash2 className="mr-1 size-3.5" /> Remove
                  </Button>
                </div>
              </div>
              <span className="hidden text-sm font-bold sm:block">
                {formatPrice(effectivePrice(line.product) * line.quantity)}
              </span>
            </div>
          ))}

          {savedLines.length > 0 && (
            <section className="pt-4">
              <h2 className="text-sm font-semibold">Saved for later</h2>
              <div className="mt-3 space-y-3">
                {savedLines.map((line) => (
                  <div
                    key={line.productId}
                    className="flex items-center gap-4 rounded-2xl border bg-card p-3 shadow-card"
                  >
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-surface p-1.5">
                      <ProductImage
                        src={line.product.image_url ?? null}
                        alt={line.product.name}
                        className="size-full bg-transparent"
                      />
                    </div>
                    <span className="line-clamp-2 flex-1 text-sm font-medium">
                      {line.product.name}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void setSavedForLater(line.productId, false)}
                    >
                      Move to cart
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(subtotal)}</span>
          </div>
          <Button
            size="lg"
            className="mt-5 w-full rounded-full"
            disabled={activeLines.length === 0}
            onClick={() => void navigate({ to: "/checkout" })}
          >
            Proceed to checkout
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/products">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
