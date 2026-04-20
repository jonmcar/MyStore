/**
 * Edge cases seed — deliberately weird data for finding layout bugs.
 *
 * Run with:  npm run seed:edge-cases
 *
 * Creates listings and orders designed to stress-test the UI:
 *
 *   - Listing with an extremely long name (two lines of text)
 *   - Listing with no images at all
 *   - Listing with 8 images (tests carousels / image lists)
 *   - Listing with 12 customization options (most since-the-dawn)
 *   - Listing with 50 tags (tests tag wrapping)
 *   - Service with no duration (variable)
 *   - Product with extremely high price ($9,999.99)
 *   - Product with extremely low price ($0.99)
 *   - Both availability flags (sold-out AND unavailable variations)
 *   - Listing with no description
 *   - Draft listing (unpublished)
 *   - Order with 8 line items (long item list)
 *   - Order with just one $2 item (tiny totals)
 *   - Order with every field populated (discount, notes, admin notes,
 *     customer notes, address with line2, etc.)
 *   - Expired AND maxed-out discount code
 *   - Discount with absurd 90% value
 *   - Storefront with every section visible and announcement enabled
 *
 * Click through the admin + shopper UI looking for:
 *   - Text that overflows or truncates awkwardly
 *   - Tables that break at unusual values
 *   - Images that don't render when missing
 *   - Buttons that misalign when data is wildly different sizes
 *   - Price formatting that breaks at extremes
 */

import {
  prisma,
  slugify,
  daysAgo,
  daysFromNow,
  wipeAll,
  runSeed,
  writeStoreConfig,
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

  // ─── Categories ──────────────────────────────────────────────────
  console.log("  Creating categories…");
  const categoryData = [
    { name: "Home", sortOrder: 1 },
    { name: "Stationery", sortOrder: 2 },
    { name: "Services", sortOrder: 3 },
    {
      name: "A Very Long Category Name That Should Wrap or Truncate",
      sortOrder: 4,
    },
  ];
  const categories = await Promise.all(
    categoryData.map((c) =>
      prisma.category.create({
        data: { ...c, slug: slugify(c.name) },
      })
    )
  );
  const byName = (n: string) => categories.find((x) => x.name === n)!.id;

  // ─── Edge-case listings ──────────────────────────────────────────
  console.log("  Creating edge-case listings…");

  // 1. Extremely long name
  await prisma.listing.create({
    data: {
      slug: "extremely-long-name",
      type: "product",
      name: "The Hand-Thrown Anatolian-Inspired Large Ceremonial Two-Handled Olive Oil Vessel with Integrated Carrying Handles and Drip-Free Pour Spout",
      tagline:
        "A tagline that is also deliberately quite long to see how it wraps when placed next to an equally absurd product name.",
      description: "Long name, long tagline, long description all at once.",
      priceCents: 18800,
      images: ["https://picsum.photos/seed/edge-longname/1200/1200"],
      tags: ["edge case"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(5),
      createdAt: daysAgo(5),
      sku: "MER-EDG-001",
      weightGrams: 1200,
      stockCount: 3,
    },
  });

  // 2. No images
  await prisma.listing.create({
    data: {
      slug: "no-images",
      type: "product",
      name: "Listing With No Images",
      tagline: "Tests the placeholder image fallback everywhere.",
      description:
        "This listing intentionally has no images. Shop cards, product pages, cart lines, order lines — every surface that renders an image should have a graceful fallback.",
      priceCents: 2400,
      images: [],
      tags: ["edge case", "no-image"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(8),
      createdAt: daysAgo(8),
      sku: "MER-EDG-002",
      stockCount: 12,
    },
  });

  // 3. Eight images (carousel stress test)
  await prisma.listing.create({
    data: {
      slug: "eight-images",
      type: "product",
      name: "Eight-Image Gallery Test",
      tagline: "Tests image list wrapping and carousels.",
      description: "Eight photos. See how the listing gallery handles it.",
      priceCents: 4800,
      images: Array.from(
        { length: 8 },
        (_, i) => `https://picsum.photos/seed/edge-8img-${i}/1200/1200`
      ),
      tags: ["edge case", "many-images"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(3),
      createdAt: daysAgo(3),
      sku: "MER-EDG-003",
      stockCount: 5,
    },
  });

  // 4. Twelve customization options (option-stack stress test)
  await prisma.listing.create({
    data: {
      slug: "twelve-options",
      type: "product",
      name: "Twelve-Option Customization Test",
      tagline: "Option stack goes on forever.",
      description:
        "Designed to test how tall the option section gets when someone really leans into customization.",
      priceCents: 5000,
      images: ["https://picsum.photos/seed/edge-12opt/1200/1200"],
      tags: ["edge case", "many-options"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(2),
      createdAt: daysAgo(2),
      sku: "MER-EDG-004",
      stockCount: 20,
      options: {
        create: [
          {
            type: "select",
            name: "Color",
            required: true,
            sortOrder: 0,
            config: { display: "dropdown" },
            choices: {
              create: [
                { label: "Red", sortOrder: 0 },
                { label: "Blue", sortOrder: 1 },
                { label: "Green", sortOrder: 2 },
              ],
            },
          },
          {
            type: "select",
            name: "Size",
            required: true,
            sortOrder: 1,
            config: { display: "radio" },
            choices: {
              create: [
                { label: "Small", sortOrder: 0 },
                { label: "Medium", sortOrder: 1 },
                { label: "Large", priceModifierCents: 500, sortOrder: 2 },
              ],
            },
          },
          {
            type: "multi-select",
            name: "Add-ons",
            required: false,
            sortOrder: 2,
            choices: {
              create: [
                { label: "Gift wrap", priceModifierCents: 400, sortOrder: 0 },
                { label: "Handwritten note", sortOrder: 1 },
                { label: "Rush shipping", priceModifierCents: 1200, sortOrder: 2 },
              ],
            },
          },
          {
            type: "text",
            name: "Engraving text",
            required: false,
            sortOrder: 3,
            config: { placeholder: "Up to 20 characters", maxLength: 20 },
          },
          {
            type: "text",
            name: "Gift recipient name",
            required: false,
            sortOrder: 4,
            config: { placeholder: "Their name", maxLength: 60 },
          },
          {
            type: "textarea",
            name: "Gift note",
            required: false,
            sortOrder: 5,
            config: { placeholder: "A short message…", maxLength: 300 },
          },
          {
            type: "number",
            name: "Font size",
            required: false,
            sortOrder: 6,
            config: { placeholder: "12", min: 8, max: 24, step: 1 },
          },
          {
            type: "number",
            name: "Copies",
            required: false,
            sortOrder: 7,
            config: { placeholder: "1", min: 1, max: 50, step: 1 },
          },
          {
            type: "file",
            name: "Reference image",
            required: false,
            sortOrder: 8,
            config: { accept: "image/*", maxSizeMB: 5 },
          },
          {
            type: "file",
            name: "Logo file",
            required: false,
            sortOrder: 9,
            config: { accept: "image/*", maxSizeMB: 5 },
          },
          {
            type: "datetime",
            name: "Delivery date",
            required: false,
            sortOrder: 10,
            config: { mode: "date" },
          },
          {
            type: "datetime",
            name: "Preferred time",
            required: false,
            sortOrder: 11,
            config: { mode: "datetime" },
          },
        ],
      },
    },
  });

  // 5. Fifty tags
  await prisma.listing.create({
    data: {
      slug: "many-tags",
      type: "product",
      name: "Fifty Tags Test",
      tagline: "Tests tag wrapping and filter overflow.",
      description: "Every possible descriptor at once.",
      priceCents: 3200,
      images: ["https://picsum.photos/seed/edge-tags/1200/1200"],
      tags: Array.from({ length: 50 }, (_, i) => `tag-${i + 1}`),
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(4),
      createdAt: daysAgo(4),
      sku: "MER-EDG-005",
      stockCount: 30,
    },
  });

  // 6. Service with no duration (variable)
  await prisma.listing.create({
    data: {
      slug: "variable-duration",
      type: "service",
      name: "Custom Consultation (Variable Duration)",
      tagline: "Depends on how complicated things get.",
      description:
        "Some consultations run 30 minutes, others two hours. This listing has no fixed duration — we figure it out together.",
      priceCents: 5000,
      images: ["https://picsum.photos/seed/edge-variable/1200/1200"],
      tags: ["edge case", "service"],
      categoryId: byName("Services"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(10),
      createdAt: daysAgo(10),
      durationMinutes: null, // variable — the important bit
      locationType: "remote",
    },
  });

  // 7. Extremely high price
  await prisma.listing.create({
    data: {
      slug: "extreme-high-price",
      type: "product",
      name: "Extreme High Price Test",
      tagline: "$9,999.99 to check price formatting at the high end.",
      description: "A commemorative commissioned piece. Not for everyone.",
      priceCents: 999999,
      images: ["https://picsum.photos/seed/edge-highprice/1200/1200"],
      tags: ["edge case", "commission"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(1),
      createdAt: daysAgo(1),
      sku: "MER-EDG-006",
      stockCount: 1,
    },
  });

  // 8. Extremely low price
  await prisma.listing.create({
    data: {
      slug: "extreme-low-price",
      type: "product",
      name: "Extreme Low Price Test",
      tagline: "$0.99 to test sub-dollar formatting.",
      description: "A tiny thing, honestly priced.",
      priceCents: 99,
      images: ["https://picsum.photos/seed/edge-lowprice/1200/1200"],
      tags: ["edge case"],
      categoryId: byName("Stationery"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(1),
      createdAt: daysAgo(1),
      sku: "MER-EDG-007",
      stockCount: 200,
    },
  });

  // 9. Sold-out via stock count
  await prisma.listing.create({
    data: {
      slug: "sold-out-stock",
      type: "product",
      name: "Sold Out (Stock = 0)",
      tagline: "Should show red sold-out stamp.",
      description: "Stock exhausted. Should display the sold-out banner.",
      priceCents: 4400,
      images: ["https://picsum.photos/seed/edge-soldout/1200/1200"],
      tags: ["edge case", "sold-out"],
      categoryId: byName("Home"),
      inStock: false,
      isPublished: true,
      publishedAt: daysAgo(20),
      createdAt: daysAgo(20),
      sku: "MER-EDG-008",
      stockCount: 0,
    },
  });

  // 10. Marked unavailable by admin
  await prisma.listing.create({
    data: {
      slug: "unavailable-override",
      type: "product",
      name: "Admin-Marked Unavailable",
      tagline: "Should show amber unavailable stamp.",
      description:
        "Stock technically exists but admin has marked the listing unavailable.",
      priceCents: 7200,
      images: ["https://picsum.photos/seed/edge-unavail/1200/1200"],
      tags: ["edge case", "unavailable"],
      categoryId: byName("Home"),
      inStock: true,
      availability: "unavailable",
      isPublished: true,
      publishedAt: daysAgo(15),
      createdAt: daysAgo(15),
      sku: "MER-EDG-009",
      stockCount: 5,
    },
  });

  // 11. No description
  await prisma.listing.create({
    data: {
      slug: "no-description",
      type: "product",
      name: "No Description Listing",
      tagline: "Testing empty description fallback.",
      description: "",
      priceCents: 2800,
      images: ["https://picsum.photos/seed/edge-nodesc/1200/1200"],
      tags: ["edge case"],
      categoryId: byName("Stationery"),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(6),
      createdAt: daysAgo(6),
      sku: "MER-EDG-010",
      stockCount: 10,
    },
  });

  // 12. Draft (unpublished)
  await prisma.listing.create({
    data: {
      slug: "draft-listing",
      type: "product",
      name: "Draft Listing — Not Yet Published",
      tagline: "Should appear in admin but not in public shop.",
      description:
        "A draft. Should only show in admin list, tagged as Draft.",
      priceCents: 5500,
      images: ["https://picsum.photos/seed/edge-draft/1200/1200"],
      tags: ["edge case", "draft"],
      categoryId: byName("Home"),
      inStock: true,
      isPublished: false,
      createdAt: daysAgo(1),
      sku: "MER-EDG-011",
      stockCount: 8,
    },
  });

  // 13. Very-long-category-name listing (inherits the long category)
  await prisma.listing.create({
    data: {
      slug: "long-category-listing",
      type: "product",
      name: "Item In Long-Named Category",
      tagline: "Tests category display when the name is huge.",
      description: "Its category name should truncate gracefully.",
      priceCents: 3800,
      images: ["https://picsum.photos/seed/edge-longcat/1200/1200"],
      tags: ["edge case"],
      categoryId: byName(
        "A Very Long Category Name That Should Wrap or Truncate"
      ),
      inStock: true,
      isPublished: true,
      publishedAt: daysAgo(2),
      createdAt: daysAgo(2),
      sku: "MER-EDG-012",
      stockCount: 4,
    },
  });

  console.log(`  ✓ Created ${await prisma.listing.count()} listings`);

  // ─── Edge-case discounts ─────────────────────────────────────────
  console.log("  Creating 4 discount codes…");
  await prisma.discountCode.createMany({
    data: [
      {
        code: "EXPIRED",
        description: "Expired code — should never validate",
        kind: "percent",
        amount: 25,
        timesUsed: 12,
        active: true,
        expiresAt: daysAgo(30), // expired
        createdAt: daysAgo(60),
      },
      {
        code: "MAXED",
        description: "Used-up code — timesUsed == usageLimit",
        kind: "fixed",
        amount: 500,
        timesUsed: 10,
        usageLimit: 10,
        active: true,
        createdAt: daysAgo(45),
      },
      {
        code: "NINETY",
        description: "Aggressive 90% off — tests extreme discount math",
        kind: "percent",
        amount: 90,
        timesUsed: 0,
        active: true,
        createdAt: daysAgo(1),
      },
      {
        code: "VERYLONGCODENAMETHATMIGHTBREAKLAYOUT",
        description:
          "An absurdly long code name to test input/badge wrapping behavior in the admin table and on the checkout applied-discount line",
        kind: "percent",
        amount: 5,
        timesUsed: 2,
        active: true,
        createdAt: daysAgo(3),
      },
    ],
  });

  // ─── Edge-case orders ────────────────────────────────────────────
  console.log("  Creating edge-case orders…");

  const longListingId = (await prisma.listing.findUnique({
    where: { slug: "extremely-long-name" },
  }))!.id;
  const lowPriceId = (await prisma.listing.findUnique({
    where: { slug: "extreme-low-price" },
  }))!.id;
  const highPriceId = (await prisma.listing.findUnique({
    where: { slug: "extreme-high-price" },
  }))!.id;

  // Order A: 8 line items (very tall order)
  const eightListings = await prisma.listing.findMany({
    where: { isPublished: true },
    take: 8,
  });
  let subtotalA = 0;
  await prisma.order.create({
    data: {
      email: "eightitems.order@example.com",
      status: "placed",
      placedAt: daysAgo(2),
      statusUpdatedAt: daysAgo(2),
      shippingAddress: {
        name: "Many Items McGee",
        line1: "500 Bulk Buy Blvd",
        line2: "Suite 200, Building C",
        city: "San Francisco",
        region: "CA",
        postalCode: "94103",
        country: "US",
      },
      subtotalCents: eightListings.reduce((s, l) => {
        subtotalA += l.priceCents;
        return s + l.priceCents;
      }, 0),
      discountCents: 0,
      taxCents: Math.round(subtotalA * 0.0875),
      shippingCents: 795,
      totalCents: subtotalA + Math.round(subtotalA * 0.0875) + 795,
      items: {
        create: eightListings.map((l) => ({
          listingId: l.id,
          listingSlug: l.slug,
          listingType: l.type,
          nameAtAdd: l.name,
          imageAtAdd: `https://picsum.photos/seed/edge-order-${l.slug}/400/400`,
          priceCentsAtAdd: l.priceCents,
          quantity: 1,
        })),
      },
    },
  });

  // Order B: Tiny total (single low-price item)
  await prisma.order.create({
    data: {
      email: "tiny.total@example.com",
      status: "shipped",
      placedAt: daysAgo(5),
      statusUpdatedAt: daysAgo(3),
      shippingAddress: {
        name: "Micro Order",
        line1: "1 Dollar Ln",
        city: "Oakland",
        region: "CA",
        postalCode: "94611",
        country: "US",
      },
      subtotalCents: 99,
      discountCents: 0,
      taxCents: 9,
      shippingCents: 795, // shipping dwarfs the item
      totalCents: 903,
      items: {
        create: [
          {
            listingId: lowPriceId,
            listingSlug: "extreme-low-price",
            listingType: "product",
            nameAtAdd: "Extreme Low Price Test",
            imageAtAdd:
              "https://picsum.photos/seed/edge-lowprice/400/400",
            priceCentsAtAdd: 99,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Order C: Everything populated (discount + notes + customer notes + long address)
  await prisma.order.create({
    data: {
      email: "maximum.metadata@example.com",
      status: "ready-for-pickup",
      placedAt: daysAgo(3),
      statusUpdatedAt: daysAgo(1),
      shippingAddress: {
        name: "Maximalist McGraw",
        line1: "1234 Every Field Is Populated Avenue",
        line2: "Apt 5B, Back entrance, ring buzzer 3 times",
        city: "Brooklyn",
        region: "NY",
        postalCode: "11216",
        country: "US",
      },
      subtotalCents: 99999,
      discountCents: 10000,
      appliedDiscount: {
        code: "TESTCODE",
        description: "Test discount capturing all fields",
        kind: "fixed",
        amount: 10000,
        discountCents: 10000,
      },
      taxCents: 7874,
      shippingCents: 795,
      totalCents: 98668,
      notes:
        "Admin note: customer emailed about pickup timing. Confirmed Saturday 11am. Pieces are boxed and labeled with their name.",
      customerNotes:
        "This is a gift, please no packaging inserts. If pickup runs late, please hold the items until Sunday.",
      items: {
        create: [
          {
            listingId: highPriceId,
            listingSlug: "extreme-high-price",
            listingType: "product",
            nameAtAdd: "Extreme High Price Test",
            imageAtAdd:
              "https://picsum.photos/seed/edge-highprice/400/400",
            priceCentsAtAdd: 99999,
            quantity: 1,
            selectedOptions: [
              { optionName: "Color", value: "Blue" },
              { optionName: "Engraving text", value: "Forever yours, 2026" },
            ],
          },
        ],
      },
    },
  });

  // Order D: Item with long name (tests order row layout)
  await prisma.order.create({
    data: {
      email: "long.name@example.com",
      status: "placed",
      placedAt: daysAgo(0),
      statusUpdatedAt: daysAgo(0),
      shippingAddress: {
        name: "Wraps Textovsky",
        line1: "77 Overflow St",
        city: "Berkeley",
        region: "CA",
        postalCode: "94704",
        country: "US",
      },
      subtotalCents: 18800,
      discountCents: 0,
      taxCents: 1645,
      shippingCents: 795,
      totalCents: 21240,
      items: {
        create: [
          {
            listingId: longListingId,
            listingSlug: "extremely-long-name",
            listingType: "product",
            nameAtAdd:
              "The Hand-Thrown Anatolian-Inspired Large Ceremonial Two-Handled Olive Oil Vessel with Integrated Carrying Handles and Drip-Free Pour Spout",
            imageAtAdd:
              "https://picsum.photos/seed/edge-longname/400/400",
            priceCentsAtAdd: 18800,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log(`  ✓ Created ${await prisma.order.count()} orders`);

  // ─── Storefront: everything enabled including announcement ──────
  console.log("  Creating storefront content (everything enabled)…");
  await prisma.storefrontContent.create({
    data: {
      id: "singleton",
      sections: [
        {
          id: "sec-hero-edge",
          type: "hero",
          visible: true,
          data: {
            eyebrow:
              "Edge case testing — every section visible, announcement on",
            headline:
              "A Deliberately Exhaustive Hero Headline For Testing Line-Wrapping Behavior At Different Viewport Widths",
            subtitle:
              "Every subtitle should test this long. Every button should fit. The layout should hold at 320px and at 2560px.",
            imageUrl: "https://picsum.photos/seed/edge-hero/1600/1600",
            imageAlt: "Edge-case hero image.",
            primaryCtaLabel: "Primary Button With A Surprisingly Long Label",
            primaryCtaHref: "/shop",
            secondaryCtaLabel: "Secondary Also Long",
            secondaryCtaHref: "/shop?type=service",
          },
        },
        {
          id: "sec-featured-edge",
          type: "featured",
          visible: true,
          data: { title: "Featured", subtitle: "", limit: 4 },
        },
        {
          id: "sec-editorial-edge",
          type: "editorial",
          visible: true,
          data: {
            eyebrow: "Editorial eyebrow",
            headline: "Editorial headline",
            body: "Short body.",
            linkLabel: "",
            linkHref: "",
          },
        },
        {
          id: "sec-categories-edge",
          type: "categories",
          visible: true,
          data: { title: "Categories" },
        },
        {
          id: "sec-text-edge",
          type: "text-block",
          visible: true,
          data: {
            eyebrow: "",
            headline: "Plain text block",
            body: "Just some body text in a text block. Should render cleanly with no images, no links, no call to action.",
            alignment: "center",
          },
        },
        {
          id: "sec-banner-edge",
          type: "image-banner",
          visible: true,
          data: {
            imageUrl: "https://picsum.photos/seed/edge-banner/1600/600",
            imageAlt: "Banner",
            overlayOpacity: 0.4,
            eyebrow: "",
            headline: "Image banner with overlay",
            body: "Tests the banner component with middling overlay.",
            ctaLabel: "Click me",
            ctaHref: "/shop",
            textPlacement: "left",
          },
        },
        {
          id: "sec-promo-edge",
          type: "promo",
          visible: true,
          data: {
            eyebrow: "Promo",
            headline: "Promo headline",
            body: "Promo body.",
            ctaLabel: "Click",
            ctaHref: "/shop",
          },
        },
        {
          id: "sec-services-edge",
          type: "services",
          visible: true,
          data: {
            eyebrow: "Services",
            title: "Services block",
            subtitle: "",
            limit: 3,
          },
        },
      ],
      announcement: {
        enabled: true,
        message:
          "EDGE CASE MODE: every section is visible, every field is populated, and the announcement banner is on.",
        tone: "warning",
        linkLabel: "Read more",
        linkHref: "/about",
      },
      popup: {
        enabled: true,
        title:
          "An Extremely Long Popup Title That Tests Line Wrapping Behavior in the Dialog Header Across Many Viewports",
        subtitle:
          "And a subtitle with plenty of length to see if both stack gracefully",
        body:
          "This is a deliberately long body. It has multiple paragraphs.\n\nLine breaks should be preserved. Users should still be able to read this comfortably.\n\nIt tests whether the body content scrolls gracefully when it exceeds the dialog height, and whether the buttons remain visible and clickable no matter how much text is above them.\n\n" +
          "Additional text follows to push the total body length past what fits on a typical viewport without scrolling. ".repeat(
            10
          ),
        icon: "megaphone",
        acceptLabel: "Accept with an unusually long button label",
        declineLabel: "Decline",
      },
    },
  });
}

runSeed("edge-cases", main);
