import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductImage } from "@/components/ProductImage";
import { RequireAuth } from "@/components/RequireAuth";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  formatPrice,
  normalizeKenyanPhone,
} from "@/lib/format";
import { KENYAN_COUNTIES, STORE } from "@/lib/store-config";
import type { Coupon, StoreSettings } from "@/lib/db-types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | WAGI - STATIONARIES" },
      {
        name: "description",
        content:
          "Enter your delivery details and place your stationery order with WAGI.",
      },
      {
        property: "og:title",
        content: "Checkout | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Fast checkout with M-Pesa or cash on delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAuth message="Sign in so we can save your order and let you track it.">
      <CheckoutPage />
    </RequireAuth>
  ),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { activeLines, subtotal, clearCart } = useCart();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [placing, setPlacing] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cod">(
    "cod",
  );

  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    phone: "",
    alt_phone: "",
    county: "Nairobi",
    town: "",
    estate: "",
    street: "",
    building: "",
    house_number: "",
    landmark: "",
    delivery_instructions: "",
  });

  /*
   * Load store settings from Laravel.
   */
  useEffect(() => {
    void apiFetch<StoreSettings>("/store-settings")
      .then((data) => setSettings(data))
      .catch((error) => {
        console.error("Failed to load store settings:", error);
        setSettings(null);
      });
  }, []);

  /*
   * Fill checkout form using the signed-in customer's profile.
   */
  useEffect(() => {
    if (!profile) return;

    const address = profile.address;

setForm((f) => ({
  ...f,
  customer_name:
    f.customer_name ||
    profile.name ||
    "",
  email: f.email || profile.email || "",
  phone: f.phone || profile.phone || "",
  alt_phone: f.alt_phone || profile.alt_phone || "",
  county: address?.county || f.county,
  town: f.town || address?.town || "",
  estate: f.estate || address?.estate || "",
  street: f.street || address?.street || "",
  building: f.building || address?.building || "",
  house_number:
    f.house_number || address?.house_number || "",
  landmark:
    f.landmark || address?.nearest_landmark || "",
}));
  }, [profile]);

  const deliveryFee = useMemo(() => {
    if (!settings) return 0;

    const threshold = Number(
      settings.free_delivery_threshold,
    );

    return subtotal >= threshold
      ? 0
      : Number(settings.delivery_fee);
  }, [settings, subtotal]);

  const discount = useMemo(() => {
    if (!coupon) return 0;

    return coupon.discount_type === "percentage"
      ? Math.round(
          (subtotal * Number(coupon.discount_value)) / 100,
        )
      : Number(coupon.discount_value);
  }, [coupon, subtotal]);

  const tax = useMemo(() => {
    const rate = Number(settings?.tax_rate ?? 0);

    return Math.round(
      ((subtotal - discount) * rate) / 100,
    );
  }, [settings, subtotal, discount]);

  const total =
    Math.max(0, subtotal - discount) +
    deliveryFee +
    tax;

  /*
   * Check coupon through Laravel.
   */
  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) return;

    setCheckingCoupon(true);

    let data: Coupon | null = null;

    try {
      const response = await apiFetch<{
        coupon: Coupon;
      }>(`/coupons/${encodeURIComponent(code)}`);

      data = response.coupon ?? null;
    } catch {
      data = null;
    }

    setCheckingCoupon(false);

    if (!data) {
      toast.error(
        "Coupon not found or no longer active",
      );
      return;
    }

    if (
      data.expires_at &&
      new Date(data.expires_at) < new Date()
    ) {
      toast.error("This coupon has expired");
      return;
    }

    if (
      subtotal <
      Number(data.min_order_amount)
    ) {
      toast.error(
        `Spend at least ${formatPrice(
          data.min_order_amount,
        )} to use this coupon`,
      );
      return;
    }

    setCoupon(data);

    toast.success("Coupon applied");
  };

  /*
   * Place the order through Laravel.
   *
   * Laravel is now responsible for:
   * - creating the order
   * - creating order items
   * - creating the payment record
   * - clearing the Laravel cart
   * - reducing/reserving stock
   */
  const placeOrder = async () => {
    if (activeLines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const phone = normalizeKenyanPhone(
      form.phone,
    );

    if (
      !form.customer_name.trim() ||
      !form.email.trim() ||
      !phone ||
      !form.town.trim()
    ) {
      toast.error(
        "Please fill in your name, email, a valid phone number and town",
      );
      return;
    }

    setPlacing(true);

    try {
      const response = await apiFetch<{
        order: {
          id: number | string;
          order_number: string;
        };
        message: string;
      }>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          payment_method: paymentMethod,

          delivery_fee: deliveryFee,

          tax,

          coupon_code:
            coupon?.code ?? null,

          address: {
            county: form.county,
            town: form.town.trim(),
            estate:
              form.estate.trim() || null,
            street:
              form.street.trim() || null,
            house_number:
              form.house_number.trim() || null,
            nearest_landmark:
              form.landmark.trim() || null,
            instructions:
              form.delivery_instructions.trim() ||
              null,
          },
        }),
      });

      /*
       * Keep the local cart state in sync.
       */
      await clearCart();

      setPlacing(false);

      toast.success("Order placed!", {
        description: `Reference ${response.order.order_number}`,
      });

      void navigate({
        to: "/orders/$id",
        params: {
          id: String(response.order.id),
        },
      });
    } catch (error) {
      setPlacing(false);

      toast.error(
        error instanceof Error
          ? error.message
          : "Could not place your order",
      );
    }
  };

  if (activeLines.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-xl font-bold">
          Your cart is empty
        </h1>

        <Button
          asChild
          className="mt-5 rounded-full"
        >
          <Link to="/products">
            Browse products
          </Link>
        </Button>
      </div>
    );
  }

  const field = (
    id: keyof typeof form,
    label: string,
    opts: {
      required?: boolean;
      placeholder?: string;
      type?: string;
    } = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{" "}
        {opts.required && (
          <span className="text-destructive">
            *
          </span>
        )}
      </Label>

      <Input
        id={id}
        type={opts.type ?? "text"}
        value={form[id]}
        maxLength={120}
        placeholder={opts.placeholder ?? ""}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [id]: e.target.value,
          }))
        }
      />
    </div>
  );

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Checkout
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">
              Contact details
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {field("customer_name", "Full name", {
                required: true,
              })}

              {field("email", "Email", {
                required: true,
                type: "email",
              })}

              {field("phone", "Phone (M-Pesa)", {
                required: true,
                placeholder: "07XX XXX XXX",
              })}

              {field(
                "alt_phone",
                "Alternative phone",
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">
              Delivery address
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="county">
                  County{" "}
                  <span className="text-destructive">
                    *
                  </span>
                </Label>

                <Select
                  value={form.county}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      county: v,
                    }))
                  }
                >
                  <SelectTrigger id="county">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="max-h-72">
                    {KENYAN_COUNTIES.map(
                      (c) => (
                        <SelectItem
                          key={c}
                          value={c}
                        >
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              {field("town", "Town / area", {
                required: true,
              })}

              {field("estate", "Estate")}

              {field("street", "Street")}

              {field(
                "building",
                "Building / apartment",
              )}

              {field(
                "house_number",
                "House number",
              )}

              {field(
                "landmark",
                "Nearest landmark",
              )}
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="delivery_instructions">
                Delivery instructions
              </Label>

              <Textarea
                id="delivery_instructions"
                maxLength={500}
                value={
                  form.delivery_instructions
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    delivery_instructions:
                      e.target.value,
                  }))
                }
                placeholder="e.g. Call when you reach the gate"
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">
              Payment method
            </h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) =>
                setPaymentMethod(
                  v as typeof paymentMethod,
                )
              }
              className="mt-4 space-y-3"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <RadioGroupItem
                  value="cod"
                  id="cod"
                  className="mt-1"
                />

                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <Banknote className="size-4 text-primary" />
                    Cash on delivery
                  </span>

                  <span className="mt-1 block text-sm text-muted-foreground">
                    Pay our rider in cash when your order arrives.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <RadioGroupItem
                  value="mpesa"
                  id="mpesa"
                  className="mt-1"
                />

                <span>
                  <span className="flex items-center gap-2 font-medium">
                    <Smartphone className="size-4 text-primary" />
                    M-Pesa

                    <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-secondary">
                      Coming soon
                    </span>
                  </span>

                  <span className="mt-1 block text-sm text-muted-foreground">
                    Automatic STK push is on the way. For now, send payment to{" "}
                    <strong>
                      {settings?.mpesa_phone ??
                        STORE.mpesaPhone}
                    </strong>{" "}
                    and we will confirm your order.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold">
            Your order
          </h2>

          <div className="space-y-3">
            {activeLines.map((l) => (
              <div
                key={l.productId}
                className="flex items-center gap-3"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface p-1">
                  <ProductImage
                    src={l.product.image_url ?? null}
                    alt={l.product.name}
                    className="size-full bg-transparent"
                  />
                </div>

                <span className="line-clamp-2 flex-1 text-xs font-medium">
                  {l.product.name}
                </span>

                <span className="text-xs text-muted-foreground">
                  ×{l.quantity}
                </span>

                <span className="text-xs font-semibold">
                  {formatPrice(
                    Number(l.product.price) *
                      l.quantity,
                  )}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) =>
                setCouponCode(e.target.value)
              }
              placeholder="Coupon code"
              aria-label="Coupon code"
            />

            <Button
              variant="outline"
              onClick={applyCoupon}
              disabled={checkingCoupon}
            >
              Apply
            </Button>
          </div>

          <div className="space-y-1.5 text-sm">
            <Row
              label="Subtotal"
              value={formatPrice(subtotal)}
            />

            {discount > 0 && (
              <Row
                label="Discount"
                value={`- ${formatPrice(
                  discount,
                )}`}
              />
            )}

            <Row
              label="Delivery"
              value={
                deliveryFee === 0
                  ? "Free"
                  : formatPrice(
                      deliveryFee,
                    )
              }
            />

            {tax > 0 && (
              <Row
                label="Tax"
                value={formatPrice(tax)}
              />
            )}
          </div>

          <Separator />

          <div className="flex justify-between text-base font-bold">
            <span>Total</span>

            <span className="text-primary">
              {formatPrice(total)}
            </span>
          </div>

          <Button
            size="lg"
            className="w-full rounded-full"
            disabled={placing}
            onClick={placeOrder}
          >
            {placing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Placing order…
              </>
            ) : (
              "Place order"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By placing this order you agree to be contacted on the phone number provided.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-medium">
        {value}
      </span>
    </div>
  );
}