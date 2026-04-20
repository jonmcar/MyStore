import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingsTable } from "@/components/admin/listings-table";
import { getAllListingsAdmin } from "@/lib/data";

export const metadata = { title: "Listings · Admin" };

export default async function AdminListingsPage() {
  const listings = await getAllListingsAdmin();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Listings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage products and services on the storefront.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New listing
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <ListingsTable listings={listings} />
      </div>
    </div>
  );
}
