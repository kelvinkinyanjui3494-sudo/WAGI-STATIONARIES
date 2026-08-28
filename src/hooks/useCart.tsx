import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { CartLine, Product } from "@/lib/db-types";
import { effectivePrice } from "@/lib/format";

const GUEST_KEY = "wagi_guest_cart_v1";

type GuestLine = {
  productId: string;
  quantity: number;
  savedForLater: boolean;
};

type LaravelCartItem = {
  product_id: string | number;
  sku: string;
  name: string;
  unit_price: number;
  quantity: number;
  saved_for_later?: boolean;
};

type LaravelCart = {
  id: number | string;
  user_id: number | string;
  items: LaravelCartItem[];
};

type CartContextValue = {
  lines: CartLine[];
  activeLines: CartLine[];
  savedLines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  setSavedForLater: (productId: string, saved: boolean) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readGuestCart(): GuestLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as GuestLine[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(lines: GuestLine[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
}

function cartItemsToGuestLines(items: LaravelCartItem[]): GuestLine[] {
  return items.map((item) => ({
    productId: String(item.product_id),
    quantity: Number(item.quantity),
    savedForLater: Boolean(item.saved_for_later),
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const [raw, setRaw] = useState<GuestLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? null;

  const hydrateProducts = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts({});
      return;
    }

    const uniqueIds = [...new Set(ids)];

    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          return await apiFetch<Product>(`/products/${id}`);
        } catch {
          return null;
        }
      }),
    );

    const map: Record<string, Product> = {};

    for (const product of results) {
      if (product) {
        map[String(product.id)] = product;
      }
    }

    setProducts(map);
  }, []);

  /**
   * Loads the cart from Laravel when signed in
   * or local storage when browsing as a guest.
   */
  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (userId) {
        const guest = readGuestCart();

        /*
         * Merge the guest cart into the Laravel account
         * when the customer signs in.
         */
        for (const line of guest) {
          await apiFetch<LaravelCart>("/cart", {
            method: "POST",
            body: JSON.stringify({
              product_id: line.productId,
              quantity: line.quantity,
            }),
          });
        }

        if (guest.length > 0) {
          writeGuestCart([]);
        }

        const cart = await apiFetch<LaravelCart>("/cart");

        const next = cartItemsToGuestLines(cart.items ?? []);

        setRaw(next);

        await hydrateProducts(next.map((item) => item.productId));
      } else {
        const guest = readGuestCart();

        setRaw(guest);

        await hydrateProducts(
          guest.map((item) => item.productId),
        );
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, hydrateProducts]);

  useEffect(() => {
    if (authLoading) return;

    void load();
  }, [authLoading, load]);

  const persist = useCallback(
    async (next: GuestLine[]) => {
      setRaw(next);

      if (!userId) {
        writeGuestCart(next);
      }

      await hydrateProducts(
        next.map((item) => item.productId),
      );
    },
    [userId, hydrateProducts],
  );

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      const existing = raw.find(
        (line) => line.productId === productId,
      );

      const next = existing
        ? raw.map((line) =>
            line.productId === productId
              ? {
                  ...line,
                  quantity: line.quantity + quantity,
                  savedForLater: false,
                }
              : line,
          )
        : [
            ...raw,
            {
              productId,
              quantity,
              savedForLater: false,
            },
          ];

      await persist(next);

      if (userId) {
        await apiFetch<LaravelCart>("/cart", {
          method: "POST",
          body: JSON.stringify({
            product_id: productId,
            quantity,
          }),
        });
      }
    },
    [raw, persist, userId],
  );

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) return;

      await persist(
        raw.map((line) =>
          line.productId === productId
            ? { ...line, quantity }
            : line,
        ),
      );

      if (userId) {
        await apiFetch<LaravelCart>(
          `/cart/${productId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              quantity,
            }),
          },
        );
      }
    },
    [raw, persist, userId],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await persist(
        raw.filter(
          (line) => line.productId !== productId,
        ),
      );

      if (userId) {
        await apiFetch<LaravelCart>(
          `/cart/${productId}`,
          {
            method: "DELETE",
          },
        );
      }
    },
    [raw, persist, userId],
  );

  const setSavedForLater = useCallback(
    async (productId: string, saved: boolean) => {
      /*
       * The Laravel cart currently stores the cart items
       * as JSON and does not expose a dedicated
       * saved-for-later endpoint.
       *
       * We therefore preserve this behavior locally
       * for now while keeping the existing UI/API intact.
       */
      await persist(
        raw.map((line) =>
          line.productId === productId
            ? {
                ...line,
                savedForLater: saved,
              }
            : line,
        ),
      );
    },
    [raw, persist],
  );

  const clearCart = useCallback(async () => {
    const current = [...raw];

    await persist([]);

    if (userId) {
      await Promise.all(
        current.map((line) =>
          apiFetch<LaravelCart>(
            `/cart/${line.productId}`,
            {
              method: "DELETE",
            },
          ),
        ),
      );
    }
  }, [raw, persist, userId]);

  const lines = useMemo<CartLine[]>(
    () =>
      raw
        .filter((line) => products[line.productId])
        .map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          savedForLater: line.savedForLater,
          product: products[line.productId]!,
        })),
    [raw, products],
  );

  const activeLines = useMemo(
    () => lines.filter((line) => !line.savedForLater),
    [lines],
  );

  const savedLines = useMemo(
    () => lines.filter((line) => line.savedForLater),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      activeLines,
      savedLines,
      count: activeLines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      ),
      subtotal: activeLines.reduce(
        (sum, line) =>
          sum +
          effectivePrice(line.product) *
            line.quantity,
        0,
      ),
      loading,
      addItem,
      setQuantity,
      removeItem,
      setSavedForLater,
      clearCart,
      isInCart: (productId: string) =>
        raw.some(
          (line) => line.productId === productId,
        ),
    }),
    [
      lines,
      activeLines,
      savedLines,
      loading,
      addItem,
      setQuantity,
      removeItem,
      setSavedForLater,
      clearCart,
      raw,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error(
      "useCart must be used inside <CartProvider>",
    );
  }

  return ctx;
}