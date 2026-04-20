/**
 * Shared helpers for all seed scripts.
 *
 * Every seed in prisma/seeds/**.ts imports from here. The PrismaClient
 * singleton, the wipe-everything routine, date helpers, default
 * content, and the store-config writer live here.
 */

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Prisma } from "../../src/generated/prisma";
import type { StoreConfig } from "../../src/lib/types";
import { STOREFRONT_DEFAULTS } from "../../src/lib/default-storefront";
import { STORE_CONFIG_DEFAULTS } from "../../src/lib/default-store-config";

// Re-export the Prisma namespace so seeds can use it (for
// Prisma.InputJsonValue, Prisma.JsonNull, etc.) without a second
// import path.
export { Prisma };

// Re-export defaults so seeds can import both names from shared.
export { STOREFRONT_DEFAULTS, STORE_CONFIG_DEFAULTS };
/** Legacy alias — predates the rename of MOCK_STOREFRONT. */
export const DEFAULT_STOREFRONT_DATA = STOREFRONT_DEFAULTS;

// ─── Prisma client (same adapter setup the app uses) ──────────────

function makePrisma(): PrismaClient {
  const url = new URL(process.env.DATABASE_URL!);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

export const prisma = makePrisma();

// ─── Small helpers ─────────────────────────────────────────────────

export const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

export const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 24 * 60 * 60 * 1000);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Pick a random element from an array. Useful for generating variety
 *  in the busy seed without carefully curating every row. */
export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random integer in [min, max] inclusive. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Wipe routine ──────────────────────────────────────────────────

/** Delete all rows from all tables in foreign-key-safe order.
 *  Every seed starts by calling this so runs are idempotent. */
export async function wipeAll() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listingOptionChoice.deleteMany();
  await prisma.listingOption.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.storefrontContent.deleteMany();
  await prisma.storeConfig.deleteMany();
}

// ─── Store config writer ───────────────────────────────────────────

/**
 * Convenience helper for seeds — writes the StoreConfig singleton
 * row, merging the given overrides on top of STORE_CONFIG_DEFAULTS.
 *
 * Usage in a seed:
 *
 *   await writeStoreConfig();  // use defaults unchanged
 *
 *   await writeStoreConfig({
 *     name: "ZoomMart",
 *     tagline: "Everything fast, nothing fussy.",
 *     supportEmail: "hi@zoommart.example",
 *   });
 *
 * Missing fields fall through to defaults. Every seed should call
 * this exactly once (after wipeAll) so the storefront has an
 * identity to render.
 */
export async function writeStoreConfig(
  overrides: Partial<StoreConfig> = {}
): Promise<void> {
  const config: StoreConfig = { ...STORE_CONFIG_DEFAULTS, ...overrides };
  await prisma.storeConfig.create({
    data: {
      id: "singleton",
      data: config as unknown as Prisma.InputJsonValue,
    },
  });
}

// ─── Seed runner wrapper ───────────────────────────────────────────

/** Wraps a seed's main() with standard logging + disconnect. Each
 *  seed exports its own main() and calls this at the bottom. */
export async function runSeed(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  console.log(`🌱 Seeding (${name})…\n`);
  try {
    await fn();
    console.log(`\n✓ Seed complete (${name}).\n`);
    console.log("  Categories  :", await prisma.category.count());
    console.log("  Listings    :", await prisma.listing.count());
    console.log("  Options     :", await prisma.listingOption.count());
    console.log("  Choices     :", await prisma.listingOptionChoice.count());
    console.log("  Orders      :", await prisma.order.count());
    console.log("  Order items :", await prisma.orderItem.count());
    console.log("  Discounts   :", await prisma.discountCode.count());
    console.log("  Storefront  :", await prisma.storefrontContent.count());
    console.log("  Store config:", await prisma.storeConfig.count());
  } catch (e) {
    console.error(`\n❌ Seed failed (${name}):\n`, e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
