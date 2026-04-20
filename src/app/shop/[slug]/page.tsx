import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Package,
  Video,
  Shield,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/shop/image-gallery";
import { PriceDisplay } from "@/components/shop/price-display";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ListingCard } from "@/components/shop/listing-card";
import { getListingBySlug, getRelatedListings } from "@/lib/data";
import { formatDuration } from "@/lib/format";
import { effectiveAvailability, AVAILABILITY_LABELS } from "@/lib/types";
import type { Listing } from "@/lib/types";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Not found" };
  return {
    title: listing.name,
    description: listing.tagline,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const related = await getRelatedListings(listing);
  const availability = effectiveAvailability(listing);
  const isUnavailable = availability !== "available";

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/shop"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ImageGallery
          images={listing.images}
          alt={listing.name}
          availability={availability}
        />

        <div className="space-y-6">
          <div>
            <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {listing.category}
            </div>
            <h1 className="mt-1 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              {listing.name}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {listing.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PriceDisplay
              priceCents={listing.priceCents}
              compareAtCents={listing.compareAtCents}
              size="lg"
            />
            {listing.type === "service" && (
              <Badge variant="secondary">Service</Badge>
            )}
            {availability === "sold-out" && (
              <Badge className="bg-red-100 text-red-900 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
                {AVAILABILITY_LABELS[availability]}
              </Badge>
            )}
            {availability === "unavailable" && (
              <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                {AVAILABILITY_LABELS[availability]}
              </Badge>
            )}
          </div>

          <ListingMeta listing={listing} />

          {listing.processingTime && !isUnavailable && (
            <p className="text-muted-foreground border-l-2 pl-3 text-sm italic">
              {listing.processingTime}
            </p>
          )}

          <Separator />

          <div className="prose prose-sm text-foreground/80 max-w-none leading-relaxed">
            <p>{listing.description}</p>
          </div>

          <AddToCart listing={listing} />

          <ValuePropRow type={listing.type} />

          {listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {listing.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/shop?q=${encodeURIComponent(tag)}`}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">
            You might also like
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <ListingCard key={r.id} listing={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ListingMeta({ listing }: { listing: Listing }) {
  if (listing.type === "service") {
    const hasDuration = typeof listing.durationMinutes === "number";
    return (
      <dl
        className={`text-muted-foreground grid gap-4 text-sm ${hasDuration ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {hasDuration && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <div>
              <dt className="sr-only">Duration</dt>
              <dd>{formatDuration(listing.durationMinutes!)}</dd>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {listing.locationType === "remote" ? (
            <Video className="h-4 w-4 shrink-0" />
          ) : (
            <MapPin className="h-4 w-4 shrink-0" />
          )}
          <div>
            <dt className="sr-only">Location</dt>
            <dd className="capitalize">
              {listing.locationType === "either"
                ? "In-person or remote"
                : listing.locationType.replace("-", " ")}
              {listing.locationLabel ? ` · ${listing.locationLabel}` : ""}
            </dd>
          </div>
        </div>
      </dl>
    );
  }

  return (
    <dl className="text-muted-foreground grid grid-cols-2 gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 shrink-0" />
        <div>
          <dt className="sr-only">SKU</dt>
          <dd className="font-mono text-xs">{listing.sku}</dd>
        </div>
      </div>
      {typeof listing.stockCount === "number" && (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0" />
          <div>
            <dt className="sr-only">Stock</dt>
            <dd>
              {listing.stockCount > 10
                ? "In stock"
                : `Only ${listing.stockCount} left`}
            </dd>
          </div>
        </div>
      )}
    </dl>
  );
}

function ValuePropRow({ type }: { type: "product" | "service" }) {
  const items =
    type === "service"
      ? [
          { icon: Clock, label: "Flexible scheduling after booking" },
          { icon: Shield, label: "Full refund up to 48h before" },
        ]
      : [
          { icon: Truck, label: "Flat-rate shipping · free over $100" },
          { icon: Shield, label: "30-day easy returns" },
        ];

  return (
    <div className="grid gap-3 border-y py-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="text-muted-foreground flex items-center gap-2 text-sm"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
