import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/shop/listing-card";
import {
  getFeaturedListings,
  getCategories,
  searchListings,
  getStorefrontContent,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import type {
  Section,
  Listing,
  HeroData,
  FeaturedData,
  EditorialData,
  CategoriesData,
  PromoData,
  ServicesData,
  TextBlockData,
  ImageBannerData,
} from "@/lib/types";

export default async function HomePage() {
  const [content, featured, categories, services] = await Promise.all([
    getStorefrontContent(),
    // Fetch a generous pool; each section's `limit` trims at render.
    getFeaturedListings(20),
    getCategories(),
    searchListings({ type: "service", sort: "featured" }),
  ]);

  return (
    <div className="space-y-24 pb-20">
      {content.sections
        .filter((s) => s.visible)
        .map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            featured={featured}
            categories={categories}
            services={services}
          />
        ))}
    </div>
  );
}

/** Dispatch a section to its renderer. The types narrow inside each
 * case via the discriminated union on `section.type`. */
function SectionRenderer({
  section,
  featured,
  categories,
  services,
}: {
  section: Section;
  featured: Listing[];
  categories: string[];
  services: Listing[];
}) {
  switch (section.type) {
    case "hero":
      return <HeroBlock data={section.data} />;
    case "featured":
      return <FeaturedBlock data={section.data} featured={featured} />;
    case "editorial":
      return <EditorialBlock data={section.data} />;
    case "categories":
      return <CategoriesBlock data={section.data} categories={categories} />;
    case "promo":
      return <PromoBlock data={section.data} />;
    case "services":
      return <ServicesBlock data={section.data} services={services} />;
    case "text-block":
      return <TextBlock data={section.data} />;
    case "image-banner":
      return <ImageBannerBlock data={section.data} />;
  }
}

// ─── Per-type renderers ─────────────────────────────────────────────

function HeroBlock({ data: h }: { data: HeroData }) {
  return (
    <section className="container mx-auto px-4 pt-12 sm:px-6 lg:px-8 lg:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-6">
          {h.eyebrow && (
            <div className="text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3" />
              {h.eyebrow}
            </div>
          )}
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {h.headline}
          </h1>
          {h.subtitle && (
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              {h.subtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            {h.primaryCtaLabel && h.primaryCtaHref && (
              <Button asChild size="lg">
                <Link href={h.primaryCtaHref}>
                  {h.primaryCtaLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {h.secondaryCtaLabel && h.secondaryCtaHref && (
              <Button asChild size="lg" variant="outline">
                <Link href={h.secondaryCtaHref}>{h.secondaryCtaLabel}</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-xl lg:aspect-square">
          {h.imageUrl && (
            <Image
              src={h.imageUrl}
              alt={h.imageAlt || ""}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedBlock({
  data: s,
  featured,
}: {
  data: FeaturedData;
  featured: Listing[];
}) {
  const items = featured.slice(0, s.limit);
  if (items.length === 0) return null;
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {s.title}
          </h2>
          {s.subtitle && (
            <p className="text-muted-foreground mt-1 text-sm">{s.subtitle}</p>
          )}
        </div>
        <Link
          href="/shop"
          className="hover:text-foreground text-muted-foreground hidden items-center gap-1 text-sm sm:inline-flex"
        >
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

function EditorialBlock({ data: s }: { data: EditorialData }) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-muted/40 rounded-2xl p-8 sm:p-12 lg:p-16">
        <div className="max-w-3xl space-y-5">
          {s.eyebrow && (
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              {s.eyebrow}
            </p>
          )}
          <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {s.headline}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {s.body}
          </p>
          {s.linkLabel && s.linkHref && (
            <Link
              href={s.linkHref}
              className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              {s.linkLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoriesBlock({
  data: s,
  categories,
}: {
  data: CategoriesData;
  categories: string[];
}) {
  if (categories.length === 0) return null;
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">
        {s.title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/shop?category=${encodeURIComponent(cat)}`}
            className="group bg-muted hover:bg-accent relative flex aspect-square items-center justify-center overflow-hidden rounded-lg p-4 text-center transition-colors"
          >
            <span className="relative z-10 text-sm font-medium">{cat}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PromoBlock({ data: s }: { data: PromoData }) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-foreground text-background relative overflow-hidden rounded-2xl px-8 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="max-w-xl space-y-3">
            {s.eyebrow && (
              <p className="text-background/70 text-xs font-medium tracking-widest uppercase">
                {s.eyebrow}
              </p>
            )}
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {s.headline}
            </h2>
            {s.body && (
              <p className="text-background/80 text-base leading-relaxed">
                {s.body}
              </p>
            )}
          </div>
          {s.ctaLabel && s.ctaHref && (
            <Button asChild size="lg" variant="secondary" className="w-fit">
              <Link href={s.ctaHref}>{s.ctaLabel}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ServicesBlock({
  data: s,
  services,
}: {
  data: ServicesData;
  services: Listing[];
}) {
  const items = services.slice(0, s.limit);
  if (items.length === 0) return null;
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        {s.eyebrow && (
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {s.eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {s.title}
        </h2>
        {s.subtitle && (
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            {s.subtitle}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

// ─── New section types introduced by the page builder ───────────────

function TextBlock({ data: s }: { data: TextBlockData }) {
  const isCenter = s.alignment === "center";
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div
        className={cn(
          "max-w-3xl space-y-4",
          isCenter && "mx-auto text-center"
        )}
      >
        {s.eyebrow && (
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            {s.eyebrow}
          </p>
        )}
        {s.headline && (
          <h2 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
            {s.headline}
          </h2>
        )}
        {s.body && (
          <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-line">
            {s.body}
          </p>
        )}
      </div>
    </section>
  );
}

function ImageBannerBlock({ data: s }: { data: ImageBannerData }) {
  const textAlign =
    s.textPlacement === "center"
      ? "items-center text-center"
      : s.textPlacement === "right"
        ? "items-end text-right"
        : "items-start text-left";
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-muted relative aspect-[21/9] overflow-hidden rounded-2xl">
        {s.imageUrl && (
          <Image
            src={s.imageUrl}
            alt={s.imageAlt || ""}
            fill
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover"
          />
        )}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: s.overlayOpacity }}
          aria-hidden
        />
        <div
          className={cn(
            "relative z-10 flex h-full flex-col justify-center p-8 text-white sm:p-12 lg:p-16",
            textAlign
          )}
        >
          <div className="max-w-xl space-y-3">
            {s.eyebrow && (
              <p className="text-xs font-medium tracking-widest uppercase opacity-80">
                {s.eyebrow}
              </p>
            )}
            {s.headline && (
              <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {s.headline}
              </h2>
            )}
            {s.body && (
              <p className="text-base opacity-90 sm:text-lg">{s.body}</p>
            )}
            {s.ctaLabel && s.ctaHref && (
              <div className="pt-2">
                <Button asChild size="lg" variant="secondary">
                  <Link href={s.ctaHref}>{s.ctaLabel}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
