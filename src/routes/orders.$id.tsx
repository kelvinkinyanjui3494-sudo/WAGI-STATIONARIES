import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RequireAuth } from "@/components/RequireAuth";
import { formatDate, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  STORE,
} from "@/lib/store-config";
import type { Order, OrderItem } from "@/lib/db-types";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Details | WAGI - STATIONARIES" },
      {
        name: "description",
        content: "Follow your WAGI order from packing to delivery.",
      },
      {
        property: "og:title",
        content: "Order Details | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Live status for your stationery order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: () => (
    <RequireAuth message="Sign in to view this order.">
      <OrderDetailPage />
    </RequireAuth>
  ),
});

type OrderResponse = Order & {
  items?: OrderItem[];
};

function OrderDetailPage() {
  const { id } = Route.useParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<OrderResponse>(`/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setItems(data.items ?? []);
      })
      .catch((error) => {
        console.error("Failed to load order:", error);
        setOrder(null);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container-page py-10">
        <div className="h-64 rounded-2xl skeleton-shimmer" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>

        <Link
          to="/orders"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(
    order.status as (typeof ORDER_STATUS_FLOW)[number],
  );

  return (
    <div className="container-page py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 text-sm text-muted-foreground"
      >
        <Link to="/orders" className="hover:text-primary">
          My orders
        </Link>{" "}
        / <span className="text-foreground">{order.order_number}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.order_number}
          </h1>

          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>

          <Badge variant="outline">
            {PAYMENT_STATUS_LABELS[order.payment_status] ??
              order.payment_status}
          </Badge>
        </div>
      </div>

      {order.status !== "cancelled" && order.status !== "returned" && (
        <ol className="mt-8 grid gap-3 sm:grid-cols-6">
          {ORDER_STATUS_FLOW.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-2 sm:flex-col sm:text-center"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                  i <= currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {i + 1}
              </span>

              <span
                className={cn(
                  "text-xs",
                  i <= currentStep
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Items</h2>

          <div className="mt-4 space-y-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="line-clamp-2 flex-1">
                  {it.product_name}
                </span>

                <span className="text-muted-foreground">
                  ×{it.quantity}
                </span>

                <span className="font-semibold">
                  {formatPrice(it.total_price)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />

            {Number(order.discount) > 0 && (
              <Row
                label="Discount"
                value={`- ${formatPrice(order.discount)}`}
              />
            )}

            <Row
              label="Delivery"
              value={
                Number(order.delivery_fee) === 0
                  ? "Free"
                  : formatPrice(order.delivery_fee)
              }
            />

            {Number(order.tax) > 0 && (
              <Row label="Tax" value={formatPrice(order.tax)} />
            )}

            <Separator className="my-2" />

            <div className="flex justify-between text-base font-bold">
              <span>Total</span>

              <span className="text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 text-sm shadow-card">
            <h2 className="text-sm font-semibold">Delivery to</h2>

            <p className="mt-2 font-medium">{order.customer_name}</p>

            <p className="text-muted-foreground">{order.phone}</p>

            <p className="text-muted-foreground">
              {[
                order.house_number,
                order.building,
                order.street,
                order.estate,
                order.town,
                order.county,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>

            {order.landmark && (
              <p className="text-muted-foreground">
                Landmark: {order.landmark}
              </p>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-5 text-sm shadow-card">
            <h2 className="text-sm font-semibold">Payment</h2>

            <p className="mt-2 text-muted-foreground">
              {order.payment_method === "mpesa"
                ? `M-Pesa — send ${formatPrice(order.total)} to ${STORE.mpesaPhone} (automatic STK push coming soon).`
                : "Cash on delivery — pay our rider when your order arrives."}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 text-sm shadow-card">
            <h2 className="text-sm font-semibold">Need help?</h2>

            <p className="mt-2 text-muted-foreground">
              Call{" "}
              <a
                href={`tel:${STORE.phoneIntl}`}
                className="text-primary"
              >
                {STORE.phone}
              </a>{" "}
              or email{" "}
              <a
                href={`mailto:${STORE.email}`}
                className="break-all text-primary"
              >
                {STORE.email}
              </a>
              .
            </p>
          </div>
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
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}