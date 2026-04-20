/**
 * Empty seed — wipes the database down to nothing.
 *
 * Run with:  npm run seed:empty
 *
 * Use this to test first-run / empty-state UX. The storefront
 * singleton row is still created (the home page needs the sections
 * array to not crash) but no categories, no listings, no orders, no
 * discounts.
 *
 * What to click through to exercise empty states:
 *   /shop           → "No listings found" empty state
 *   /admin/listings → "No listings yet" call-to-action
 *   /admin/orders   → "No orders yet"
 *   /admin          → dashboard counters all read zero
 *   /               → storefront shows but featured/categories/
 *                    services sections render nothing (by design —
 *                    they auto-hide when there's no data)
 */

import {
  prisma,
  wipeAll,
  writeStoreConfig,
  STOREFRONT_DEFAULTS,
  runSeed,
  Prisma,
} from "../shared";

async function main() {
  console.log("  Clearing existing data…");
  await wipeAll();
  // Seeds one StoreConfig row. Same mechanic as `prisma.X.create()`
  // used for other tables — just wrapped in a helper because there's
  // always exactly one row (singleton) and most seeds only want to
  // override a few fields. `writeStoreConfig()` with no args uses
  // STORE_CONFIG_DEFAULTS unchanged; pass an object to override.
  await writeStoreConfig();

  console.log("  Creating storefront content (singleton only)…");
  await prisma.storefrontContent.create({
    data: {
      id: "singleton",
      sections: STOREFRONT_DEFAULTS.sections as unknown as Prisma.InputJsonValue,
      announcement: STOREFRONT_DEFAULTS.announcement as unknown as Prisma.InputJsonValue,
      popup: STOREFRONT_DEFAULTS.popup as unknown as Prisma.InputJsonValue,
    },
  });
}

runSeed("empty", main);
