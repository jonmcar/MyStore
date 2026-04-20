"use client";

/**
 * Cart state.
 *
 * A cart line is identified by `lineItemId` — not `listingId` — so the
 * same listing can appear in the cart multiple times with different
 * option selections. `buildLineItemId()` in types.ts produces a stable
 * id from listing + options, so adding the same combo twice increments
 * the existing line rather than duplicating.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Listing } from "./types";
import { buildLineItemId } from "./types";
import { STORE } from "./config";

interface CartState {
  items: CartItem[];
  hasHydrated: boolean;
  addItem: (
    listing: Listing,
    quantity?: number,
    selectedOptions?: Array<{ optionName: string; value: string }>,
    /** Optional override for the per-unit price. If omitted, uses
     * listing.priceCents. Used to capture option price modifiers. */
    priceCentsOverride?: number
  ) => void;
  removeItem: (lineItemId: string) => void;
  setQuantity: (lineItemId: string, quantity: number) => void;
  clear: () => void;
  itemCount: () => number;
  subtotalCents: () => number;
  taxCents: () => number;
  shippingCents: () => number;
  totalCents: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,

      addItem: (listing, quantity = 1, selectedOptions, priceCentsOverride) => {
        const lineItemId = buildLineItemId(listing.id, selectedOptions);
        const price = priceCentsOverride ?? listing.priceCents;
        set((state) => {
          const existing = state.items.find(
            (i) => i.lineItemId === lineItemId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineItemId === lineItemId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          const newItem: CartItem = {
            lineItemId,
            listingId: listing.id,
            quantity,
            priceCentsAtAdd: price,
            nameAtAdd: listing.name,
            imageAtAdd: listing.images[0],
            typeAtAdd: listing.type,
            slugAtAdd: listing.slug,
            selectedOptions:
              selectedOptions && selectedOptions.length > 0
                ? selectedOptions
                : undefined,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (lineItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineItemId !== lineItemId),
        }));
      },

      setQuantity: (lineItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.lineItemId === lineItemId ? { ...i, quantity } : i
          ),
        }));
      },

      clear: () => set({ items: [] }),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotalCents: () =>
        get().items.reduce(
          (sum, i) => sum + i.priceCentsAtAdd * i.quantity,
          0
        ),

      taxCents: () => Math.round(get().subtotalCents() * STORE.taxRate),

      shippingCents: () => {
        const items = get().items;
        const hasShippable = items.some((i) => i.typeAtAdd === "product");
        if (!hasShippable) return 0;
        const subtotal = get().subtotalCents();
        if (subtotal >= STORE.freeShippingOverCents) return 0;
        return STORE.flatShippingCents;
      },

      totalCents: () =>
        get().subtotalCents() + get().taxCents() + get().shippingCents(),
    }),
    {
      name: "store-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      migrate: (persistedState: unknown, version: number) => {
        // v1 cart items lacked lineItemId and selectedOptions. Fill them in
        // so old carts don't blow up on the new shape.
        if (
          version < 2 &&
          persistedState &&
          typeof persistedState === "object" &&
          "items" in persistedState
        ) {
          const state = persistedState as { items: Array<Record<string, unknown>> };
          state.items = state.items.map((item) => ({
            ...item,
            lineItemId: item.lineItemId ?? item.listingId,
            selectedOptions: item.selectedOptions ?? undefined,
          }));
          return state;
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
