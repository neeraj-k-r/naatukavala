"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  shop_name: string;
  shop_slug: string;
  delivery_charge: number;
  stock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  deliveryTotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "naatukavala-cart";

const listeners = new Set<() => void>();
let cache: CartItem[] = [];
let hydrated = false;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (!hydrated && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cache = raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      cache = [];
    }
    hydrated = true;
  }
  return cache;
}

function write(next: CartItem[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode etc.)
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);

  const value = useMemo<CartContextValue>(() => {
    const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const existing = cache.find((line) => line.product_id === item.product_id);
      let next: CartItem[];
      if (existing) {
        next = cache.map((line) =>
          line.product_id === item.product_id
            ? {
                ...line,
                quantity: Math.min(
                  line.stock,
                  line.quantity + Math.max(1, quantity),
                ),
              }
            : line,
        );
      } else {
        next = [
          ...cache,
          { ...item, quantity: Math.min(item.stock, Math.max(1, quantity)) },
        ];
      }
      write(next);
    };

    const setQuantity = (productId: string, quantity: number) => {
      const next = cache.map((line) =>
        line.product_id === productId
          ? { ...line, quantity: Math.max(0, Math.min(line.stock, quantity)) }
          : line,
      );
      write(next);
    };

    const removeItem = (productId: string) => {
      write(cache.filter((line) => line.product_id !== productId));
    };

    const clear = () => write([]);

    return {
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: items.reduce(
        (sum, line) =>
          sum + (Number.isFinite(line.price) ? line.price * line.quantity : 0),
        0,
      ),
      deliveryTotal: cartGroupedByShop(items).reduce(
        (sum, group) => sum + (group.delivery_charge ?? 0),
        0,
      ),
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [items]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function cartGroupedByShop(items: CartItem[]): {
  shop_name: string;
  shop_slug: string;
  delivery_charge: number;
  items: CartItem[];
  total: number;
}[] {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.shop_slug;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([slug, lines]) => {
    const first = lines[0];
    return {
      shop_name: first.shop_name,
      shop_slug: slug,
      delivery_charge: first.delivery_charge ?? 0,
      items: lines,
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    };
  });
}