import { notFound } from "next/navigation";
import { ListingForm } from "@/components/admin/listing-form";
import { getListingByIdAdmin, getCategories } from "@/lib/data";

export const metadata = { title: "Edit listing · Admin" };

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const { id } = await params;
  const [listing, categories] = await Promise.all([
    getListingByIdAdmin(id),
    getCategories(),
  ]);
  if (!listing) notFound();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <ListingForm mode="edit" initial={listing} categories={categories} />
    </div>
  );
}
