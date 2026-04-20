import type { StorefrontContent } from "./types";

/**
 * Default storefront content.
 *
 * Used as the fallback when the DB has no storefront row, as the
 * content restored by the admin "Reset to defaults" action, and as
 * the source of truth imported by seed scripts.
 *
 * Mirrors what the home page rendered before the page builder
 * refactor — same sections, same copy, same order — so existing
 * deployments see zero visible change on first run.
 */
export const STOREFRONT_DEFAULTS: StorefrontContent = {
  sections: [
    {
      id: "sec-hero-seed",
      type: "hero",
      visible: true,
      data: {
        eyebrow: "New this week — Articulated Brass Desk Lamp",
        headline:
          "Thoughtfully made goods and services for a considered life.",
        subtitle:
          "A small storefront featuring ceramics, stationery, textiles, and the occasional workshop — all chosen or made because they're worth choosing.",
        imageUrl: "https://picsum.photos/seed/meridian-hero/1600/1600",
        imageAlt: "A quiet shelf of ceramics and linens under warm light.",
        primaryCtaLabel: "Browse the shop",
        primaryCtaHref: "/shop",
        secondaryCtaLabel: "Book a workshop",
        secondaryCtaHref: "/shop?type=service",
      },
    },
    {
      id: "sec-featured-seed",
      type: "featured",
      visible: true,
      data: {
        title: "Featured this week",
        subtitle: "A handful of things we're paying attention to.",
        limit: 4,
      },
    },
    {
      id: "sec-editorial-seed",
      type: "editorial",
      visible: true,
      data: {
        eyebrow: "Our approach",
        headline: "A small shelf, chosen slowly.",
        body: "We don't stock everything. We stock the thing we'd use ourselves — a planter we'd actually water, a pen we'd actually carry, a workshop we'd actually attend. Fewer listings, more conviction behind each one.",
        linkLabel: "Read more about how we choose",
        linkHref: "/about",
      },
    },
    {
      id: "sec-categories-seed",
      type: "categories",
      visible: true,
      data: {
        title: "Browse by category",
      },
    },
    {
      id: "sec-promo-seed",
      type: "promo",
      visible: true,
      data: {
        eyebrow: "Studio sale · through the end of the month",
        headline: "20% off all ceramics, while they last.",
        body: "Hand-thrown planters, bowls, and small vessels from the spring firing. One-of-a-kind pieces — no restocks.",
        ctaLabel: "Shop ceramics",
        ctaHref: "/shop?category=Home",
      },
    },
    {
      id: "sec-services-seed",
      type: "services",
      visible: true,
      data: {
        eyebrow: "Services",
        title: "Workshops, consultations, and quiet accountability.",
        subtitle:
          "Booking a service works just like buying a product — pick a time in the follow-up email after checkout.",
        limit: 3,
      },
    },
  ],
  announcement: {
    enabled: false,
    message: "Closed for spring firing — orders ship May 15.",
    tone: "info",
    linkLabel: "",
    linkHref: "",
  },
  popup: {
    enabled: false,
    title: "A note about this site",
    subtitle: "Just like the law requires",
    body: "This site uses cookies and similar technologies to improve your experience, analyze traffic, and remember your preferences. By continuing, you agree to our use of these technologies. If you'd rather not, you can decline and be taken elsewhere.",
    icon: "cookie",
    acceptLabel: "Accept",
    declineLabel: "Decline",
  },
  updatedAt: new Date().toISOString(),
};
