"use server";

/**
 * Server actions for admin mutations and shopper order placement.
 *
 * Client components call these directly; Next.js handles the
 * client→server RPC. Each mutation calls `revalidatePath` to
 * invalidate affected server-rendered pages.
 */

import { revalidatePath } from "next/cache";
import {
  _createListing,
  _updateListing,
  _deleteListing,
  _duplicateListing,
  _createOrder,
  _updateOrderStatus,
  _updateOrderNotes,
  _updateStorefrontContent,
  _resetStorefrontContent,
  _updateStoreConfig,
  _resetStoreConfig,
  _createDiscountCode,
  _updateDiscountCode,
  _deleteDiscountCode,
  _incrementDiscountUsage,
  findValidDiscountCode,
  buildAppliedDiscount,
  type ListingPatch,
} from "./data";
import type {
  Listing,
  ProductListing,
  ServiceListing,
  Order,
  OrderStatus,
  CartItem,
  Address,
  StorefrontContent,
  StoreConfig,
  DiscountCode,
  AppliedDiscount,
} from "./types";
import { STORE } from "./config";

// ─── Listing actions ────────────────────────────────────────────────

export async function createListingAction(
  input:
    | Omit<ProductListing, "id" | "createdAt">
    | Omit<ServiceListing, "id" | "createdAt">
): Promise<{ ok: true; listing: Listing } | { ok: false; error: string }> {
  try {
    const listing = await _createListing(input);
    revalidateShop();
    return { ok: true, listing };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function updateListingAction(
  id: string,
  patch: ListingPatch
): Promise<{ ok: true; listing: Listing } | { ok: false; error: string }> {
  const listing = await _updateListing(id, patch);
  if (!listing) return { ok: false, error: "Listing not found" };
  revalidateShop(listing.slug);
  return { ok: true, listing };
}

export async function deleteListingAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ok = await _deleteListing(id);
  if (!ok) return { ok: false, error: "Listing not found" };
  revalidateShop();
  return { ok: true };
}

export async function duplicateListingAction(
  id: string
): Promise<{ ok: true; listing: Listing } | { ok: false; error: string }> {
  const listing = await _duplicateListing(id);
  if (!listing) return { ok: false, error: "Listing not found" };
  revalidatePath("/admin/listings");
  return { ok: true, listing };
}

// ─── Order actions ──────────────────────────────────────────────────

interface PlaceOrderInput {
  items: CartItem[];
  email: string;
  shippingAddress?: Address;
  /** Shopper-entered discount code, if any. Validated server-side. */
  discountCode?: string;
  /** Shopper-entered special instructions */
  customerNotes?: string;
}

export async function placeOrderAction(
  input: PlaceOrderInput
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  if (!input.items || input.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }
  if (!input.email || !input.email.trim()) {
    return { ok: false, error: "Email required" };
  }

  // Compute totals server-side from the (already-snapshotted) cart lines.
  const subtotalCents = input.items.reduce(
    (sum, i) => sum + i.priceCentsAtAdd * i.quantity,
    0
  );

  // Apply discount if one was provided. We re-validate server-side so
  // the client can't forge a discount without a matching code.
  let discountCents = 0;
  let appliedDiscount: AppliedDiscount | undefined;
  if (input.discountCode && input.discountCode.trim()) {
    const result = await findValidDiscountCode(
      input.discountCode,
      subtotalCents
    );
    if (!result.ok) {
      return { ok: false, error: `Discount: ${result.reason}` };
    }
    discountCents = result.discountCents;
    appliedDiscount = buildAppliedDiscount(result.code, discountCents);
  }

  const discountedSubtotal = subtotalCents - discountCents;
  const taxCents = Math.round(discountedSubtotal * STORE.taxRate);
  const hasShippable = input.items.some((i) => i.typeAtAdd === "product");
  const shippingCents =
    !hasShippable || discountedSubtotal >= STORE.freeShippingOverCents
      ? 0
      : STORE.flatShippingCents;
  const totalCents = discountedSubtotal + taxCents + shippingCents;

  const order = await _createOrder({
    items: input.items,
    email: input.email.trim(),
    shippingAddress: input.shippingAddress,
    subtotalCents,
    discountCents,
    appliedDiscount,
    taxCents,
    shippingCents,
    totalCents,
    customerNotes: input.customerNotes?.trim() || undefined,
  });

  // Bump usage counter on the code after a successful order placement.
  if (appliedDiscount) {
    await _incrementDiscountUsage(appliedDiscount.code);
    revalidatePath("/admin/discounts");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  return { ok: true, order };
}

/** Preview a code for the shopper before they submit. Doesn't
 * increment usage — that happens on order placement. */
export async function validateDiscountCodeAction(
  codeStr: string,
  subtotalCents: number
): Promise<
  | {
      ok: true;
      description: string;
      discountCents: number;
      kind: "percent" | "fixed";
      amount: number;
    }
  | { ok: false; error: string }
> {
  const result = await findValidDiscountCode(codeStr, subtotalCents);
  if (!result.ok) return { ok: false, error: result.reason };
  return {
    ok: true,
    description: result.code.description,
    discountCents: result.discountCents,
    kind: result.code.kind,
    amount: result.code.amount,
  };
}

export async function updateOrderStatusAction(
  id: string,
  status: OrderStatus
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const order = await _updateOrderStatus(id, status);
  if (!order) return { ok: false, error: "Order not found" };
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, order };
}

export async function updateOrderNotesAction(
  id: string,
  notes: string
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const order = await _updateOrderNotes(id, notes);
  if (!order) return { ok: false, error: "Order not found" };
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, order };
}

// ─── Storefront content actions ─────────────────────────────────────

export async function updateStorefrontContentAction(
  patch: Partial<StorefrontContent>
): Promise<
  { ok: true; content: StorefrontContent } | { ok: false; error: string }
> {
  try {
    const content = await _updateStorefrontContent(patch);
    revalidatePath("/");
    revalidatePath("/admin/storefront");
    return { ok: true, content };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function resetStorefrontContentAction(): Promise<{
  ok: true;
  content: StorefrontContent;
}> {
  const content = await _resetStorefrontContent();
  revalidatePath("/");
  revalidatePath("/admin/storefront");
  return { ok: true, content };
}

// ─── Store config actions ───────────────────────────────────────────

export async function updateStoreConfigAction(
  patch: Partial<StoreConfig>
): Promise<
  { ok: true; config: StoreConfig } | { ok: false; error: string }
> {
  try {
    const config = await _updateStoreConfig(patch);
    // Store config shows up in the header, footer, page titles —
    // revalidate everything that could be affected.
    revalidatePath("/", "layout");
    return { ok: true, config };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function resetStoreConfigAction(): Promise<{
  ok: true;
  config: StoreConfig;
}> {
  const config = await _resetStoreConfig();
  revalidatePath("/", "layout");
  return { ok: true, config };
}

// ─── Helpers ────────────────────────────────────────────────────────

function revalidateShop(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/listings");
  if (slug) revalidatePath(`/shop/${slug}`);
}

// ─── Discount code actions ──────────────────────────────────────────

export async function createDiscountCodeAction(
  input: Omit<DiscountCode, "id" | "createdAt" | "timesUsed">
): Promise<
  { ok: true; code: DiscountCode } | { ok: false; error: string }
> {
  if (!input.code.trim()) return { ok: false, error: "Code is required" };
  if (input.amount <= 0) return { ok: false, error: "Amount must be positive" };
  try {
    const code = await _createDiscountCode(input);
    revalidatePath("/admin/discounts");
    return { ok: true, code };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function updateDiscountCodeAction(
  id: string,
  patch: Partial<Omit<DiscountCode, "id" | "createdAt" | "timesUsed">>
): Promise<{ ok: true; code: DiscountCode } | { ok: false; error: string }> {
  const code = await _updateDiscountCode(id, patch);
  if (!code) return { ok: false, error: "Discount code not found" };
  revalidatePath("/admin/discounts");
  return { ok: true, code };
}

export async function deleteDiscountCodeAction(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ok = await _deleteDiscountCode(id);
  if (!ok) return { ok: false, error: "Discount code not found" };
  revalidatePath("/admin/discounts");
  return { ok: true };
}
