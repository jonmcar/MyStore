/**
 * Pure helpers for the page-builder sections array.
 *
 * The editor component holds the sections in local state; these
 * functions do the operations on that array. Kept separate so they
 * can be unit-tested without rendering anything.
 */

import type {
  Section,
  SectionType,
  HeroData,
  FeaturedData,
  EditorialData,
  CategoriesData,
  PromoData,
  ServicesData,
  TextBlockData,
  ImageBannerData,
} from "./types";
import { REQUIRED_SECTION_TYPES } from "./types";

// ─── Section IDs ────────────────────────────────────────────────────

/** Generate a URL-safe id for a freshly-created section. */
export function makeSectionId(type: SectionType): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `sec-${type}-${Date.now().toString(36)}-${rand}`;
}

// ─── Default data per section type ──────────────────────────────────
//
// When the admin adds a new section of a given type, we seed it with
// reasonable placeholder copy so it's immediately visible on the page
// rather than blank.

const DEFAULTS: {
  hero: HeroData;
  featured: FeaturedData;
  editorial: EditorialData;
  categories: CategoriesData;
  promo: PromoData;
  services: ServicesData;
  "text-block": TextBlockData;
  "image-banner": ImageBannerData;
} = {
  hero: {
    eyebrow: "",
    headline: "New headline",
    subtitle: "A short subtitle explaining what this hero is about.",
    imageUrl: "https://picsum.photos/seed/meridian-hero-new/1600/1600",
    imageAlt: "",
    primaryCtaLabel: "Browse the shop",
    primaryCtaHref: "/shop",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
  },
  featured: {
    title: "Featured",
    subtitle: "",
    limit: 4,
  },
  editorial: {
    eyebrow: "",
    headline: "Editorial headline",
    body: "A paragraph or two of editorial copy. Speaks in your shop's voice — tell a story, explain a choice, or highlight a value.",
    linkLabel: "",
    linkHref: "",
  },
  categories: {
    title: "Browse by category",
  },
  promo: {
    eyebrow: "",
    headline: "Promo headline",
    body: "One-line description of the promotion.",
    ctaLabel: "Shop the sale",
    ctaHref: "/shop",
  },
  services: {
    eyebrow: "Services",
    title: "Our services",
    subtitle: "",
    limit: 3,
  },
  "text-block": {
    eyebrow: "",
    headline: "Text block",
    body: "Freeform body copy. Use this for short announcements, shop stories, or anything that doesn't fit the more structured section types.",
    alignment: "left",
  },
  "image-banner": {
    imageUrl: "https://picsum.photos/seed/meridian-banner-new/1600/600",
    imageAlt: "",
    overlayOpacity: 0.35,
    eyebrow: "",
    headline: "Banner headline",
    body: "A line of supporting copy that overlays the image.",
    ctaLabel: "Explore",
    ctaHref: "/shop",
    textPlacement: "center",
  },
};

/** Build a new section of the given type with default data. */
export function makeSection(type: SectionType): Section {
  const id = makeSectionId(type);
  switch (type) {
    case "hero":
      return { id, type, visible: true, data: { ...DEFAULTS.hero } };
    case "featured":
      return { id, type, visible: true, data: { ...DEFAULTS.featured } };
    case "editorial":
      return { id, type, visible: true, data: { ...DEFAULTS.editorial } };
    case "categories":
      return { id, type, visible: true, data: { ...DEFAULTS.categories } };
    case "promo":
      return { id, type, visible: true, data: { ...DEFAULTS.promo } };
    case "services":
      return { id, type, visible: true, data: { ...DEFAULTS.services } };
    case "text-block":
      return {
        id,
        type,
        visible: true,
        data: { ...DEFAULTS["text-block"] },
      };
    case "image-banner":
      return {
        id,
        type,
        visible: true,
        data: { ...DEFAULTS["image-banner"] },
      };
  }
}

// ─── Minimum-type enforcement ───────────────────────────────────────

/** Count how many instances of each type currently exist. */
export function countByType(sections: Section[]): Record<SectionType, number> {
  const counts = {
    hero: 0,
    featured: 0,
    editorial: 0,
    categories: 0,
    promo: 0,
    services: 0,
    "text-block": 0,
    "image-banner": 0,
  } as Record<SectionType, number>;
  for (const s of sections) counts[s.type]++;
  return counts;
}

/** True if deleting a section of this type would leave too few of
 * them (i.e. this is the last instance of a required type). */
export function isLastOfRequiredType(
  sections: Section[],
  sectionId: string
): boolean {
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return false;
  if (!REQUIRED_SECTION_TYPES.includes(section.type)) return false;
  const counts = countByType(sections);
  return counts[section.type] <= 1;
}

/** Returns an array of section types the admin can add. Currently
 * that's all of them — no upper limits — but kept as a function so we
 * can add per-type caps later if we decide e.g. "only one hero ever". */
export function availableSectionTypes(
  _sections: Section[]
): SectionType[] {
  return [
    "hero",
    "featured",
    "editorial",
    "categories",
    "promo",
    "services",
    "text-block",
    "image-banner",
  ];
}
