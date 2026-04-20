/**
 * Shared helpers for all seed scripts.
 *
 * Every seed in prisma/seeds/*.ts imports from here. The PrismaClient
 * singleton, the wipe-everything routine, date helpers, and slugify
 * live here once instead of being duplicated across each seed.
 */

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Prisma } from "../../src/generated/prisma";

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

export { Prisma };
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
}

// ─── Default storefront content ────────────────────────────────────

/** The baseline storefront content. Imported from the app's
 *  canonical defaults file so seeds and runtime code share one
 *  source of truth. Re-exported under the original name so existing
 *  seed imports keep working. */
import { STOREFRONT_DEFAULTS } from "../../src/lib/default-storefront";
export const DEFAULT_STOREFRONT_DATA = STOREFRONT_DEFAULTS;
export { STOREFRONT_DEFAULTS };

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
    console.log("  Categories :", await prisma.category.count());
    console.log("  Listings   :", await prisma.listing.count());
    console.log("  Options    :", await prisma.listingOption.count());
    console.log("  Choices    :", await prisma.listingOptionChoice.count());
    console.log("  Orders     :", await prisma.order.count());
    console.log("  Order items:", await prisma.orderItem.count());
    console.log("  Discounts  :", await prisma.discountCode.count());
    console.log("  Storefront :", await prisma.storefrontContent.count());
  } catch (e) {
    console.error(`\n❌ Seed failed (${name}):\n`, e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
