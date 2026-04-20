import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "./price-display";
import { formatDuration } from "@/lib/format";
import { effectiveAvailability } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Listing, AvailabilityStatus } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
}

/** Tailwind classes and label for each stamp state. */
const STAMP_STYLES: Record<
  Exclude<AvailabilityStatus, "available">,
  { classes: string; label: string }
> = {
  "sold-out": {
    classes: "text-red-800 dark:text-red-400",
    label: "Sold out",
  },
  unavailable: {
    classes: "text-amber-800 dark:text-amber-400",
    label: "Unavailable",
  },
};

export function ListingCard({ listing }: ListingCardProps) {
  const href = `/shop/${listing.slug}`;
  const availability = effectiveAvailability(listing);
  const isUnavailable = availability !== "available";
  const stamp = isUnavailable ? STAMP_STYLES[availability] : null;

  return (
    <Link
      href={href}
      aria-label={`${listing.name} — ${listing.tagline}${
        stamp ? ` — ${stamp.label.toLowerCase()}` : ""
      }`}
      className="group focus-visible:outline-none"
    >
      <Card
        className={cn(
          "h-full overflow-hidden border-border/60 transition-all hover:border-border hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2",
          isUnavailable && "opacity-75"
        )}
      >
        <div className="bg-muted relative aspect-square overflow-hidden">
          <Image
            src={listing.images[0]}
            alt={listing.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-105",
              isUnavailable && "grayscale"
            )}
          />

          {!isUnavailable && listing.type === "service" && (
            <div className="absolute top-2 left-2">
              <Badge
                variant="secondary"
                className="bg-background/90 backdrop-blur"
              >
                Service
              </Badge>
            </div>
          )}

          {stamp && (
            <div className="absolute inset-0 grid place-items-center bg-black/45">
              <span
                className={cn(
                  "bg-background rounded-md px-4 py-1.5 text-sm font-semibold tracking-[0.15em] uppercase shadow-lg",
                  stamp.classes
                )}
              >
                {stamp.label}
              </span>
            </div>
          )}
        </div>
        <CardContent className="space-y-1.5 p-4">
          <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {listing.category}
          </div>
          <h3 className="line-clamp-1 leading-tight font-medium">
            {listing.name}
          </h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {listing.tagline}
          </p>
          <div className="flex items-center justify-between pt-2">
            <PriceDisplay
              priceCents={listing.priceCents}
              compareAtCents={listing.compareAtCents}
              size="md"
              className={isUnavailable ? "text-muted-foreground" : undefined}
            />
            {listing.type === "service" &&
              typeof listing.durationMinutes === "number" && (
                <span className="text-muted-foreground text-xs">
                  {formatDuration(listing.durationMinutes)}
                </span>
              )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
