import { Suspense } from "react";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ListingGrid } from "@/components/shop/listing-grid";
import { searchListings, getCategories } from "@/lib/data";
import type { ShopFilters as Filters, ListingType } from "@/lib/types";

export const metadata = {
  title: "Shop",
};

type SortKey = NonNullable<Filters["sort"]>;
const VALID_SORTS: SortKey[] = [
  "featured",
  "newest",
  "price-asc",
  "price-desc",
];

// Next.js 15+: searchParams is a Promise.
interface ShopPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    type?: string;
    sort?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;

  const filters: Filters = {
    query: sp.q,
    category: sp.category,
    type:
      sp.type === "product" || sp.type === "service"
        ? (sp.type as ListingType)
        : undefined,
    sort: VALID_SORTS.includes(sp.sort as SortKey)
      ? (sp.sort as SortKey)
      : "featured",
  };

  const [listings, categories] = await Promise.all([
    searchListings(filters),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Shop
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {listings.length} listing{listings.length === 1 ? "" : "s"}
          {filters.category ? ` in ${filters.category}` : ""}
          {filters.type ? ` · ${filters.type}s only` : ""}
          {filters.query ? ` matching “${filters.query}”` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <Suspense fallback={null}>
          <ShopFilters categories={categories} />
        </Suspense>
        <ListingGrid listings={listings} />
      </div>
    </div>
  );
}
