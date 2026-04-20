import { ListingForm } from "@/components/admin/listing-form";
import { getCategories } from "@/lib/data";

export const metadata = { title: "New listing · Admin" };

export default async function NewListingPage() {
  const categories = await getCategories();
  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <ListingForm mode="create" categories={categories} />
    </div>
  );
}
