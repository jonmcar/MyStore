import { StorefrontEditor } from "@/components/admin/storefront-editor";
import { getStorefrontContent } from "@/lib/data";

export const metadata = { title: "Storefront · Admin" };

export default async function AdminStorefrontPage() {
  const content = await getStorefrontContent();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Storefront
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Edit the home page. The hero stays pinned at the top; everything
          else can be reordered, hidden, or edited. Changes go live the
          moment you save.
        </p>
      </div>
      <StorefrontEditor initial={content} />
    </div>
  );
}
