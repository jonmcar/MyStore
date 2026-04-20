import { DiscountsTable } from "@/components/admin/discounts-table";
import { getAllDiscountCodes } from "@/lib/data";

export const metadata = { title: "Discounts · Admin" };

export default async function AdminDiscountsPage() {
  const codes = await getAllDiscountCodes();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Discounts
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Promotional codes shoppers can enter at checkout. Percent or fixed
          amount off, with optional minimum subtotal, expiry, and usage cap.
        </p>
      </div>
      <DiscountsTable codes={codes} />
    </div>
  );
}
