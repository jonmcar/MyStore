import { cn } from "@/lib/utils";
import { ListingCard } from "./listing-card";
import type { Listing } from "@/lib/types";

interface ListingGridProps {
  listings: Listing[];
  className?: string;
}

export function ListingGrid({ listings, className }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
        No listings match those filters.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
