import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, CheckCircle2, RefreshCw } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { RequireAuth } from "@/components/RequireAuth";
import { formatDateTime } from "@/lib/format";

type NotificationItem = {
  id: string;
  type?: string;
  title: string;
  message: string;
  created_at: string;
  read_at?: string | null;
};

type NotificationsResponse = {
  data: NotificationItem[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | WAGI - STATIONARIES" },
      {
        name: "description",
        content:
          "Order updates and announcements from WAGI - STATIONARIES.",
      },
      {
        property: "og:title",
        content: "Notifications | WAGI - STATIONARIES",
      },
      {
        property: "og:description",
        content: "Stay updated on your orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),

  component: () => (
    <RequireAuth message="Sign in to see your notifications.">
      <NotificationsPage />
    </RequireAuth>
  ),
});

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch<NotificationsResponse>(
        "/notifications",
      );

      setItems(response.data ?? []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      setMarkingId(id);

      await apiFetch(`/notifications/${id}/read`, {
        method: "POST",
      });

      setItems((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Order updates and important messages from WAGI - STATIONARIES.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadNotifications()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="mx-auto size-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading notifications...
          </p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-medium text-destructive">{error}</p>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary-soft">
            <Bell className="size-7 text-primary" />
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            You have no notifications yet.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((notification) => {
            const isRead = Boolean(notification.read_at);

            return (
              <li
                key={notification.id}
                className={`rounded-2xl border bg-card p-4 shadow-card transition ${
                  !isRead ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full ${
                        isRead
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary-soft text-primary"
                      }`}
                    >
                      <Bell className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {notification.title}
                        </p>

                        {!isRead && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.message}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => void markAsRead(notification.id)}
                      disabled={markingId === notification.id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-4" />
                      {markingId === notification.id
                        ? "Saving..."
                        : "Mark read"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}