import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImage } from "@/components/ProductImage";
import { ProductCard } from "@/components/ProductCard";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useRecentlyViewed } from "@/hooks/useLocalHistory";
import {
  discountPercent,
  effectivePrice,
  formatDate,
  formatPrice,
} from "@/lib/format";
import type {
  Product,
  ProductImage as ProductImageRow,
  Review,
} from "@/lib/db-types";
import { cn } from "@/lib/utils";

type ProductResponse = Product & {
  images?: ProductImageRow[];
};

type ProductsResponse = {
  data: ProductResponse[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const response = await apiFetch<ProductResponse[] | ProductResponse>(
      `/products/${encodeURIComponent(params.slug)}`,
    );

    const product = Array.isArray(response) ? response[0] : response;

    if (!product) {
      throw notFound();
    }

    return {
      product,
    };
  },

  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title: "Product unavailable | WAGI - STATIONARIES",
          },
          {
            name: "robots",
            content: "noindex",
          },
        ],
      };
    }

    const p = loaderData.product;
    const description = (p.description ?? "").slice(0, 155);

    return {
      meta: [
        {
          title: `${p.name} | WAGI - STATIONARIES`,
        },
        {
          name: "description",
          content: description,
        },
        {
          property: "og:title",
          content: `${p.name} | WAGI - STATIONARIES`,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "product",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        ...(p.image_url?.startsWith("https://")
          ? [
              {
                property: "og:image",
                content: p.image_url,
              },
              {
                name: "twitter:image",
                content: p.image_url,
              },
            ]
          : []),
      ],
    };
  },

  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const { track } = useRecentlyViewed();

  const [gallery, setGallery] = useState<ProductImageRow[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(
    product.image_url ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const off = discountPercent(product);
  const stockQuantity = Number(product.stock_quantity ?? product.stock_qty ?? 0);
  const outOfStock = stockQuantity <= 0;
  const lowStock =
    !outOfStock &&
    stockQuantity <= Number(product.low_stock_threshold ?? 5);

  const specs = (product.specifications ?? {}) as Record<string, unknown>;

  useEffect(() => {
    setActiveImage(product.image_url ?? null);
    setQuantity(1);
    track(String(product.id));

    void (async () => {
      try {
        const imageRows = (product.images ?? []) as ProductImageRow[];

        setGallery(imageRows);

        if (imageRows.length > 0) {
          const primary =
            imageRows.find((image) => image.is_primary) ?? imageRows[0];

          if (primary?.url) {
            setActiveImage(primary.url);
          }
        }

        if (product.category_id) {
          const relatedResponse = await apiFetch<
            ProductsResponse | ProductResponse[]
          >(
            `/products?category=${encodeURIComponent(
              String(product.category_id),
            )}&per_page=4`,
          );

          const relatedProducts = Array.isArray(relatedResponse)
            ? relatedResponse
            : relatedResponse.data ?? [];

          setRelated(
            relatedProducts
              .filter((item) => item.id !== product.id)
              .slice(0, 4),
          );
        } else {
          setRelated([]);
        }

      /*
 * Reviews are not yet implemented in the Laravel backend.
 * Keep the UI ready for them until the reviews system is added.
 */
        setReviews([]);
      } catch (error) {
        console.error("Failed to load product details:", error);
        setGallery([]);
        setRelated([]);
        setReviews([]);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const images = [
    ...(activeImage ? [{ id: "main", image_url: activeImage }] : []),
    ...gallery
      .filter((image) => image.url && image.url !== activeImage)
      .map((image) => ({
        id: image.id,
        image_url: image.url,
      })),
  ];

  const submitReview = async () => {
    if (!user) {
      toast.error("Sign in to leave a review");
      void navigate({ to: "/auth" });
      return;
    }

    if (comment.trim().length < 5) {
      toast.error("Please write a slightly longer review");
      return;
    }

    setSubmitting(true);

    /*
 * The Laravel backend does not currently have a reviews endpoint.
 * Keep the review action disabled until that endpoint is available.
 */
    setSubmitting(false);

    toast.info(
      "Reviews will be available once the Laravel reviews system is enabled.",
    );
  };

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-4 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/products" className="hover:text-primary">
          Products
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-3xl border bg-surface p-6 shadow-card">
            <ProductImage
              src={activeImage}
              alt={product.name}
              className="aspect-square rounded-2xl bg-transparent"
              priority
            />

            {off != null && (
              <Badge
                variant="destructive"
                className="absolute left-5 top-5"
              >
                -{off}% off
              </Badge>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(img.image_url)}
                  className={cn(
                    "size-20 shrink-0 overflow-hidden rounded-xl border bg-surface p-1",
                    activeImage === img.image_url &&
                      "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <ProductImage
                    src={img.image_url}
                    alt={product.name}
                    className="size-full bg-transparent"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {product.brand && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </span>
          )}

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <StarRating
              value={Number(product.rating ?? 0)}
              count={Number(product.review_count ?? 0)}
              size="md"
            />

            <span className="text-xs text-muted-foreground">
              SKU: {product.sku}
            </span>

            <span className="text-xs text-muted-foreground">
              {Number(product.sold_count ?? 0)} sold
            </span>
          </div>

          <div className="flex items-end gap-3">
            <span className="text-3xl font-extrabold text-primary">
              {formatPrice(effectivePrice(product))}
            </span>

            {off != null && (
              <span className="pb-1 text-base text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <div>
            {outOfStock ? (
              <Badge variant="destructive">Out of stock</Badge>
            ) : lowStock ? (
              <Badge variant="secondary">
                Only {stockQuantity} left in stock
              </Badge>
            ) : (
              <Badge variant="outline" className="text-success">
                <Check className="mr-1 size-3" /> In stock
              </Badge>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Decrease quantity"
                onClick={() =>
                  setQuantity((q) => Math.max(1, q - 1))
                }
              >
                <Minus className="size-4" />
              </Button>

              <span className="w-10 text-center text-sm font-semibold">
                {quantity}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Increase quantity"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(stockQuantity || 99, q + 1),
                  )
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="flex-1 rounded-full"
              disabled={outOfStock}
              onClick={async () => {
                await addItem(String(product.id), quantity);

                toast.success("Added to cart", {
                  description: `${quantity} × ${product.name}`,
                });
              }}
            >
              <ShoppingCart className="mr-2 size-4" />
              Add to cart
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="rounded-full"
              disabled={outOfStock}
              onClick={async () => {
                await addItem(String(product.id), quantity);
                void navigate({ to: "/checkout" });
              }}
            >
              Buy now
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              aria-label="Save to wishlist"
              onClick={async () => {
                const added = await wishlist.toggle(String(product.id));

                toast.success(
                  added
                    ? "Saved to wishlist"
                    : "Removed from wishlist",
                );
              }}
            >
              <Heart
                className={cn(
                  "size-4",
                  wishlist.has(String(product.id)) &&
                    "fill-destructive text-destructive",
                )}
              />
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                icon: Truck,
                text: "Countrywide delivery",
              },
              {
                icon: Smartphone,
                text: "M-Pesa coming soon",
              },
              {
                icon: ShieldCheck,
                text: "Genuine products",
              },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-xl border bg-card p-3 text-xs shadow-card"
              >
                <Icon className="size-4 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="specs" className="mt-12">
        <TabsList>
          <TabsTrigger value="specs">
            Specifications
          </TabsTrigger>

          <TabsTrigger value="reviews">
            Reviews ({reviews.length})
          </TabsTrigger>

          <TabsTrigger value="delivery">
            Delivery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="mt-4">
          {Object.keys(specs).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extra specifications listed.
            </p>
          ) : (
            <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
              {Object.entries(specs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 bg-card p-3 text-sm"
                >
                  <dt className="font-medium capitalize text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>

                  <dd className="text-right font-medium">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </TabsContent>

        <TabsContent
          value="reviews"
          className="mt-4 space-y-6"
        >
          <div className="space-y-4">
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No reviews yet — be the first to review this product.
              </p>
            )}

            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border bg-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {r.author_name}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </span>
                </div>

                <StarRating
                  value={r.rating}
                  className="mt-1"
                />

                {r.title && (
                  <p className="mt-2 text-sm font-medium">
                    {r.title}
                  </p>
                )}

                <p className="mt-1 text-sm text-muted-foreground">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">
              Write a review
            </h2>

            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="rating">
                  Your rating
                </Label>

                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star`}
                      onClick={() => setRating(n)}
                      className={cn(
                        "size-9 rounded-lg border text-sm font-semibold",
                        rating >= n
                          ? "border-secondary bg-secondary/15 text-secondary"
                          : "",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="review-title">
                  Title (optional)
                </Label>

                <Input
                  id="review-title"
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Great calculator"
                />
              </div>

              <div>
                <Label htmlFor="review-comment">
                  Review
                </Label>

                <Textarea
                  id="review-comment"
                  value={comment}
                  maxLength={1000}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell other customers what you think"
                />
              </div>

              <Button
                onClick={submitReview}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting…"
                  : "Submit review"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="delivery"
          className="mt-4 space-y-2 text-sm text-muted-foreground"
        >
          <p>
            Orders placed before 3:00 PM are dispatched the same
            working day.
          </p>

          <p>
            Nairobi CBD pickup is available at Latema Road during
            business hours.
          </p>

          <p>
            Countrywide courier delivery typically takes 1–3
            working days.
          </p>

          <p>
            Pay with M-Pesa (coming soon) or cash on delivery.
          </p>
        </TabsContent>
      </Tabs>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold tracking-tight">
            You may also like
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}