/**
 * Central store configuration.
 * Change values here to rename the store, tweak currency, etc.
 */
export const STORE = {
  name: "MyStore",
  tagline: "Thoughtfully made goods and services for a considered life.",
  description:
    "MyStore is a small storefront featuring curated goods and hand-picked services.",
  currency: "USD",
  currencySymbol: "$",
  locale: "en-US",
  supportEmail: "hello@mystore.example",
  // Tax rate for the fake checkout (e.g. 0.0875 = 8.75%)
  taxRate: 0.0875,
  // Flat shipping rate in cents; set to 0 for free shipping
  flatShippingCents: 795,
  // Cart items under this count get free shipping thresholds, etc.
  freeShippingOverCents: 10000,
} as const;
