/**
 * Domain types for the storefront.
 *
 * `Listing` is a discriminated union over `type: "product" | "service"`.
 * `ListingOption` is a discriminated union over `type` covering all the
 * input shapes a shopper can encounter (select, multi-select, text,
 * textarea, number, file, datetime).
 *
 * Roadmap for further option types lives in TODO-LATER.md at project root.
 */

export type ListingType = "product" | "service";

export type UserRole = "guest" | "shopper" | "admin";

// ─── Option choices and options ─────────────────────────────────────

/** A single choice within a select / multi-select option. */
export interface ListingOptionChoice {
  id: string;
  label: string;
  /** Optional price delta in cents. Positive adds, negative subtracts.
   * Applied at add-to-cart time so the cart-line snapshot reflects the
   * modified price. */
  priceModifierCents?: number;
  /** Optional per-choice stock count. Undefined = unlimited. Zero =
   * this choice is shown but disabled ("sold out"). */
  stockCount?: number;
}

/** Fields shared by every option, regardless of input type. */
interface BaseListingOption {
  id: string;
  name: string;
  required: boolean;
  helpText?: string;
}

/** Pick one from a predefined list. `display` hints at rendering: a
 * dropdown is compact for long lists, radios feel better for 2–4 choices. */
export interface SelectListingOption extends BaseListingOption {
  type: "select";
  choices: ListingOptionChoice[];
  display?: "dropdown" | "radio";
}

/** Pick any number from a list. */
export interface MultiSelectListingOption extends BaseListingOption {
  type: "multi-select";
  choices: ListingOptionChoice[];
  /** Optional min/max bounds on how many must be chosen */
  minSelections?: number;
  maxSelections?: number;
}

/** Short single-line write-in. */
export interface TextListingOption extends BaseListingOption {
  type: "text";
  placeholder?: string;
  maxLength?: number;
}

/** Multi-line write-in. */
export interface TextareaListingOption extends BaseListingOption {
  type: "textarea";
  placeholder?: string;
  maxLength?: number;
}

/** Numeric input with optional bounds. */
export interface NumberListingOption extends BaseListingOption {
  type: "number";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

/** File upload, e.g. commission reference image.
 *
 * NOTE — in mock mode we capture only the file's name and size; there is
 * no real upload target. When the DB + object-storage layer lands, this
 * option writes the file to storage and records a URL on the cart line. */
export interface FileListingOption extends BaseListingOption {
  type: "file";
  /** Accept hint for the file input, e.g. "image/*" or ".pdf,.png" */
  accept?: string;
  /** Max size in MB. The picker enforces client-side only. */
  maxSizeMB?: number;
}

/** Date or date-time picker, e.g. for scheduling a commission drop-off. */
export interface DatetimeListingOption extends BaseListingOption {
  type: "datetime";
  /** "date" = date only; "datetime" = date + time */
  mode?: "date" | "datetime";
  /** Optional earliest/latest bounds as ISO strings */
  min?: string;
  max?: string;
}

export type ListingOption =
  | SelectListingOption
  | MultiSelectListingOption
  | TextListingOption
  | TextareaListingOption
  | NumberListingOption
  | FileListingOption
  | DatetimeListingOption;

// ─── Listings ───────────────────────────────────────────────────────

/** How available is this listing right now?
 *
 * - "available" — the default; listing is purchasable if stock allows
 * - "sold-out" — sold out; the sold-out stamp shows in red
 * - "unavailable" — admin-paused for any reason; amber stamp
 *
 * Sold-out also happens automatically when stock is exhausted — this
 * enum lets admins override the display (or force a listing into a
 * non-purchasable state without editing stock). */
export type AvailabilityStatus =
  | "available"
  | "sold-out"
  | "unavailable";

export const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "available",
  "sold-out",
  "unavailable",
];

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  "sold-out": "Sold out",
  unavailable: "Unavailable",
};

export interface BaseListing {
  id: string;
  slug: string;
  type: ListingType;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  images: string[];
  category: string;
  tags: string[];
  featured: boolean;
  inStock: boolean;
  /** Optional admin override for listing availability. When unset,
   * availability is inferred from `inStock` and option stock. */
  availability?: AvailabilityStatus;
  /** Short "ships in X" or "ready in X" copy shown on the product page.
   * Freeform; leave empty to hide. */
  processingTime?: string;
  options?: ListingOption[];
  isPublished: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface ProductListing extends BaseListing {
  type: "product";
  sku: string;
  weightGrams?: number;
  stockCount?: number;
}

export interface ServiceListing extends BaseListing {
  type: "service";
  /** Duration in minutes. Omit when the duration is set by a shopper
   * customization option (e.g. "how many hours") rather than fixed. */
  durationMinutes?: number;
  locationType: "in-person" | "remote" | "either";
  locationLabel?: string;
}

export type Listing = ProductListing | ServiceListing;

// ─── Cart + orders ──────────────────────────────────────────────────

export interface CartItem {
  lineItemId: string;
  listingId: string;
  quantity: number;
  /** Effective per-unit price including any option price modifiers */
  priceCentsAtAdd: number;
  nameAtAdd: string;
  imageAtAdd?: string;
  typeAtAdd: ListingType;
  slugAtAdd: string;
  selectedOptions?: Array<{
    optionName: string;
    value: string;
  }>;
}

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface Session {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: UserRole;
}

/** Lifecycle of an order on the admin side. Expand as your operational
 * process gets more fine-grained. */
export type OrderStatus =
  | "placed"
  | "ready-for-pickup"
  | "shipped"
  | "refunded";

export const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "ready-for-pickup",
  "shipped",
  "refunded",
];

// ─── Discount codes ─────────────────────────────────────────────────

/** A promotional code the shopper can enter at checkout. */
export interface DiscountCode {
  id: string;
  /** Uppercase code the shopper types, e.g. "SPRING20" */
  code: string;
  /** Admin-visible short explanation, e.g. "Spring ceramics sale" */
  description: string;
  /** Discount kind — percentage or fixed amount off the subtotal */
  kind: "percent" | "fixed";
  /** For percent: 20 means 20%. For fixed: integer cents. */
  amount: number;
  /** Optional minimum subtotal in cents to apply */
  minSubtotalCents?: number;
  /** ISO expiry; if undefined, no expiry */
  expiresAt?: string;
  /** How many times this code can be redeemed total. Undefined = unlimited. */
  usageLimit?: number;
  /** Incremented each time the code is used on an order */
  timesUsed: number;
  /** Flip off without deleting to temporarily disable */
  active: boolean;
  createdAt: string;
}

/** Snapshot of an applied discount captured onto an order, so the
 * order total stays stable even if the code is later edited or deleted. */
export interface AppliedDiscount {
  code: string;
  description: string;
  kind: "percent" | "fixed";
  amount: number;
  /** Cents subtracted from the subtotal by this discount */
  discountCents: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  /** Cents subtracted from the subtotal; 0 when no discount applied */
  discountCents: number;
  /** Snapshot of the applied discount; undefined when none used */
  appliedDiscount?: AppliedDiscount;
  totalCents: number;
  placedAt: string;
  shippingAddress?: Address;
  email: string;
  status: OrderStatus;
  statusUpdatedAt: string;
  /** Admin-facing operational notes */
  notes?: string;
  /** Shopper-submitted "special instructions" captured at checkout */
  customerNotes?: string;
}

// ─── Store-wide announcement banner ─────────────────────────────────

export interface StoreAnnouncement {
  /** Whether the banner is shown at all */
  enabled: boolean;
  /** Short message shown in the banner, e.g. "Closed for firing May 1–15" */
  message: string;
  /** Visual tone of the banner */
  tone: "info" | "success" | "warning";
  /** Optional action link */
  linkLabel?: string;
  linkHref?: string;
}

// ─── Filters + helpers ──────────────────────────────────────────────

export interface ShopFilters {
  query?: string;
  category?: string;
  type?: ListingType;
  sort?: "featured" | "newest" | "price-asc" | "price-desc";
}

/** Single source of truth for "is this listing purchasable?"
 *
 * Returns true if any of:
 *  - availability is explicitly "sold-out" or "unavailable"
 *  - the inStock toggle is off
 *  - a product's explicit stockCount has hit zero
 *  - every choice on a required select/multi-select option is out of stock
 */
export function isSoldOut(listing: Listing): boolean {
  if (listing.availability === "sold-out") return true;
  if (listing.availability === "unavailable") return true;
  if (!listing.inStock) return true;
  if (
    listing.type === "product" &&
    typeof listing.stockCount === "number" &&
    listing.stockCount <= 0
  ) {
    return true;
  }
  if (listing.options) {
    for (const opt of listing.options) {
      if (!opt.required) continue;
      if (opt.type !== "select" && opt.type !== "multi-select") continue;
      const hasAvailable = opt.choices.some(
        (c) => c.stockCount === undefined || c.stockCount > 0
      );
      if (!hasAvailable) return true;
    }
  }
  return false;
}

/** The display state to use for stamps and badges, in priority order:
 *  explicit admin override → computed sold-out → available. */
export function effectiveAvailability(listing: Listing): AvailabilityStatus {
  if (listing.availability === "unavailable") return "unavailable";
  if (listing.availability === "sold-out") return "sold-out";
  // Availability set to "available" still honors computed sold-out
  // (you can't force an out-of-stock product back to available without
  // restocking).
  if (isSoldOut(listing)) return "sold-out";
  return "available";
}

/** Build a stable lineItemId for a cart entry from the listing plus
 * the chosen option values. Same listing + same options = same lineItemId,
 * so addItem() increments an existing line rather than duplicating it. */
export function buildLineItemId(
  listingId: string,
  selectedOptions?: Array<{ optionName: string; value: string }>
): string {
  if (!selectedOptions || selectedOptions.length === 0) return listingId;
  const signature = selectedOptions
    .map((s) => `${s.optionName}:${s.value}`)
    .sort()
    .join("|");
  return `${listingId}__${signature}`;
}

// ─── Storefront content (home-page editor) ──────────────────────────
//
// The home page is modeled as an ordered array of Section instances.
// Each Section is a discriminated union on `type`. Admin can add any
// number of any type, reorder freely, hide per-section, and delete
// with "one of each required type must remain" protection.
//
// A separate `announcement` banner lives above the site header and
// is NOT part of the sections array — it's site-wide, not a home-page
// block.

/** The full set of section types the page builder understands. */
export type SectionType =
  | "hero"
  | "featured"
  | "editorial"
  | "categories"
  | "promo"
  | "services"
  | "text-block"
  | "image-banner";

/** Per-type labels used in the admin UI */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  featured: "Featured listings",
  editorial: "Editorial text block",
  categories: "Category tiles",
  promo: "Promo banner",
  services: "Services spotlight",
  "text-block": "Text block",
  "image-banner": "Image banner",
};

/** Types that must have at least one instance on the page. Delete is
 * disabled when deleting would violate this constraint. */
export const REQUIRED_SECTION_TYPES: readonly SectionType[] = [
  "hero",
  "featured",
  "editorial",
  "categories",
  "promo",
  "services",
] as const;

// ─── Per-type data shapes ───────────────────────────────────────────

export interface HeroData {
  eyebrow: string;
  headline: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

export interface FeaturedData {
  title: string;
  subtitle: string;
  /** Cap on how many listings to show. Auto-pulls those flagged
   * `featured: true` on the listing itself. */
  limit: number;
}

export interface EditorialData {
  eyebrow: string;
  headline: string;
  body: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface CategoriesData {
  title: string;
}

export interface PromoData {
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface ServicesData {
  eyebrow: string;
  title: string;
  subtitle: string;
  limit: number;
}

/** Freeform text block — simpler than Editorial. No special styling
 * or "read more" conventions. */
export interface TextBlockData {
  eyebrow: string;
  headline: string;
  body: string;
  /** "left", "center" — controls alignment of the text on the page */
  alignment: "left" | "center";
}

/** Big image with optional caption and CTA. Good for seasonal
 * spotlights or "shop the new collection" placements. */
export interface ImageBannerData {
  imageUrl: string;
  imageAlt: string;
  /** Overlay tint darkens the image to make overlaid text readable */
  overlayOpacity: number;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** Which corner/edge text sits in */
  textPlacement: "center" | "left" | "right";
}

// ─── The Section union ──────────────────────────────────────────────

/** Fields every section carries. Each concrete section adds its own
 * `type` literal and `data` shape. */
interface BaseSection {
  /** Stable id generated when the section is created. Used as the key
   * for drag-reorder and React reconciliation. */
  id: string;
  /** Hidden sections don't render on the public page but stay in the
   * admin list. */
  visible: boolean;
}

export type Section =
  | (BaseSection & { type: "hero"; data: HeroData })
  | (BaseSection & { type: "featured"; data: FeaturedData })
  | (BaseSection & { type: "editorial"; data: EditorialData })
  | (BaseSection & { type: "categories"; data: CategoriesData })
  | (BaseSection & { type: "promo"; data: PromoData })
  | (BaseSection & { type: "services"; data: ServicesData })
  | (BaseSection & { type: "text-block"; data: TextBlockData })
  | (BaseSection & { type: "image-banner"; data: ImageBannerData });

// ─── Announcement banner (site-wide, not a page section) ────────────

export type AnnouncementTone = "info" | "success" | "warning";

export interface StoreAnnouncement {
  enabled: boolean;
  message: string;
  tone: AnnouncementTone;
  linkLabel?: string;
  linkHref?: string;
}

// ─── First-visit popup (site-wide, modal dialog on first session) ────

/** Curated icon set for the popup — admin picks from these. Extend
 *  by adding a name here AND adding the import + mapping in the
 *  FirstVisitPopup component. */
export type PopupIcon =
  | "shield"
  | "cookie"
  | "info"
  | "bell"
  | "sparkles"
  | "lock"
  | "heart"
  | "megaphone"
  | "warning";

export interface StorePopup {
  enabled: boolean;
  title: string;
  subtitle?: string;
  body: string;
  icon: PopupIcon;
  acceptLabel: string;
  declineLabel: string;
}

// ─── The content envelope ───────────────────────────────────────────

export interface StorefrontContent {
  sections: Section[];
  announcement: StoreAnnouncement;
  popup: StorePopup;
  updatedAt: string;
}
