import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const GUEST_KEY = "wagi_guest_wishlist_v1";

type WishlistItem = {
  id: number;
  user_id: number;
  product_id: number;
  created_at?: string;
};

function readGuest(): string[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(
      window.localStorage.getItem(GUEST_KEY) ?? "[]",
    ) as string[];
  } catch {
    return [];
  }
}

/** Wishlist stored in the database for signed-in customers, locally for guests. */
export function useWishlist() {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    if (userId) {
      try {
        const data = await apiFetch<WishlistItem[]>("/wishlist");

        setIds(
          data.map((item) => String(item.product_id)),
        );
      } catch (error) {
        console.error("Failed to load wishlist:", error);
        setIds([]);
      }
    } else {
      setIds(readGuest());
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    async (productId: string) => {
      const has = ids.includes(productId);
      const next = has
        ? ids.filter((id) => id !== productId)
        : [...ids, productId];

      setIds(next);

      if (userId) {
        try {
          if (has) {
            await apiFetch(`/wishlist/${productId}`, {
              method: "DELETE",
            });
          } else {
            await apiFetch("/wishlist", {
              method: "POST",
              body: JSON.stringify({
                product_id: productId,
              }),
            });
          }
        } catch (error) {
          console.error("Failed to update wishlist:", error);

          // Restore the previous state if the API request fails.
          setIds(ids);

          throw error;
        }
      } else {
        window.localStorage.setItem(
          GUEST_KEY,
          JSON.stringify(next),
        );
      }

      return !has;
    },
    [ids, userId],
  );

  return {
    ids,
    toggle,
    has: (id: string) => ids.includes(id),
    reload: load,
  };
}