/**
 * Busy seed — a much larger dataset for testing scale.
 *
 * Run with:  npm run seed:busy
 *
 * 60 listings across all categories, 40 orders in mixed statuses
 * and with varied line-item counts, 6 discount codes. Designed to
 * pressure-test:
 *   - Pagination (if/when added)
 *   - Admin tables with lots of rows
 *   - The shop grid with a realistic amount of product variety
 *   - Search/filter performance
 *   - Order list rendering
 *
 * The data is programmatically generated from base templates + random
 * variation so running it multiple times produces slightly different
 * but consistently realistic-looking shops.
 */

import {
  prisma,
  slugify,
  daysAgo,
  daysFromNow,
  pick,
  randInt,
  wipeAll,
  STOREFRONT_DEFAULTS,
  runSeed,
  Prisma,
} from "../shared";

// ─── Data templates for variety ────────────────────────────────────

const MATERIALS = [
  "Brass",
  "Oak",
  "Walnut",
  "Linen",
  "Terracotta",
  "Stoneware",
  "Waxed Canvas",
  "Merino Wool",
  "Copper",
  "Recycled Glass",
  "Olive Wood",
  "Bamboo",
  "Leather",
  "Wool",
  "Cork",
];

const PRODUCT_NOUNS = [
  { noun: "Candle", category: "Home" },
  { noun: "Planter", category: "Home" },
  { noun: "Vase", category: "Home" },
  { noun: "Bowl", category: "Home" },
  { noun: "Coaster Set", category: "Home" },
  { noun: "Mug", category: "Home" },
  { noun: "Teapot", category: "Home" },
  { noun: "Throw Blanket", category: "Home" },
  { noun: "Cushion Cover", category: "Home" },
  { noun: "Bookends", category: "Home" },
  { noun: "Notebook", category: "Stationery" },
  { noun: "Fountain Pen", category: "Stationery" },
  { noun: "Desk Pad", category: "Stationery" },
  { noun: "Letter Opener", category: "Stationery" },
  { noun: "Bookmark Set", category: "Stationery" },
  { noun: "Bar Soap", category: "Bath & Body" },
  { noun: "Bath Salts", category: "Bath & Body" },
  { noun: "Body Oil", category: "Bath & Body" },
  { noun: "Hand Cream", category: "Bath & Body" },
  { noun: "Face Mask", category: "Bath & Body" },
  { noun: "Tote Bag", category: "Apparel" },
  { noun: "Scarf", category: "Apparel" },
  { noun: "Beanie", category: "Apparel" },
  { noun: "Apron", category: "Apparel" },
  { noun: "Socks", category: "Apparel" },
];

const DESCRIPTORS = [
  "Hand-thrown, naturally unglazed, breathes with its contents.",
  "Small-batch, slow-made, built to outlast trends.",
  "Made in a one-person studio, each piece slightly unique.",
  "Sturdy enough for daily use, delicate enough to display.",
  "Natural materials, honest construction, no marketing hype.",
  "The kind of thing you'd buy once and keep for a decade.",
  "Good in the hand, better in the hand after a year of use.",
  "Finished by hand, never rushed, never automated.",
];

const SERVICE_TEMPLATES = [
  {
    name: "Pottery Wheel Intro",
    tagline: "Three hours at the wheel, take home two pieces.",
    priceCents: 9500,
    durationMinutes: 180,
    locationType: "in-person" as const,
  },
  {
    name: "Wood Turning Workshop",
    tagline: "Spoon-carving fundamentals with hand tools.",
    priceCents: 14000,
    durationMinutes: 240,
    locationType: "in-person" as const,
  },
  {
    name: "Natural Dyeing Class",
    tagline: "Dye silk scarves with indigo and madder root.",
    priceCents: 8500,
    durationMinutes: 180,
    locationType: "in-person" as const,
  },
  {
    name: "Letter Writing Circle",
    tagline: "Weekly epistolary practice, paper and pen provided.",
    priceCents: 3500,
    durationMinutes: 90,
    locationType: "in-person" as const,
  },
  {
    name: "Brand Consult (Remote)",
    tagline: "One hour on Zoom for shop owners stuck between versions.",
    priceCents: 18000,
    durationMinutes: 60,
    locationType: "remote" as const,
  },
  {
    name: "Custom Woodworking Quote",
    tagline: "Talk through your idea, get a real estimate.",
    priceCents: 5000,
    durationMinutes: undefined, // variable
    locationType: "either" as const,
  },
];

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("  Clearing existing data…");
  await wipeAll();

  // ─── Categories ──────────────────────────────────────────────────
  console.log("  Creating categories…");
  const categoryData = [
    { name: "Home", sortOrder: 1 },
    { name: "Stationery", sortOrder: 2 },
    { name: "Bath & Body", sortOrder: 3 },
    { name: "Apparel", sortOrder: 4 },
    { name: "Services", sortOrder: 5 },
  ];
  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.category.create({
        data: { ...c, slug: slugify(c.name) },
      })
    )
  );
  const byName = (n: string) => {
    const c = categories.find((x) => x.name === n);
    if (!c) throw new Error(`Category not found: ${n}`);
    return c.id;
  };

  // ─── Listings (50 products + 10 services) ────────────────────────
  console.log("  Creating ~60 listings…");

  // Generate 50 products
  const createdSlugs = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const template = pick(PRODUCT_NOUNS);
    const material = pick(MATERIALS);
    const name = `${material} ${template.noun}`;
    let slug = slugify(name);
    // Ensure slug uniqueness by appending a counter
    if (createdSlugs.has(slug)) {
      slug = `${slug}-${i}`;
    }
    createdSlugs.add(slug);

    const priceCents = randInt(1500, 35000);
    const hasCompareAt = Math.random() < 0.15;
    const isFeatured = Math.random() < 0.15;
    const isPublished = Math.random() < 0.9; // 90% published, 10% drafts
    const isUnavailable = Math.random() < 0.05;
    const isSoldOut = !isUnavailable && Math.random() < 0.08;

    await prisma.listing.create({
      data: {
        slug,
        type: "product",
        name,
        tagline: `${material.toLowerCase()} — considered, durable, daily.`,
        description: pick(DESCRIPTORS),
        priceCents,
        compareAtCents: hasCompareAt
          ? Math.round(priceCents * (1 + Math.random() * 0.3))
          : null,
        images: [`https://picsum.photos/seed/busy-${slug}/1200/1200`],
        tags: [material.toLowerCase(), template.category.toLowerCase()],
        categoryId: byName(template.category),
        featured: isFeatured,
        inStock: !isSoldOut,
        availability: isUnavailable
          ? "unavailable"
          : isSoldOut
            ? "sold-out"
            : null,
        processingTime:
          Math.random() < 0.4 ? "Ships in 2–3 business days" : null,
        isPublished,
        publishedAt: isPublished ? daysAgo(randInt(1, 120)) : null,
        createdAt: daysAgo(randInt(1, 180)),
        sku: `MER-${template.category.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        weightGrams: randInt(80, 2500),
        stockCount: isSoldOut ? 0 : randInt(1, 80),
      },
    });
  }

  // Generate 10 services
  for (let i = 0; i < 10; i++) {
    const template = pick(SERVICE_TEMPLATES);
    const suffix = i + 1;
    const name = `${template.name} · Session ${suffix}`;
    const slug = slugify(name);

    await prisma.listing.create({
      data: {
        slug,
        type: "service",
        name,
        tagline: template.tagline,
        description: pick(DESCRIPTORS),
        priceCents: template.priceCents,
        images: [`https://picsum.photos/seed/busy-svc-${i}/1200/1200`],
        tags: ["service", template.locationType],
        categoryId: byName("Services"),
        featured: Math.random() < 0.2,
        inStock: true,
        isPublished: true,
        publishedAt: daysAgo(randInt(3, 90)),
        createdAt: daysAgo(randInt(5, 120)),
        durationMinutes: template.durationMinutes ?? null,
        locationType: template.locationType,
        locationLabel:
          template.locationType === "in-person" ? "Oakland studio" : null,
      },
    });
  }

  console.log(`  ✓ Created ${await prisma.listing.count()} listings`);

  // ─── Discount codes ──────────────────────────────────────────────
  console.log("  Creating 6 discount codes…");
  await prisma.discountCode.createMany({
    data: [
      {
        code: "SPRING20",
        description: "Spring sale — 20% off sitewide",
        kind: "percent",
        amount: 20,
        timesUsed: randInt(0, 50),
        active: true,
        expiresAt: daysFromNow(30),
        createdAt: daysAgo(14),
      },
      {
        code: "SUMMER15",
        description: "Summer sale — 15% off",
        kind: "percent",
        amount: 15,
        timesUsed: randInt(0, 40),
        active: true,
        expiresAt: daysFromNow(60),
        createdAt: daysAgo(5),
      },
      {
        code: "FIRST10",
        description: "$10 off first order over $50",
        kind: "fixed",
        amount: 1000,
        minSubtotalCents: 5000,
        timesUsed: randInt(10, 100),
        active: true,
        createdAt: daysAgo(90),
      },
      {
        code: "WORKSHOP25",
        description: "25% off any workshop",
        kind: "percent",
        amount: 25,
        timesUsed: 18,
        usageLimit: 50,
        active: true,
        createdAt: daysAgo(30),
      },
      {
        code: "LASTYEAR",
        description: "Expired — kept for admin visibility",
        kind: "percent",
        amount: 10,
        timesUsed: 200,
        active: true,
        expiresAt: daysAgo(60),
        createdAt: daysAgo(365),
      },
      {
        code: "PAUSED",
        description: "Intentionally paused for now",
        kind: "percent",
        amount: 30,
        timesUsed: 0,
        active: false,
        createdAt: daysAgo(2),
      },
    ],
  });

  // ─── Orders (40, mixed statuses) ─────────────────────────────────
  console.log("  Creating 40 orders…");

  // Grab all listings for order item generation
  const allListings = await prisma.listing.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      slug: true,
      type: true,
      name: true,
      priceCents: true,
    },
  });

  const STATUSES = [
    "placed",
    "placed",
    "placed", // weighted more common
    "ready-for-pickup",
    "shipped",
    "shipped",
    "refunded",
  ] as const;

  const NAMES = [
    "Amelia Reed",
    "Jonas Vega",
    "Rosalind Kwon",
    "Diego Santos",
    "Harper Lin",
    "Marcus Ward",
    "Nadia Patel",
    "Theo Okafor",
    "Ivy Nakamura",
    "Felix Arroyo",
    "Sage Holloway",
    "Wren Castellanos",
    "Ezra Blackwood",
    "Maren Shiro",
    "Calla Benning",
    "Rhett Tamari",
    "Zinnia Park",
    "Beckett Ilves",
    "Juno Mercer",
    "Elias Kovač",
  ];

  const CITIES = [
    { city: "San Francisco", region: "CA", postalCode: "94103" },
    { city: "Oakland", region: "CA", postalCode: "94611" },
    { city: "Berkeley", region: "CA", postalCode: "94704" },
    { city: "Portland", region: "OR", postalCode: "97205" },
    { city: "Seattle", region: "WA", postalCode: "98101" },
    { city: "Austin", region: "TX", postalCode: "78701" },
    { city: "Brooklyn", region: "NY", postalCode: "11216" },
    { city: "Denver", region: "CO", postalCode: "80202" },
    { city: "Chicago", region: "IL", postalCode: "60614" },
  ];

  for (let i = 0; i < 40; i++) {
    const status = pick(STATUSES);
    const placedDaysAgo = randInt(0, 90);
    const statusChangedDaysAgo = Math.min(
      placedDaysAgo,
      Math.max(0, placedDaysAgo - randInt(1, 7))
    );
    const name = pick(NAMES);
    const firstName = name.split(" ")[0].toLowerCase();
    const lastName = name.split(" ")[1].toLowerCase();
    const email = `${firstName}.${lastName}@example.com`;
    const itemCount = randInt(1, 4);

    // Pick random listings for items
    const chosenListings: typeof allListings = [];
    for (let j = 0; j < itemCount; j++) {
      chosenListings.push(pick(allListings));
    }

    let subtotalCents = 0;
    const items = chosenListings.map((l) => {
      const quantity = randInt(1, 3);
      subtotalCents += l.priceCents * quantity;
      return {
        listingId: l.id,
        listingSlug: l.slug,
        listingType: l.type,
        nameAtAdd: l.name,
        imageAtAdd: `https://picsum.photos/seed/busy-${l.slug}/400/400`,
        priceCentsAtAdd: l.priceCents,
        quantity,
      };
    });

    const hasDiscount = Math.random() < 0.15;
    const discountCents = hasDiscount
      ? Math.round(subtotalCents * 0.15)
      : 0;
    const taxCents = Math.round((subtotalCents - discountCents) * 0.0875);
    const needsShipping = chosenListings.some((l) => l.type === "product");
    const shippingCents = needsShipping ? 795 : 0;
    const totalCents = subtotalCents - discountCents + taxCents + shippingCents;

    const addr = pick(CITIES);

    await prisma.order.create({
      data: {
        email,
        status,
        placedAt: daysAgo(placedDaysAgo),
        statusUpdatedAt: daysAgo(statusChangedDaysAgo),
        shippingAddress: needsShipping
          ? {
              name,
              line1: `${randInt(10, 999)} ${pick(["Valencia", "Mission", "Fillmore", "Ashby", "Telegraph", "Linden", "Main"])} St`,
              city: addr.city,
              region: addr.region,
              postalCode: addr.postalCode,
              country: "US",
            }
          : undefined,
        subtotalCents,
        discountCents,
        appliedDiscount: hasDiscount
          ? {
              code: "SPRING20",
              description: "Spring sale — 20% off sitewide",
              kind: "percent",
              amount: 20,
              discountCents,
            }
          : undefined,
        taxCents,
        shippingCents,
        totalCents,
        customerNotes:
          Math.random() < 0.1
            ? pick([
                "Gift — no invoice in the package please.",
                "Please leave at the door.",
                "Let me know if anything is on backorder.",
              ])
            : null,
        items: { create: items },
      },
    });
  }

  console.log(`  ✓ Created ${await prisma.order.count()} orders`);

  // ─── Storefront ──────────────────────────────────────────────────
  console.log("  Creating storefront content…");
  await prisma.storefrontContent.create({
    data: {
      id: "singleton",
      sections: STOREFRONT_DEFAULTS.sections as unknown as Prisma.InputJsonValue,
      announcement: STOREFRONT_DEFAULTS.announcement as unknown as Prisma.InputJsonValue,
      popup: STOREFRONT_DEFAULTS.popup as unknown as Prisma.InputJsonValue,
    },
  });
}

runSeed("busy", main);
