import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/store-config";
import type { Order } from "@/lib/db-types";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders | WAGI - STATIONARIES" },
      {
        name: "description",
        content: "Track the status of your WAGI stationery orders.",
      },
      {
        property: "og:title",
        content: "My Orders | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "See order history and delivery progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: () => (
    <RequireAuth message="Sign in to see your orders and track deliveries.">
      <OrdersPage />
    </RequireAuth>
  ),
});

type OrdersResponse = {
  data: Order[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void apiFetch<OrdersResponse>("/orders")
      .then((response) => {
        setOrders(response.data ?? []);
      })
      .catch((error) => {
        console.error("Failed to load orders:", error);
        setOrders([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold tracking-tight">My orders</h1>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl skeleton-shimmer"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft">
            <Package className="size-7 text-primary" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No orders yet
          </h2>

          <Button asChild className="mt-5 rounded-full">
            <Link to="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/orders/$id"
              params={{ id: String(o.id) }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-card transition-colors hover:border-primary"
            >
              <div>
                <p className="font-semibold">{o.order_number}</p>

                <p className="text-xs text-muted-foreground">
                  {formatDate(o.created_at)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </Badge>

                <Badge variant="outline">
                  {PAYMENT_STATUS_LABELS[o.payment_status] ??
                    o.payment_status}
                </Badge>

                <span className="font-bold text-primary">
                  {formatPrice(o.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}