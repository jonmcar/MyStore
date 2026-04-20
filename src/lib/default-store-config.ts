import type { StoreConfig } from "./types";

/**
 * Default store config.
 *
 * Used as:
 *   - Fallback when the DB has no StoreConfig row (fresh install)
 *   - Starting content for seeds that don't specify their own
 *   - Reference point for the admin "reset to defaults" action
 *
 * Seeds can override any subset of these fields. Everything not
 * overridden falls through to these values.
 *
 * To rebrand the app wholesale (new name, tagline, etc.), change
 * these values and run a seed. Or edit live via /admin/settings.
 */
export const STORE_CONFIG_DEFAULTS: StoreConfig = {
  // Branding
  name: "MyStore",
  tagline: "Thoughtfully made goods and services for a considered life.",
  description:
    "A small storefront featuring curated goods and hand-picked services.",
  supportEmail: "hello@mystore.example",
  copyrightText: "All rights reserved.",

  // Commerce (scaffolding)
  taxRate: 0.0875,
  flatShippingCents: 795,
  freeShippingOverCents: 10000,
};
