/**
 * Freeze tool — snapshot the current database as a runnable seed file.
 *
 *   npm run seed:freeze                     → writes prisma/seeds/frozen-YYYY-MM-DD.ts
 *   npm run seed:freeze -- --name mystate   → writes prisma/seeds/mystate.ts
 *
 * The output is a first-class seed file. Run it later to restore the
 * captured state:
 *
 *   tsx prisma/seeds/frozen-2026-04-19.ts
 *
 * Or add an npm script for it once you know you want to keep it:
 *
 *   "seed:mystate": "tsx prisma/seeds/mystate.ts"
 *
 * Frozen seeds are diffable, editable, and commit to git like any
 * other source file. If you want to tweak data in a frozen seed
 * (e.g. change an order status, add a listing), just edit the file.
 *
 * What it captures: every row in every table except the migration
 * history (which Prisma manages separately). Auto-generated IDs
 * and timestamps are preserved, so the frozen seed reproduces the
 * exact state — not a similar-shaped state.
 *
 * This file lives in prisma/seeds/ like the other seeds, but its
 * name is underscored (_freeze.ts) because it's a TOOL, not a
 * seed. The runner function runSeed() isn't called here.
 */

import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "./shared";

// ─── Parse CLI args ────────────────────────────────────────────────

function parseName(): string {
  const args = process.argv.slice(2);
  const nameIdx = args.indexOf("--name");
  if (nameIdx >= 0 && args[nameIdx + 1]) {
    const name = args[nameIdx + 1];
    if (!/^[a-z0-9_-]+$/i.test(name)) {
      throw new Error(
        `Invalid --name "${name}". Use only letters, numbers, dashes, underscores.`
      );
    }
    return name;
  }
  // Default: frozen-YYYY-MM-DD (use today's date in local time)
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `frozen-${yyyy}-${mm}-${dd}`;
}

// ─── Value serialization ───────────────────────────────────────────

/** Format a value as a valid TypeScript literal. Handles primitives,
 *  Dates (as `new Date("...")`), null, arrays, and plain objects
 *  recursively. Strings use JSON.stringify to get proper escaping. */
function literal(v: unknown, indent = 2): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (v instanceof Date) return `new Date("${v.toISOString()}")`;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const pad = " ".repeat(indent);
    const inner = v.map((x) => `${pad}${literal(x, indent + 2)}`).join(",\n");
    return `[\n${inner},\n${" ".repeat(indent - 2)}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const pad = " ".repeat(indent);
    const inner = entries
      .map(([k, val]) => {
        const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        return `${pad}${key}: ${literal(val, indent + 2)}`;
      })
      .join(",\n");
    return `{\n${inner},\n${" ".repeat(indent - 2)}}`;
  }
  // Fallback for anything weird
  return JSON.stringify(v);
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  const name = parseName();
  const outputPath = resolve(
    process.cwd(),
    "prisma",
    "seeds",
    "private",
    `${name}.ts`
  );

  // Refuse to overwrite by default — user must delete manually.
  if (existsSync(outputPath)) {
    throw new Error(
      `Refusing to overwrite existing file: ${outputPath}\n` +
        `Delete it first or use --name to pick a different name.`
    );
  }

  console.log(`📸 Freezing current DB state to ${outputPath}…\n`);

  // Read everything in FK-safe order for writing back later.
  console.log("  Reading categories…");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });

  console.log("  Reading listings with options and choices…");
  const listings = await prisma.listing.findMany({
    include: {
      options: {
        include: { choices: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log("  Reading orders with items…");
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { placedAt: "asc" },
  });

  console.log("  Reading discount codes…");
  const discounts = await prisma.discountCode.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log("  Reading storefront content…");
  const storefront = await prisma.storefrontContent.findUnique({
    where: { id: "singleton" },
  });

  // Build the output file.
  console.log("  Writing seed file…");

  const output = `/**
 * Frozen seed — snapshot taken ${new Date().toISOString()}.
 *
 * Reproduces the database state at freeze time. Run with:
 *
 *   npx tsx ${("prisma/seeds/private/" + name + ".ts").replace(/\\\\/g, "/")}
 *
 * Or add an npm script (if it's a canonical snapshot — don't commit
 * references to personal ones):
 *
 *   "seed:${name.replace(/^frozen-/, "")}": "tsx prisma/seeds/private/${name}.ts"
 *
 * Generated by prisma/seeds/_freeze.ts — hand-edit freely after
 * generation if you want to tweak anything.
 */

import { prisma, wipeAll, runSeed } from "../shared";
import { Prisma } from "../../../src/generated/prisma";

// Prisma JSON columns can't accept plain null — they need
// Prisma.JsonNull (a runtime sentinel) or undefined. findMany
// returns null for nullable JSON columns, so we normalize here.
const jn = (v: unknown) => (v === null ? Prisma.JsonNull : v);

// ─── Captured data ─────────────────────────────────────────────────

const CATEGORIES = ${literal(categories)};

const LISTINGS = ${literal(
    listings.map((l) => {
      // Flatten nested options+choices into a createMany-friendly shape
      // while preserving the FK relationship.
      return {
        ...l,
        options: l.options.map((o) => ({
          ...o,
          choices: o.choices,
        })),
      };
    })
  )};

const ORDERS = ${literal(orders)};

const DISCOUNTS = ${literal(discounts)};

const STOREFRONT = ${literal(storefront)};

// ─── Restore ───────────────────────────────────────────────────────

async function main() {
  console.log("  Clearing existing data…");
  await wipeAll();

  console.log("  Restoring categories…");
  for (const c of CATEGORIES) {
    await prisma.category.create({ data: c });
  }

  console.log("  Restoring listings + options + choices…");
  for (const listing of LISTINGS) {
    const { options, ...listingData } = listing;
    await prisma.listing.create({
      data: {
        ...listingData,
        options: {
          create: options.map((opt) => {
            const { choices, listingId: _listingId, ...optData } = opt;
            void _listingId; // ignore
            return {
              ...optData,
              config: jn(optData.config),
              choices: {
                create: choices.map((ch) => {
                  const { optionId: _optionId, ...chData } = ch;
                  void _optionId;
                  return chData;
                }),
              },
            };
          }),
        },
      },
    });
  }

  console.log("  Restoring orders + items…");
  for (const order of ORDERS) {
    const { items, ...orderData } = order;
    await prisma.order.create({
      data: {
        ...orderData,
        appliedDiscount: jn(orderData.appliedDiscount),
        shippingAddress: jn(orderData.shippingAddress),
        items: {
          create: items.map((it) => {
            const { orderId: _orderId, ...itData } = it;
            void _orderId;
            return {
              ...itData,
              selectedOptions: jn(itData.selectedOptions),
            };
          }),
        },
      },
    });
  }

  console.log("  Restoring discount codes…");
  for (const d of DISCOUNTS) {
    await prisma.discountCode.create({ data: d });
  }

  if (STOREFRONT) {
    console.log("  Restoring storefront content…");
    const { updatedAt: _updatedAt, ...sfData } = STOREFRONT;
    void _updatedAt;
    await prisma.storefrontContent.create({
      data: {
        ...sfData,
        popup: jn(sfData.popup),
      },
    });
  }
}

runSeed("${name}", main);
`;

  writeFileSync(outputPath, output, "utf8");

  console.log(`\n✓ Frozen seed written to prisma/seeds/${name}.ts`);
  console.log(`\n  Counts captured:`);
  console.log(`    Categories  : ${categories.length}`);
  console.log(`    Listings    : ${listings.length}`);
  console.log(
    `    Options     : ${listings.reduce((s, l) => s + l.options.length, 0)}`
  );
  console.log(
    `    Choices     : ${listings.reduce(
      (s, l) => s + l.options.reduce((s2, o) => s2 + o.choices.length, 0),
      0
    )}`
  );
  console.log(`    Orders      : ${orders.length}`);
  console.log(
    `    Order items : ${orders.reduce((s, o) => s + o.items.length, 0)}`
  );
  console.log(`    Discounts   : ${discounts.length}`);
  console.log(`    Storefront  : ${storefront ? 1 : 0}`);
  console.log(`\n  Run with:  npx tsx prisma/seeds/private/${name}.ts`);
}

main()
  .catch((e) => {
    console.error("\n❌ Freeze failed:\n", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
