/**
 * Data access layer — Prisma edition.
 *
 * Every function that used to read from in-memory arrays now queries
 * MySQL via Prisma. Function signatures are unchanged from the mock
 * version; only the bodies differ. Server actions and server
 * components that call these functions don't need to change.
 *
 * Functions starting with `_` are write operations called from server
 * actions; functions without the underscore are read operations.
 *
 * Converter functions (`toListing`, `toOrder`, etc.) at the bottom of
 * this file translate Prisma's row-shaped results into our domain
 * types (which have nested arrays, ISO-string timestamps, and typed
 * JSON fields).
 */

import { db } from "./db";
// NOTE: Prisma is imported as a runtime value (not `import type`)
// because Prisma.JsonNull is a runtime sentinel object we pass to
// Prisma when clearing JSON columns.
import { Prisma } from "../generated/prisma";
import type {
  Listing,
  ListingType,
  ProductListing,
  ServiceListing,
  ShopFilters,
  Order,
  OrderStatus,
  StorefrontContent,
  StoreConfig,
  DiscountCode,
  AppliedDiscount,
  ListingOption,
  AvailabilityStatus,
  CartItem,
  Address,
  StoreAnnouncement,
  StorePopup,
  Section,
} from "./types";
import { STOREFRONT_DEFAULTS } from "./default-storefront";
import { STORE_CONFIG_DEFAULTS } from "./default-store-config";

/**
 * A flattened patch for updating a listing.
 *
 * Why this type exists: `Listing` is a discriminated union of
 * `ProductListing | ServiceListing`. Using `Partial<Omit<Listing, ...>>`
 * narrows to the *intersection* of both branches — which means the
 * product-only fields (sku, weightGrams, stockCount) and service-only
 * fields (durationMinutes, locationType, locationLabel) aren't
 * reachable on that type, and the compiler rejects every reference
 * to them.
 *
 * `ListingPatch` flattens the union: every field is optional, and
 * product/service-specific fields are also included. This mirrors
 * what the admin form actually sends — a flat bag of the fields
 * that changed.
 *
 * `null` values mean "clear this field" (the sentinel for optional
 * fields). `undefined` means "don't touch." Required fields like
 * `name` are just `string | undefined` since they can't be cleared.
 */
export type ListingPatch = Partial<{
  slug: string;
  type: ListingType;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  images: string[];
  tags: string[];
  category: string;
  featured: boolean;
  inStock: boolean;
  availability: AvailabilityStatus | null;
  processingTime: string | null;
  options: ListingOption[] | null;
  isPublished: boolean;
  publishedAt: string | null;
  // Product-only
  sku: string | null;
  weightGrams: number | null;
  stockCount: number | null;
  // Service-only
  durationMinutes: number | null;
  locationType: "in-person" | "remote" | "either" | null;
  locationLabel: string | null;
}>;

// ─── Public listing readers (filter drafts) ──────────────────────────

export async function getAllListings(): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    where: { isPublished: true },
    include: { options: { include: { choices: true } }, category: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toListing);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const row = await db.listing.findFirst({
    where: { id, isPublished: true },
    include: { options: { include: { choices: true } }, category: true },
  });
  return row ? toListing(row) : null;
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const row = await db.listing.findFirst({
    where: { slug, isPublished: true },
    include: { options: { include: { choices: true } }, category: true },
  });
  return row ? toListing(row) : null;
}

export async function getFeaturedListings(limit = 4): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    where: { isPublished: true, featured: true },
    include: { options: { include: { choices: true } }, category: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toListing);
}

export async function getRelatedListings(
  listing: Listing,
  limit = 4
): Promise<Listing[]> {
  const cat = await db.category.findFirst({
    where: { name: listing.category },
    select: { id: true },
  });
  if (!cat) return [];
  const rows = await db.listing.findMany({
    where: {
      isPublished: true,
      categoryId: cat.id,
      NOT: { id: listing.id },
    },
    include: { options: { include: { choices: true } }, category: true },
    take: limit,
  });
  return rows.map(toListing);
}

export async function getCategories(): Promise<string[]> {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return rows.map((r) => r.name);
}

export async function searchListings(
  filters: ShopFilters
): Promise<Listing[]> {
  const where: Prisma.ListingWhereInput = { isPublished: true };

  if (filters.query) {
    const q = filters.query;
    where.OR = [
      { name: { contains: q } },
      { tagline: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (filters.category) {
    where.category = { name: filters.category };
  }
  if (filters.type) {
    where.type = filters.type;
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput;
  switch (filters.sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price-asc":
      orderBy = { priceCents: "asc" };
      break;
    case "price-desc":
      orderBy = { priceCents: "desc" };
      break;
    case "featured":
    default:
      orderBy = { featured: "desc" };
      break;
  }

  const rows = await db.listing.findMany({
    where,
    include: { options: { include: { choices: true } }, category: true },
    orderBy,
  });

  let results = rows.map(toListing);

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.tagline.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results;
}

// ─── Admin listing readers ───────────────────────────────────────────

export async function getAllListingsAdmin(): Promise<Listing[]> {
  const rows = await db.listing.findMany({
    include: { options: { include: { choices: true } }, category: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toListing);
}

export async function getListingByIdAdmin(
  id: string
): Promise<Listing | null> {
  const row = await db.listing.findUnique({
    where: { id },
    include: { options: { include: { choices: true } }, category: true },
  });
  return row ? toListing(row) : null;
}

// ─── Listing mutators ────────────────────────────────────────────────

export async function _createListing(
  input:
    | Omit<ProductListing, "id" | "createdAt">
    | Omit<ServiceListing, "id" | "createdAt">
): Promise<Listing> {
  const categoryId = await resolveCategoryId(input.category);

  const now = new Date();
  const row = await db.listing.create({
    data: {
      slug: input.slug,
      type: input.type,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      priceCents: input.priceCents,
      compareAtCents: input.compareAtCents ?? null,
      images: input.images,
      tags: input.tags,
      categoryId,
      featured: input.featured,
      inStock: input.inStock,
      availability: input.availability ?? null,
      processingTime: input.processingTime ?? null,
      isPublished: input.isPublished,
      publishedAt: input.isPublished ? now : null,
      sku: input.type === "product" ? input.sku : null,
      weightGrams:
        input.type === "product" ? (input.weightGrams ?? null) : null,
      stockCount:
        input.type === "product" ? (input.stockCount ?? null) : null,
      durationMinutes:
        input.type === "service" ? (input.durationMinutes ?? null) : null,
      locationType: input.type === "service" ? input.locationType : null,
      locationLabel:
        input.type === "service" ? (input.locationLabel ?? null) : null,
      options: input.options
        ? {
            create: input.options.map((opt, i) => optionToCreateInput(opt, i)),
          }
        : undefined,
    },
    include: { options: { include: { choices: true } }, category: true },
  });
  return toListing(row);
}

export async function _updateListing(
  id: string,
  patch: ListingPatch
): Promise<Listing | null> {
  const prev = await db.listing.findUnique({ where: { id } });
  if (!prev) return null;

  // Build the update data object only from keys present in the patch.
  // `null` means "clear this field," `undefined` means "don't touch."
  const data: Prisma.ListingUpdateInput = {};
  if (patch.slug !== undefined) data.slug = patch.slug;
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.tagline !== undefined) data.tagline = patch.tagline;
  if (patch.description !== undefined) data.description = patch.description;
  if (patch.priceCents !== undefined) data.priceCents = patch.priceCents;
  if (patch.compareAtCents !== undefined)
    data.compareAtCents = patch.compareAtCents;
  if (patch.images !== undefined)
    data.images = patch.images as Prisma.InputJsonValue;
  if (patch.tags !== undefined)
    data.tags = patch.tags as Prisma.InputJsonValue;
  if (patch.featured !== undefined) data.featured = patch.featured;
  if (patch.inStock !== undefined) data.inStock = patch.inStock;
  if (patch.availability !== undefined) data.availability = patch.availability;
  if (patch.processingTime !== undefined)
    data.processingTime = patch.processingTime;
  if (patch.sku !== undefined) data.sku = patch.sku;
  if (patch.weightGrams !== undefined) data.weightGrams = patch.weightGrams;
  if (patch.stockCount !== undefined) data.stockCount = patch.stockCount;
  if (patch.durationMinutes !== undefined)
    data.durationMinutes = patch.durationMinutes;
  if (patch.locationType !== undefined) data.locationType = patch.locationType;
  if (patch.locationLabel !== undefined)
    data.locationLabel = patch.locationLabel;

  // Set publishedAt when flipping from unpublished to published for
  // the first time.
  if (patch.isPublished !== undefined) {
    data.isPublished = patch.isPublished;
    if (!prev.isPublished && patch.isPublished) {
      data.publishedAt = new Date();
    }
  }

  if (patch.category !== undefined) {
    data.category = {
      connect: { id: await resolveCategoryId(patch.category) },
    };
  }

  // Options: `undefined` = don't touch. Anything else replaces the
  // entire list. A value of null or an empty array both mean "clear
  // all options."
  if (patch.options !== undefined) {
    await db.listingOption.deleteMany({ where: { listingId: id } });
    if (patch.options && patch.options.length > 0) {
      data.options = {
        create: patch.options.map((opt, i) => optionToCreateInput(opt, i)),
      };
    }
  }

  const row = await db.listing.update({
    where: { id },
    data,
    include: { options: { include: { choices: true } }, category: true },
  });
  return toListing(row);
}

export async function _deleteListing(id: string): Promise<boolean> {
  try {
    await db.listing.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function _duplicateListing(id: string): Promise<Listing | null> {
  const source = await db.listing.findUnique({
    where: { id },
    include: { options: { include: { choices: true } } },
  });
  if (!source) return null;

  const baseSlug = `${source.slug}-copy`;
  let slug = baseSlug;
  let counter = 2;
  while (await db.listing.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const copy = await db.listing.create({
    data: {
      slug,
      type: source.type,
      name: `${source.name} (copy)`,
      tagline: source.tagline,
      description: source.description,
      priceCents: source.priceCents,
      compareAtCents: source.compareAtCents,
      images: source.images as Prisma.InputJsonValue,
      tags: source.tags as Prisma.InputJsonValue,
      categoryId: source.categoryId,
      featured: false,
      inStock: source.inStock,
      availability: source.availability,
      processingTime: source.processingTime,
      isPublished: false,
      publishedAt: null,
      sku: source.sku,
      weightGrams: source.weightGrams,
      stockCount: source.stockCount,
      durationMinutes: source.durationMinutes,
      locationType: source.locationType,
      locationLabel: source.locationLabel,
      options: {
        create: source.options.map((opt, i) => ({
          type: opt.type,
          name: opt.name,
          required: opt.required,
          helpText: opt.helpText,
          sortOrder: i,
          config: opt.config as Prisma.InputJsonValue,
          choices: {
            create: opt.choices.map((c, j) => ({
              label: c.label,
              priceModifierCents: c.priceModifierCents,
              stockCount: c.stockCount,
              sortOrder: j,
            })),
          },
        })),
      },
    },
    include: { options: { include: { choices: true } }, category: true },
  });
  return toListing(copy);
}

export async function _countListings(): Promise<{
  total: number;
  published: number;
  drafts: number;
  outOfStock: number;
}> {
  const [total, published, outOfStock] = await Promise.all([
    db.listing.count(),
    db.listing.count({ where: { isPublished: true } }),
    db.listing.count({ where: { inStock: false } }),
  ]);
  return { total, published, drafts: total - published, outOfStock };
}

// ─── Orders ─────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<Order[]> {
  const rows = await db.order.findMany({
    include: { items: true },
    orderBy: { placedAt: "desc" },
  });
  return rows.map(toOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  return row ? toOrder(row) : null;
}

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const rows = await db.order.findMany({
    include: { items: true },
    orderBy: { placedAt: "desc" },
    take: limit,
  });
  return rows.map(toOrder);
}

export async function _createOrder(
  input: Omit<Order, "id" | "placedAt" | "status" | "statusUpdatedAt">
): Promise<Order> {
  const row = await db.order.create({
    data: {
      email: input.email,
      subtotalCents: input.subtotalCents,
      discountCents: input.discountCents,
      appliedDiscount: input.appliedDiscount
        ? (input.appliedDiscount as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      taxCents: input.taxCents,
      shippingCents: input.shippingCents,
      totalCents: input.totalCents,
      shippingAddress: input.shippingAddress
        ? (input.shippingAddress as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      customerNotes: input.customerNotes ?? null,
      items: {
        create: input.items.map((item) => ({
          listingId: item.listingId,
          listingSlug: item.slugAtAdd,
          listingType: item.typeAtAdd,
          nameAtAdd: item.nameAtAdd,
          imageAtAdd: item.imageAtAdd ?? null,
          priceCentsAtAdd: item.priceCentsAtAdd,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions
            ? (item.selectedOptions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      },
    },
    include: { items: true },
  });
  return toOrder(row);
}

export async function _updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  try {
    const row = await db.order.update({
      where: { id },
      data: { status, statusUpdatedAt: new Date() },
      include: { items: true },
    });
    return toOrder(row);
  } catch {
    return null;
  }
}

export async function _updateOrderNotes(
  id: string,
  notes: string
): Promise<Order | null> {
  try {
    const row = await db.order.update({
      where: { id },
      data: { notes: notes.trim() || null },
      include: { items: true },
    });
    return toOrder(row);
  } catch {
    return null;
  }
}

export async function _countOrders(): Promise<{
  total: number;
  placed: number;
  shipped: number;
  readyForPickup: number;
  refunded: number;
}> {
  const [total, placed, shipped, readyForPickup, refunded] = await Promise.all(
    [
      db.order.count(),
      db.order.count({ where: { status: "placed" } }),
      db.order.count({ where: { status: "shipped" } }),
      db.order.count({ where: { status: "ready-for-pickup" } }),
      db.order.count({ where: { status: "refunded" } }),
    ]
  );
  return { total, placed, shipped, readyForPickup, refunded };
}

// ─── Storefront content (singleton) ─────────────────────────────────

export async function getStorefrontContent(): Promise<StorefrontContent> {
  const row = await db.storefrontContent.findUnique({
    where: { id: "singleton" },
  });
  if (!row) {
    return STOREFRONT_DEFAULTS;
  }
  return {
    sections: row.sections as unknown as Section[],
    announcement: row.announcement as unknown as StoreAnnouncement,
    // Existing DB rows from before this column existed will have
    // popup === null; fall back to the default in that case.
    popup:
      (row.popup as unknown as StorePopup | null) ?? STOREFRONT_DEFAULTS.popup,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function _updateStorefrontContent(
  patch: Partial<StorefrontContent>
): Promise<StorefrontContent> {
  console.log("[DEBUG] _updateStorefrontContent called");
  console.log("[DEBUG] patch.popup:", JSON.stringify(patch.popup));
  const current = await getStorefrontContent();
  console.log("[DEBUG] current.popup:", JSON.stringify(current.popup));
  const merged: StorefrontContent = {
    sections: patch.sections ?? current.sections,
    announcement: patch.announcement ?? current.announcement,
    popup: patch.popup ?? current.popup,
    updatedAt: new Date().toISOString(),
  };
  console.log("[DEBUG] merged.popup:", JSON.stringify(merged.popup));
  try {
    const result = await db.storefrontContent.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        sections: merged.sections as unknown as Prisma.InputJsonValue,
        announcement: merged.announcement as unknown as Prisma.InputJsonValue,
        popup: merged.popup as unknown as Prisma.InputJsonValue,
      },
      update: {
        sections: merged.sections as unknown as Prisma.InputJsonValue,
        announcement: merged.announcement as unknown as Prisma.InputJsonValue,
        popup: merged.popup as unknown as Prisma.InputJsonValue,
      },
    });
    console.log(
      "[DEBUG] upsert result popup:",
      JSON.stringify(result.popup)
    );
  } catch (e) {
    console.error("[DEBUG] upsert threw:", e);
    throw e;
  }
  return merged;
}

export async function _resetStorefrontContent(): Promise<StorefrontContent> {
  await db.storefrontContent.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      sections: STOREFRONT_DEFAULTS.sections as unknown as Prisma.InputJsonValue,
      announcement:
        STOREFRONT_DEFAULTS.announcement as unknown as Prisma.InputJsonValue,
      popup: STOREFRONT_DEFAULTS.popup as unknown as Prisma.InputJsonValue,
    },
    update: {
      sections: STOREFRONT_DEFAULTS.sections as unknown as Prisma.InputJsonValue,
      announcement:
        STOREFRONT_DEFAULTS.announcement as unknown as Prisma.InputJsonValue,
      popup: STOREFRONT_DEFAULTS.popup as unknown as Prisma.InputJsonValue,
    },
  });
  return {
    ...STOREFRONT_DEFAULTS,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Store config ───────────────────────────────────────────────────

/**
 * Read the singleton store config from the DB.
 *
 * Falls back to STORE_CONFIG_DEFAULTS if no row exists yet (fresh
 * install, never seeded). Also merges individual missing fields on
 * top of defaults so that a stored config missing a new field (e.g.
 * field added after the row was last saved) still returns a fully
 * populated object.
 */
export async function getStoreConfig(): Promise<StoreConfig> {
  const row = await db.storeConfig.findUnique({
    where: { id: "singleton" },
  });
  if (!row) return { ...STORE_CONFIG_DEFAULTS };
  const stored = row.data as unknown as Partial<StoreConfig>;
  return { ...STORE_CONFIG_DEFAULTS, ...stored };
}

/** Upsert the singleton store config with a partial patch. Missing
 *  fields in the patch are preserved from the current value. */
export async function _updateStoreConfig(
  patch: Partial<StoreConfig>
): Promise<StoreConfig> {
  const current = await getStoreConfig();
  const merged: StoreConfig = { ...current, ...patch };
  await db.storeConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      data: merged as unknown as Prisma.InputJsonValue,
    },
    update: {
      data: merged as unknown as Prisma.InputJsonValue,
    },
  });
  return merged;
}

/** Reset the singleton store config to STORE_CONFIG_DEFAULTS. */
export async function _resetStoreConfig(): Promise<StoreConfig> {
  await db.storeConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      data: STORE_CONFIG_DEFAULTS as unknown as Prisma.InputJsonValue,
    },
    update: {
      data: STORE_CONFIG_DEFAULTS as unknown as Prisma.InputJsonValue,
    },
  });
  return { ...STORE_CONFIG_DEFAULTS };
}

// ─── Discount codes ─────────────────────────────────────────────────

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  const rows = await db.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDiscountCode);
}

export async function getDiscountCodeById(
  id: string
): Promise<DiscountCode | null> {
  const row = await db.discountCode.findUnique({ where: { id } });
  return row ? toDiscountCode(row) : null;
}

export async function findValidDiscountCode(
  codeStr: string,
  subtotalCents: number
): Promise<
  | { ok: true; code: DiscountCode; discountCents: number }
  | { ok: false; reason: string }
> {
  const normalized = codeStr.trim().toUpperCase();
  if (!normalized) return { ok: false, reason: "Enter a code to apply." };
  const row = await db.discountCode.findUnique({
    where: { code: normalized },
  });
  if (!row) return { ok: false, reason: "That code isn't recognized." };
  const code = toDiscountCode(row);
  if (!code.active) return { ok: false, reason: "This code is inactive." };
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return { ok: false, reason: "This code has expired." };
  }
  if (
    typeof code.usageLimit === "number" &&
    code.timesUsed >= code.usageLimit
  ) {
    return { ok: false, reason: "This code has reached its usage limit." };
  }
  if (
    typeof code.minSubtotalCents === "number" &&
    subtotalCents < code.minSubtotalCents
  ) {
    const minDollars = (code.minSubtotalCents / 100).toFixed(2);
    return {
      ok: false,
      reason: `This code requires a subtotal of at least $${minDollars}.`,
    };
  }
  const discountCents = computeDiscountCents(code, subtotalCents);
  return { ok: true, code, discountCents };
}

export function computeDiscountCents(
  code: DiscountCode,
  subtotalCents: number
): number {
  if (code.kind === "percent") {
    return Math.round(subtotalCents * (code.amount / 100));
  }
  return Math.min(code.amount, subtotalCents);
}

export async function _createDiscountCode(
  input: Omit<DiscountCode, "id" | "createdAt" | "timesUsed">
): Promise<DiscountCode> {
  const row = await db.discountCode.create({
    data: {
      code: input.code.trim().toUpperCase(),
      description: input.description,
      kind: input.kind,
      amount: input.amount,
      minSubtotalCents: input.minSubtotalCents ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      usageLimit: input.usageLimit ?? null,
      active: input.active,
    },
  });
  return toDiscountCode(row);
}

export async function _updateDiscountCode(
  id: string,
  patch: Partial<Omit<DiscountCode, "id" | "createdAt" | "timesUsed">>
): Promise<DiscountCode | null> {
  try {
    const data: Prisma.DiscountCodeUpdateInput = {};
    if (patch.code !== undefined) data.code = patch.code.trim().toUpperCase();
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.kind !== undefined) data.kind = patch.kind;
    if (patch.amount !== undefined) data.amount = patch.amount;
    if (patch.minSubtotalCents !== undefined)
      data.minSubtotalCents = patch.minSubtotalCents;
    if (patch.expiresAt !== undefined)
      data.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null;
    if (patch.usageLimit !== undefined) data.usageLimit = patch.usageLimit;
    if (patch.active !== undefined) data.active = patch.active;
    const row = await db.discountCode.update({ where: { id }, data });
    return toDiscountCode(row);
  } catch {
    return null;
  }
}

export async function _deleteDiscountCode(id: string): Promise<boolean> {
  try {
    await db.discountCode.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function _incrementDiscountUsage(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  try {
    await db.discountCode.update({
      where: { code: normalized },
      data: { timesUsed: { increment: 1 } },
    });
  } catch {
    // Silent — code may have been deleted between validation and redemption.
  }
}

export function buildAppliedDiscount(
  code: DiscountCode,
  discountCents: number
): AppliedDiscount {
  return {
    code: code.code,
    description: code.description,
    kind: code.kind,
    amount: code.amount,
    discountCents,
  };
}

// ═══ Prisma Row → Domain Type converters ═══════════════════════════

type ListingRow = Prisma.ListingGetPayload<{
  include: {
    options: { include: { choices: true } };
    category: true;
  };
}>;

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

// `object` (not `{}`) is the lint-clean way to say "empty include".
type DiscountCodeRow = Prisma.DiscountCodeGetPayload<object>;

function toListing(row: ListingRow): Listing {
  const base = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    priceCents: row.priceCents,
    compareAtCents: row.compareAtCents ?? undefined,
    images: (row.images as unknown as string[]) ?? [],
    category: row.category.name,
    tags: (row.tags as unknown as string[]) ?? [],
    featured: row.featured,
    inStock: row.inStock,
    availability: (row.availability ?? undefined) as
      | AvailabilityStatus
      | undefined,
    processingTime: row.processingTime ?? undefined,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString(),
    options:
      row.options.length > 0
        ? row.options
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(toListingOption)
        : undefined,
  };

  if (row.type === "product") {
    return {
      ...base,
      type: "product",
      sku: row.sku ?? "",
      weightGrams: row.weightGrams ?? undefined,
      stockCount: row.stockCount ?? undefined,
    };
  }
  return {
    ...base,
    type: "service",
    durationMinutes: row.durationMinutes ?? undefined,
    locationType:
      (row.locationType as "in-person" | "remote" | "either") ?? "in-person",
    locationLabel: row.locationLabel ?? undefined,
  };
}

function toListingOption(
  row: ListingRow["options"][number]
): ListingOption {
  const base = {
    id: row.id,
    name: row.name,
    required: row.required,
    helpText: row.helpText ?? undefined,
  };
  const config = (row.config as Record<string, unknown>) ?? {};
  const choices = row.choices
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      label: c.label,
      priceModifierCents: c.priceModifierCents ?? undefined,
      stockCount: c.stockCount ?? undefined,
    }));

  switch (row.type) {
    case "select":
      return {
        ...base,
        type: "select",
        choices,
        display: (config.display as "dropdown" | "radio") ?? "dropdown",
      };
    case "multi-select":
      return {
        ...base,
        type: "multi-select",
        choices,
        minSelections: config.minSelections as number | undefined,
        maxSelections: config.maxSelections as number | undefined,
      };
    case "text":
      return {
        ...base,
        type: "text",
        placeholder: config.placeholder as string | undefined,
        maxLength: config.maxLength as number | undefined,
      };
    case "textarea":
      return {
        ...base,
        type: "textarea",
        placeholder: config.placeholder as string | undefined,
        maxLength: config.maxLength as number | undefined,
      };
    case "number":
      return {
        ...base,
        type: "number",
        placeholder: config.placeholder as string | undefined,
        min: config.min as number | undefined,
        max: config.max as number | undefined,
        step: config.step as number | undefined,
      };
    case "file":
      return {
        ...base,
        type: "file",
        accept: config.accept as string | undefined,
        maxSizeMB: config.maxSizeMB as number | undefined,
      };
    case "datetime":
      return {
        ...base,
        type: "datetime",
        mode: (config.mode as "date" | "datetime") ?? "date",
        min: config.min as string | undefined,
        max: config.max as string | undefined,
      };
    default:
      throw new Error(`Unknown option type: ${row.type}`);
  }
}

function optionToCreateInput(
  opt: ListingOption,
  sortOrder: number
): Prisma.ListingOptionCreateWithoutListingInput {
  let config: Record<string, unknown> = {};
  let choices: Array<{
    label: string;
    priceModifierCents?: number | null;
    stockCount?: number | null;
    sortOrder: number;
  }> = [];

  switch (opt.type) {
    case "select":
      config = { display: opt.display ?? "dropdown" };
      choices = opt.choices.map((c, i) => ({
        label: c.label,
        priceModifierCents: c.priceModifierCents ?? null,
        stockCount: c.stockCount ?? null,
        sortOrder: i,
      }));
      break;
    case "multi-select":
      config = {
        minSelections: opt.minSelections,
        maxSelections: opt.maxSelections,
      };
      choices = opt.choices.map((c, i) => ({
        label: c.label,
        priceModifierCents: c.priceModifierCents ?? null,
        stockCount: c.stockCount ?? null,
        sortOrder: i,
      }));
      break;
    case "text":
    case "textarea":
      config = { placeholder: opt.placeholder, maxLength: opt.maxLength };
      break;
    case "number":
      config = {
        placeholder: opt.placeholder,
        min: opt.min,
        max: opt.max,
        step: opt.step,
      };
      break;
    case "file":
      config = { accept: opt.accept, maxSizeMB: opt.maxSizeMB };
      break;
    case "datetime":
      config = { mode: opt.mode, min: opt.min, max: opt.max };
      break;
  }

  return {
    type: opt.type,
    name: opt.name,
    required: opt.required,
    helpText: opt.helpText ?? null,
    sortOrder,
    config: config as Prisma.InputJsonValue,
    ...(choices.length > 0 ? { choices: { create: choices } } : {}),
  };
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    email: row.email,
    status: row.status as OrderStatus,
    statusUpdatedAt: row.statusUpdatedAt.toISOString(),
    subtotalCents: row.subtotalCents,
    discountCents: row.discountCents,
    appliedDiscount:
      (row.appliedDiscount as unknown as AppliedDiscount) ?? undefined,
    taxCents: row.taxCents,
    shippingCents: row.shippingCents,
    totalCents: row.totalCents,
    shippingAddress: (row.shippingAddress as unknown as Address) ?? undefined,
    notes: row.notes ?? undefined,
    customerNotes: row.customerNotes ?? undefined,
    placedAt: row.placedAt.toISOString(),
    items: row.items.map(toCartItem),
  };
}

function toCartItem(row: OrderRow["items"][number]): CartItem {
  return {
    lineItemId: row.id,
    listingId: row.listingId,
    nameAtAdd: row.nameAtAdd,
    imageAtAdd: row.imageAtAdd ?? undefined,
    priceCentsAtAdd: row.priceCentsAtAdd,
    quantity: row.quantity,
    typeAtAdd: row.listingType as "product" | "service",
    slugAtAdd: row.listingSlug,
    selectedOptions:
      (row.selectedOptions as unknown as CartItem["selectedOptions"]) ??
      undefined,
  };
}

function toDiscountCode(row: DiscountCodeRow): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    kind: row.kind as "percent" | "fixed",
    amount: row.amount,
    minSubtotalCents: row.minSubtotalCents ?? undefined,
    expiresAt: row.expiresAt?.toISOString(),
    usageLimit: row.usageLimit ?? undefined,
    timesUsed: row.timesUsed,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── Category helpers ───────────────────────────────────────────────

async function resolveCategoryId(name: string): Promise<string> {
  const normalized = name.trim();
  let cat = await db.category.findUnique({ where: { name: normalized } });
  if (!cat) {
    const slug = normalized
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    cat = await db.category.create({
      data: { name: normalized, slug },
    });
  }
  return cat.id;
}
