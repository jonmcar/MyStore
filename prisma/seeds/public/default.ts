/**
 * Default seed — the baseline test dataset.
 *
 * Run with:  npm run seed:default  (or: npx prisma db seed)
 *
 * 15 listings across 5 categories, a handful of orders in mixed
 * statuses, 4 discount codes, and the standard storefront content.
 * Safe to re-run whenever you want a clean slate; wipes all existing
 * rows first.
 */

import {
  prisma,
  slugify,
  daysAgo,
  daysFromNow,
  wipeAll,
  STOREFRONT_DEFAULTS,
  runSeed,
  Prisma,
} from "../shared";

async function main() {
  console.log("  Clearing existing data…");
  await wipeAll();

  // ─── Categories ───────────────────────────────────────────────────
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

  // ─── Listings ─────────────────────────────────────────────────────
  // Each listing is created in its own call because we want to also
  // create nested options + choices in one transaction per listing.
  console.log("  Creating listings…");

  // 1. Terracotta planter (product, simple)
  await prisma.listing.create({
    data: {
      slug: "terracotta-tabletop-planter",
      type: "product",
      name: "Terracotta Tabletop Planter",
      tagline: "Hand-thrown, naturally unglazed, breathes with your plants.",
      description:
        "Six inches wide, four tall, drainage hole included. Each one is thrown on the wheel so no two are identical — small variations in shape and color are part of the appeal. Pairs well with a trailing pothos or a small snake plant.",
      priceCents: 4800,
      images: [
        "https://picsum.photos/seed/meridian-planter-1/1200/1200",
        "https://picsum.photos/seed/meridian-planter-2/1200/1200",
      ],
      tags: ["ceramics", "handmade", "plants"],
      categoryId: byName("Home"),
      featured: true,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(12),
      publishedAt: daysAgo(12),
      sku: "MER-HOM-001",
      weightGrams: 720,
      stockCount: 14,
      processingTime: "Ships in 2–3 business days",
    },
  });

  // 2. Linen dish towels (product)
  await prisma.listing.create({
    data: {
      slug: "linen-dish-towel-set",
      type: "product",
      name: "Stonewashed Linen Dish Towels (Set of 2)",
      tagline: "Softer with every wash, naturally lint-free.",
      description:
        "Two 18x28 inch towels in heavyweight stonewashed linen, natural flax. They absorb like a champion and dry faster than you'd expect. Made in Lithuania from European flax.",
      priceCents: 3600,
      images: ["https://picsum.photos/seed/meridian-linen-1/1200/1200"],
      tags: ["linen", "kitchen", "sustainable"],
      categoryId: byName("Home"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(30),
      publishedAt: daysAgo(30),
      sku: "MER-HOM-002",
      weightGrams: 240,
      stockCount: 45,
    },
  });

  // 3. Brass desk lamp (product, featured)
  await prisma.listing.create({
    data: {
      slug: "brass-desk-lamp",
      type: "product",
      name: "Articulated Brass Desk Lamp",
      tagline: "Warm task lighting with a mid-century posture.",
      description:
        "Solid brass, two-joint articulation, E26 socket, ships with a 40-watt warm-white LED. The finish patinas beautifully over the years — a clear coat would prevent this and we've deliberately left it off. 6-foot cloth-wrapped cord.",
      priceCents: 24800,
      compareAtCents: 29800,
      images: [
        "https://picsum.photos/seed/meridian-lamp-1/1200/1200",
        "https://picsum.photos/seed/meridian-lamp-2/1200/1200",
        "https://picsum.photos/seed/meridian-lamp-3/1200/1200",
      ],
      tags: ["brass", "lighting", "desk"],
      categoryId: byName("Home"),
      featured: true,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(3),
      publishedAt: daysAgo(3),
      sku: "MER-HOM-003",
      weightGrams: 2800,
      stockCount: 6,
      processingTime: "Ships in 5–7 business days (made to order)",
    },
  });

  // 4. Marbled notebook (product, simple)
  await prisma.listing.create({
    data: {
      slug: "marbled-cover-notebook",
      type: "product",
      name: "Marbled Cover Notebook, A5",
      tagline: "Italian marbled paper, blank pages, lays flat.",
      description:
        "192 blank pages of 100gsm Munken cream paper, smyth-sewn binding so it lays flat from day one. The cover is genuine Florentine marbled paper, each one slightly different. Fountain-pen friendly, ghost minimally, bleed never.",
      priceCents: 3400,
      images: ["https://picsum.photos/seed/meridian-notebook-1/1200/1200"],
      tags: ["paper", "writing", "italy"],
      categoryId: byName("Stationery"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(45),
      publishedAt: daysAgo(45),
      sku: "MER-STN-001",
      weightGrams: 260,
      stockCount: 88,
      processingTime: "Ships in 1–2 business days",
    },
  });

  // 5. Fountain pen (product with options — the most complex one)
  await prisma.listing.create({
    data: {
      slug: "fountain-pen-converter",
      type: "product",
      name: "Demonstrator Fountain Pen, Medium Nib",
      tagline: "Clear resin, stainless nib, converter-filled.",
      description:
        "Clear acrylic body so you can watch the ink. Stainless steel nib, medium by default but we can swap to fine or extra-fine on request — just leave a note. Comes with a converter (for bottled ink) and two international short cartridges in walnut sepia to get you started.",
      priceCents: 5400,
      images: [
        "https://picsum.photos/seed/meridian-pen-1/1200/1200",
        "https://picsum.photos/seed/meridian-pen-2/1200/1200",
      ],
      tags: ["writing", "fountain pen", "gift"],
      categoryId: byName("Stationery"),
      featured: true,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(8),
      publishedAt: daysAgo(8),
      sku: "MER-STN-002",
      weightGrams: 22,
      stockCount: 40,
      processingTime: "Ships in 1–2 business days",
      options: {
        create: [
          {
            type: "select",
            name: "Nib size",
            required: true,
            sortOrder: 0,
            config: { display: "dropdown" },
            choices: {
              create: [
                { label: "Extra fine", sortOrder: 0 },
                { label: "Fine", sortOrder: 1 },
                { label: "Medium", sortOrder: 2 },
                { label: "Broad", priceModifierCents: 1500, sortOrder: 3 },
              ],
            },
          },
          {
            type: "select",
            name: "Starter ink cartridge",
            required: false,
            sortOrder: 1,
            config: { display: "dropdown" },
            choices: {
              create: [
                { label: "Walnut sepia", sortOrder: 0 },
                { label: "Midnight blue", sortOrder: 1 },
                { label: "Forest green", sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 6. Cedar soap (product)
  await prisma.listing.create({
    data: {
      slug: "cedar-bath-soap",
      type: "product",
      name: "Cedar + Black Pepper Bar Soap",
      tagline: "Cold-process, palm-oil free, 4 oz bars.",
      description:
        "Olive, coconut, castor, and shea with cedarwood and black pepper essential oils. Cures for six weeks before shipping. Hard, long-lasting bar with a dense, creamy lather. Unlabeled by design — no plastic, no paper to recycle.",
      priceCents: 1400,
      images: ["https://picsum.photos/seed/meridian-soap-1/1200/1200"],
      tags: ["soap", "cedar", "handmade"],
      categoryId: byName("Bath & Body"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(22),
      publishedAt: daysAgo(22),
      sku: "MER-BTH-001",
      weightGrams: 115,
      stockCount: 120,
    },
  });

  // 7. Wool throw (product, marked unavailable)
  await prisma.listing.create({
    data: {
      slug: "wool-throw-charcoal",
      type: "product",
      name: "Merino Wool Throw, Charcoal",
      tagline: "50x70, lambswool, heavy enough to mean business.",
      description:
        "Woven in small runs from 100% merino lambswool, finished with hand-knotted fringe. The charcoal is deep and slightly heathered — not a flat gray. Heavier than most throws: comfortable over your legs reading, warm enough for a bed on cold nights.",
      priceCents: 18800,
      images: ["https://picsum.photos/seed/meridian-throw-1/1200/1200"],
      tags: ["wool", "textile", "winter"],
      categoryId: byName("Home"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(18),
      publishedAt: daysAgo(18),
      sku: "MER-HOM-004",
      weightGrams: 1400,
      stockCount: 9,
      availability: "unavailable",
    },
  });

  // 8. Canvas tote (product with options — radio display, per-choice stock)
  await prisma.listing.create({
    data: {
      slug: "canvas-market-tote",
      type: "product",
      name: "Waxed Canvas Market Tote",
      tagline: "18-oz canvas, leather handles, ages into something better.",
      description:
        "Heavyweight 18-ounce cotton canvas, lightly waxed so it sheds a light rain. Handles are vegetable-tanned leather that darkens and softens with use. No interior pockets — we find they just add weight. Holds a surprising amount.",
      priceCents: 7800,
      images: ["https://picsum.photos/seed/meridian-tote-1/1200/1200"],
      tags: ["canvas", "bag", "daily carry"],
      categoryId: byName("Apparel"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(6),
      publishedAt: daysAgo(6),
      sku: "MER-APP-001",
      weightGrams: 680,
      stockCount: 20,
      options: {
        create: [
          {
            type: "select",
            name: "Canvas color",
            required: true,
            sortOrder: 0,
            config: { display: "radio" },
            choices: {
              create: [
                { label: "Natural", stockCount: 12, sortOrder: 0 },
                { label: "Faded olive", stockCount: 0, sortOrder: 1 },
                { label: "Charcoal", stockCount: 8, sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 9. Wool beanie (product, sold out via stockCount)
  await prisma.listing.create({
    data: {
      slug: "hand-knit-wool-beanie",
      type: "product",
      name: "Hand-Knit Wool Beanie",
      tagline: "Ribbed, generous length so you can cuff it twice.",
      description:
        "Chunky hand-knit in 100% un-dyed Peruvian highland wool. Generous cuff so you can wear it slouchy or cuffed twice for a closer fit. Unisex, one size fits most. Expect a loose gauge — this is by design; it drapes rather than clings.",
      priceCents: 6400,
      images: ["https://picsum.photos/seed/meridian-beanie-1/1200/1200"],
      tags: ["wool", "winter", "knit"],
      categoryId: byName("Apparel"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(38),
      publishedAt: daysAgo(38),
      sku: "MER-APP-002",
      weightGrams: 160,
      stockCount: 0,
    },
  });

  // 10. Pottery class (service, featured)
  await prisma.listing.create({
    data: {
      slug: "pottery-wheel-intro-class",
      type: "service",
      name: "Intro to Wheel Throwing — Group Class",
      tagline: "Three hours, four students max, clay and firing included.",
      description:
        "A focused first session on the wheel: centering, opening, pulling, trimming. Four students per class so you get real attention. Two pieces per student to keep after firing, plus bisque and glaze firing included. We'll email to schedule your glaze-firing pickup about three weeks later.",
      priceCents: 9500,
      images: [
        "https://picsum.photos/seed/meridian-class-1/1200/1200",
        "https://picsum.photos/seed/meridian-class-2/1200/1200",
      ],
      tags: ["pottery", "class", "in-person"],
      categoryId: byName("Services"),
      featured: true,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(15),
      publishedAt: daysAgo(15),
      durationMinutes: 180,
      locationType: "in-person",
      locationLabel: "Oakland studio",
      options: {
        create: [
          {
            type: "select",
            name: "Session",
            required: true,
            sortOrder: 0,
            config: { display: "dropdown" },
            choices: {
              create: [
                { label: "Saturday 10am", sortOrder: 0 },
                { label: "Saturday 2pm", sortOrder: 1 },
                { label: "Sunday 10am", sortOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });

  // 11. Remote consult (service, no duration needed — but has one for simplicity)
  await prisma.listing.create({
    data: {
      slug: "brand-consult-hour",
      type: "service",
      name: "Small-Shop Brand Consult",
      tagline: "One hour on Zoom for shop owners stuck between versions.",
      description:
        "An hour of focused conversation about your storefront, your brand voice, and what's confusing your customers. I take notes live, send them afterward with recommendations prioritized by effort vs. impact. No slides, no templates — just one hour of specific, practical advice.",
      priceCents: 18000,
      images: ["https://picsum.photos/seed/meridian-consult-1/1200/1200"],
      tags: ["consult", "branding", "remote"],
      categoryId: byName("Services"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(28),
      publishedAt: daysAgo(28),
      durationMinutes: 60,
      locationType: "remote",
    },
  });

  // 12. Leather repair (service, variable duration, complex options)
  await prisma.listing.create({
    data: {
      slug: "leather-goods-repair",
      type: "service",
      name: "Leather Goods Repair (Drop-off)",
      tagline: "Re-stitching, edge re-finishing, honest quotes.",
      description:
        "Drop off a well-loved bag, wallet, or belt and we'll assess it. Most repairs are under $80 — re-stitching a seam, re-finishing an edge, replacing a button stud. We won't take on a job we don't think is worth doing. Bring it in during studio hours (Tuesday through Saturday, 11 to 6) or arrange a mailing slot through the options below.",
      priceCents: 4000,
      images: ["https://picsum.photos/seed/meridian-repair-1/1200/1200"],
      tags: ["leather", "repair", "craft"],
      categoryId: byName("Services"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(55),
      publishedAt: daysAgo(55),
      // durationMinutes omitted — variable
      locationType: "in-person",
      locationLabel: "Oakland studio",
      options: {
        create: [
          {
            type: "select",
            name: "What are you bringing in?",
            required: true,
            sortOrder: 0,
            config: { display: "dropdown" },
            choices: {
              create: [
                { label: "Wallet or small leather", sortOrder: 0 },
                { label: "Belt", sortOrder: 1 },
                { label: "Bag or purse", sortOrder: 2 },
                { label: "Other — describe below", sortOrder: 3 },
              ],
            },
          },
          {
            type: "textarea",
            name: "Describe the repair",
            required: true,
            sortOrder: 1,
            config: {
              placeholder: "Seam blown, broken strap, edge frayed — just tell us what happened.",
              maxLength: 500,
            },
          },
          {
            type: "text",
            name: "Your name for the ticket",
            required: true,
            sortOrder: 2,
            config: { placeholder: "First name is fine", maxLength: 60 },
          },
          {
            type: "multi-select",
            name: "Add-ons",
            required: false,
            sortOrder: 3,
            helpText: "Pick any extras. Each is billed on top of the base repair.",
            choices: {
              create: [
                { label: "Full leather conditioning", priceModifierCents: 1500, sortOrder: 0 },
                { label: "Re-finish exposed edges", priceModifierCents: 2500, sortOrder: 1 },
                { label: "Rush turnaround (3 business days)", priceModifierCents: 4000, sortOrder: 2 },
              ],
            },
          },
          {
            type: "file",
            name: "Reference photo",
            required: false,
            sortOrder: 4,
            helpText: "A photo of the damage speeds up the assessment.",
            config: { accept: "image/*", maxSizeMB: 5 },
          },
          {
            type: "datetime",
            name: "Preferred drop-off date",
            required: false,
            sortOrder: 5,
            helpText: "We'll confirm over email; studio hours are Tue–Sat 11am–6pm.",
            config: { mode: "date" },
          },
        ],
      },
    },
  });

  // 13. Candle (product)
  await prisma.listing.create({
    data: {
      slug: "beeswax-pillar-candle",
      type: "product",
      name: "Beeswax Pillar Candle, 3\"",
      tagline: "Solid beeswax, cotton wick, burns about 60 hours.",
      description:
        "Pure American beeswax — no paraffin, no additives. Natural honey scent that isn't overwhelming. Three inches in diameter, five tall. Burns slowly with a warm, golden flame. Each one has slight surface variations (the 'bloom') that are a sign of pure beeswax; don't wipe it off.",
      priceCents: 2200,
      images: ["https://picsum.photos/seed/meridian-candle-1/1200/1200"],
      tags: ["beeswax", "candle", "gift"],
      categoryId: byName("Home"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(19),
      publishedAt: daysAgo(19),
      sku: "MER-HOM-005",
      weightGrams: 380,
      stockCount: 52,
    },
  });

  // 14. Draft listing (not published — to demo admin drafts view)
  await prisma.listing.create({
    data: {
      slug: "ceramic-mug-set-draft",
      type: "product",
      name: "Ceramic Mug Set, 4 (Draft)",
      tagline: "Tapered, thumb-notch handle, 12oz.",
      description:
        "Draft listing — photography still in progress. Set of four hand-thrown mugs with a subtle tapered profile and a thumb-notch on the handle for comfort. 12oz capacity. Finish TBD.",
      priceCents: 11200,
      images: ["https://picsum.photos/seed/meridian-mug-draft/1200/1200"],
      tags: ["ceramics", "mug", "drinkware"],
      categoryId: byName("Home"),
      featured: false,
      inStock: true,
      isPublished: false,
      createdAt: daysAgo(1),
      sku: "MER-HOM-006",
      weightGrams: 1200,
      stockCount: 5,
    },
  });

  // 15. Apron (product)
  await prisma.listing.create({
    data: {
      slug: "heavyweight-apron",
      type: "product",
      name: "Heavyweight Linen Apron",
      tagline: "Cross-back straps, one chest pocket, two hip pockets.",
      description:
        "Substantial natural linen that softens beautifully with washing. Cross-back straps distribute weight so your neck doesn't complain after a long day. One chest pocket for a pen or thermometer, two hip pockets sized for small tools. Fits adults 5'2\" to 6'4\".",
      priceCents: 8800,
      images: ["https://picsum.photos/seed/meridian-apron-1/1200/1200"],
      tags: ["linen", "kitchen", "apron"],
      categoryId: byName("Apparel"),
      featured: false,
      inStock: true,
      isPublished: true,
      createdAt: daysAgo(50),
      publishedAt: daysAgo(50),
      sku: "MER-APP-003",
      weightGrams: 320,
      stockCount: 28,
    },
  });

  console.log(`  ✓ Created ${await prisma.listing.count()} listings`);

  // ─── Discount codes ───────────────────────────────────────────────
  console.log("  Creating discount codes…");
  await prisma.discountCode.createMany({
    data: [
      {
        code: "SPRING20",
        description: "Spring ceramics sale — 20% off everything",
        kind: "percent",
        amount: 20,
        timesUsed: 3,
        active: true,
        expiresAt: daysFromNow(30),
        createdAt: daysAgo(14),
      },
      {
        code: "FIRST10",
        description: "First-order welcome, $10 off orders over $50",
        kind: "fixed",
        amount: 1000,
        minSubtotalCents: 5000,
        timesUsed: 17,
        active: true,
        createdAt: daysAgo(60),
      },
      {
        code: "WORKSHOP15",
        description: "15% off any workshop — used up",
        kind: "percent",
        amount: 15,
        timesUsed: 25,
        usageLimit: 25,
        active: true,
        expiresAt: daysAgo(5),
        createdAt: daysAgo(90),
      },
      {
        code: "FRIENDS25",
        description: "25% off — currently paused",
        kind: "percent",
        amount: 25,
        timesUsed: 0,
        active: false,
        createdAt: daysAgo(2),
      },
    ],
  });

  // ─── Orders ───────────────────────────────────────────────────────
  // Look up listing IDs by slug so we can embed them in order items.
  console.log("  Creating orders…");
  const listingsBySlug = Object.fromEntries(
    (await prisma.listing.findMany({ select: { id: true, slug: true } })).map(
      (l) => [l.slug, l.id]
    )
  );

  // Order 1: new placed order
  await prisma.order.create({
    data: {
      email: "amelia.reed@example.com",
      status: "placed",
      placedAt: daysAgo(1),
      statusUpdatedAt: daysAgo(1),
      shippingAddress: {
        name: "Amelia Reed",
        line1: "412 Valencia St",
        city: "San Francisco",
        region: "CA",
        postalCode: "94103",
        country: "US",
      },
      subtotalCents: 13200,
      discountCents: 0,
      taxCents: 1155,
      shippingCents: 0,
      totalCents: 14355,
      items: {
        create: [
          {
            listingId: listingsBySlug["terracotta-tabletop-planter"],
            listingSlug: "terracotta-tabletop-planter",
            listingType: "product",
            nameAtAdd: "Terracotta Tabletop Planter",
            imageAtAdd: "https://picsum.photos/seed/meridian-planter-1/400/400",
            priceCentsAtAdd: 4800,
            quantity: 2,
          },
          {
            listingId: listingsBySlug["linen-dish-towel-set"],
            listingSlug: "linen-dish-towel-set",
            listingType: "product",
            nameAtAdd: "Stonewashed Linen Dish Towels (Set of 2)",
            imageAtAdd: "https://picsum.photos/seed/meridian-linen-1/400/400",
            priceCentsAtAdd: 3600,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Order 2: shipped order, with option-modifier pricing captured
  await prisma.order.create({
    data: {
      email: "jonas.vega@example.com",
      status: "shipped",
      placedAt: daysAgo(4),
      statusUpdatedAt: daysAgo(2),
      shippingAddress: {
        name: "Jonas Vega",
        line1: "87 Baldwin Ave",
        line2: "Unit 3",
        city: "Brooklyn",
        region: "NY",
        postalCode: "11216",
        country: "US",
      },
      subtotalCents: 6900,
      discountCents: 0,
      taxCents: 603,
      shippingCents: 795,
      totalCents: 8298,
      items: {
        create: [
          {
            listingId: listingsBySlug["fountain-pen-converter"],
            listingSlug: "fountain-pen-converter",
            listingType: "product",
            nameAtAdd: "Demonstrator Fountain Pen, Medium Nib",
            imageAtAdd: "https://picsum.photos/seed/meridian-pen-1/400/400",
            priceCentsAtAdd: 6900, // 5400 base + 1500 broad nib
            quantity: 1,
            selectedOptions: [
              { optionName: "Nib size", value: "Broad" },
              { optionName: "Starter ink cartridge", value: "Walnut sepia" },
            ],
          },
        ],
      },
    },
  });

  // Order 3: ready for pickup service
  await prisma.order.create({
    data: {
      email: "rosalind.kwon@example.com",
      status: "ready-for-pickup",
      placedAt: daysAgo(6),
      statusUpdatedAt: daysAgo(1),
      subtotalCents: 9500,
      discountCents: 0,
      taxCents: 831,
      shippingCents: 0,
      totalCents: 10331,
      notes: "Paid in full. Materials set aside.",
      items: {
        create: [
          {
            listingId: listingsBySlug["pottery-wheel-intro-class"],
            listingSlug: "pottery-wheel-intro-class",
            listingType: "service",
            nameAtAdd: "Intro to Wheel Throwing — Group Class",
            imageAtAdd: "https://picsum.photos/seed/meridian-class-1/400/400",
            priceCentsAtAdd: 9500,
            quantity: 1,
            selectedOptions: [{ optionName: "Session", value: "Saturday 10am" }],
          },
        ],
      },
    },
  });

  // Order 4: shipped lamp
  await prisma.order.create({
    data: {
      email: "diego.santos@example.com",
      status: "shipped",
      placedAt: daysAgo(9),
      statusUpdatedAt: daysAgo(7),
      shippingAddress: {
        name: "Diego Santos",
        line1: "2201 Fillmore St",
        city: "San Francisco",
        region: "CA",
        postalCode: "94115",
        country: "US",
      },
      subtotalCents: 24800,
      discountCents: 0,
      taxCents: 2170,
      shippingCents: 0,
      totalCents: 26970,
      items: {
        create: [
          {
            listingId: listingsBySlug["brass-desk-lamp"],
            listingSlug: "brass-desk-lamp",
            listingType: "product",
            nameAtAdd: "Articulated Brass Desk Lamp",
            imageAtAdd: "https://picsum.photos/seed/meridian-lamp-1/400/400",
            priceCentsAtAdd: 24800,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Order 5: refunded
  await prisma.order.create({
    data: {
      email: "harper.lin@example.com",
      status: "refunded",
      placedAt: daysAgo(14),
      statusUpdatedAt: daysAgo(10),
      shippingAddress: {
        name: "Harper Lin",
        line1: "33 Linwood Ave",
        city: "Oakland",
        region: "CA",
        postalCode: "94611",
        country: "US",
      },
      subtotalCents: 18800,
      discountCents: 0,
      taxCents: 1645,
      shippingCents: 0,
      totalCents: 20445,
      notes: "Customer reported receiving wrong color. Full refund issued.",
      items: {
        create: [
          {
            listingId: listingsBySlug["wool-throw-charcoal"],
            listingSlug: "wool-throw-charcoal",
            listingType: "product",
            nameAtAdd: "Merino Wool Throw, Charcoal",
            imageAtAdd: "https://picsum.photos/seed/meridian-throw-1/400/400",
            priceCentsAtAdd: 18800,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Order 6: multi-item with customer notes
  await prisma.order.create({
    data: {
      email: "marcus.ward@example.com",
      status: "placed",
      placedAt: daysAgo(2),
      statusUpdatedAt: daysAgo(2),
      shippingAddress: {
        name: "Marcus Ward",
        line1: "14 Prospect Pl",
        city: "Portland",
        region: "OR",
        postalCode: "97205",
        country: "US",
      },
      customerNotes:
        "Gift — please don't include an invoice in the package. Thanks!",
      subtotalCents: 13400,
      discountCents: 0,
      taxCents: 1173,
      shippingCents: 0,
      totalCents: 14573,
      items: {
        create: [
          {
            listingId: listingsBySlug["cedar-bath-soap"],
            listingSlug: "cedar-bath-soap",
            listingType: "product",
            nameAtAdd: "Cedar + Black Pepper Bar Soap",
            imageAtAdd: "https://picsum.photos/seed/meridian-soap-1/400/400",
            priceCentsAtAdd: 1400,
            quantity: 4,
          },
          {
            listingId: listingsBySlug["canvas-market-tote"],
            listingSlug: "canvas-market-tote",
            listingType: "product",
            nameAtAdd: "Waxed Canvas Market Tote",
            imageAtAdd: "https://picsum.photos/seed/meridian-tote-1/400/400",
            priceCentsAtAdd: 7800,
            quantity: 1,
            selectedOptions: [{ optionName: "Canvas color", value: "Charcoal" }],
          },
        ],
      },
    },
  });

  // Order 7: complex commission
  await prisma.order.create({
    data: {
      email: "nadia.patel@example.com",
      status: "placed",
      placedAt: daysAgo(0),
      statusUpdatedAt: daysAgo(0),
      subtotalCents: 5500, // 4000 base + 1500 add-on
      discountCents: 0,
      taxCents: 481,
      shippingCents: 0,
      totalCents: 5981,
      items: {
        create: [
          {
            listingId: listingsBySlug["leather-goods-repair"],
            listingSlug: "leather-goods-repair",
            listingType: "service",
            nameAtAdd: "Leather Goods Repair (Drop-off)",
            imageAtAdd: "https://picsum.photos/seed/meridian-repair-1/400/400",
            priceCentsAtAdd: 4000,
            quantity: 1,
            selectedOptions: [
              { optionName: "What are you bringing in?", value: "Wallet or small leather" },
              {
                optionName: "Describe the repair",
                value:
                  "The main seam on my wallet came apart after ten years of use. I'd like it re-stitched.",
              },
              { optionName: "Your name for the ticket", value: "Nadia" },
              { optionName: "Add-ons", value: "Full leather conditioning" },
            ],
          },
        ],
      },
    },
  });

  console.log(`  ✓ Created ${await prisma.order.count()} orders`);

  // ─── Storefront content (singleton) ───────────────────────────────
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

runSeed("default", main);
