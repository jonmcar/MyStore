"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ImageListEditor } from "./image-list-editor";
import { TagInput } from "./tag-input";
import { OptionsEditor } from "./options-editor";
import {
  createListingAction,
  updateListingAction,
} from "@/lib/actions";
import type {
  Listing,
  ListingType,
  ListingOption,
  AvailabilityStatus,
  ProductListing,
  ServiceListing,
} from "@/lib/types";
import { AVAILABILITY_STATUSES, AVAILABILITY_LABELS } from "@/lib/types";

interface ListingFormProps {
  mode: "create" | "edit";
  /** When editing, the existing listing */
  initial?: Listing;
  categories: string[];
}

interface FormState {
  type: ListingType;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  priceDollars: string;
  compareAtDollars: string;
  category: string;
  newCategory: string;
  tags: string[];
  images: string[];
  options: ListingOption[];
  featured: boolean;
  inStock: boolean;
  isPublished: boolean;
  availability: AvailabilityStatus;
  processingTime: string;
  // Product
  sku: string;
  weightGrams: string;
  stockCount: string;
  // Service
  /** Whether this service has a fixed duration. When false, the duration
   * input hides and no duration chip renders on the product page. */
  hasFixedDuration: boolean;
  durationMinutes: string;
  locationType: "in-person" | "remote" | "either";
  locationLabel: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function initialState(initial?: Listing): FormState {
  if (initial) {
    const isProduct = initial.type === "product";
    const hasFixedDuration =
      !isProduct && typeof initial.durationMinutes === "number";
    return {
      type: initial.type,
      name: initial.name,
      slug: initial.slug,
      tagline: initial.tagline,
      description: initial.description,
      priceDollars: (initial.priceCents / 100).toFixed(2),
      compareAtDollars:
        typeof initial.compareAtCents === "number"
          ? (initial.compareAtCents / 100).toFixed(2)
          : "",
      category: initial.category,
      newCategory: "",
      tags: [...initial.tags],
      images: [...initial.images],
      options: initial.options ? [...initial.options] : [],
      featured: initial.featured,
      inStock: initial.inStock,
      isPublished: initial.isPublished,
      availability: initial.availability ?? "available",
      processingTime: initial.processingTime ?? "",
      sku: isProduct ? initial.sku : "",
      weightGrams:
        isProduct && typeof initial.weightGrams === "number"
          ? String(initial.weightGrams)
          : "",
      stockCount:
        isProduct && typeof initial.stockCount === "number"
          ? String(initial.stockCount)
          : "",
      hasFixedDuration,
      durationMinutes:
        hasFixedDuration ? String(initial.durationMinutes) : "60",
      locationType: !isProduct ? initial.locationType : "in-person",
      locationLabel: !isProduct ? (initial.locationLabel ?? "") : "",
    };
  }
  return {
    type: "product",
    name: "",
    slug: "",
    tagline: "",
    description: "",
    priceDollars: "",
    compareAtDollars: "",
    category: "",
    newCategory: "",
    tags: [],
    images: [],
    options: [],
    featured: false,
    inStock: true,
    isPublished: false,
    availability: "available",
    processingTime: "",
    sku: "",
    weightGrams: "",
    stockCount: "",
    hasFixedDuration: true,
    durationMinutes: "60",
    locationType: "in-person",
    locationLabel: "",
  };
}

const ADD_NEW_CATEGORY = "__new__";

export function ListingForm({ mode, initial, categories }: ListingFormProps) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialState(initial));
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const onNameChange = (name: string) => {
    setState((s) => ({
      ...s,
      name,
      slug: slugTouched ? s.slug : slugify(name),
    }));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!state.name.trim()) e.name = "Name is required";
    if (!state.slug.trim()) e.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(state.slug))
      e.slug = "Lowercase letters, numbers, and dashes only";
    if (!state.tagline.trim()) e.tagline = "Tagline is required";
    if (!state.description.trim() || state.description.trim().length < 10)
      e.description = "Description should be at least a sentence or two";
    const resolvedCategory =
      state.category === ADD_NEW_CATEGORY
        ? state.newCategory.trim()
        : state.category;
    if (!resolvedCategory) e.category = "Category is required";
    const price = Number(state.priceDollars);
    if (!state.priceDollars || isNaN(price) || price < 0)
      e.priceDollars = "Enter a valid price";
    if (state.compareAtDollars) {
      const cmp = Number(state.compareAtDollars);
      if (isNaN(cmp) || cmp < 0)
        e.compareAtDollars = "Enter a valid price, or leave empty";
      else if (cmp > 0 && cmp <= price)
        e.compareAtDollars =
          "Compare-at should be higher than the selling price";
    }
    if (state.images.length === 0) e.images = "Add at least one image";

    if (state.type === "product") {
      if (!state.sku.trim()) e.sku = "SKU is required for products";
    } else if (state.hasFixedDuration) {
      const dur = Number(state.durationMinutes);
      if (!state.durationMinutes || isNaN(dur) || dur <= 0)
        e.durationMinutes = "Enter a duration in minutes";
    }
    return e;
  };

  const buildPayload = (): Omit<ProductListing, "id" | "createdAt"> | Omit<ServiceListing, "id" | "createdAt"> => {
    const priceCents = Math.round(Number(state.priceDollars) * 100);
    // NOTE: For optional fields that the shopper may want to clear, we
    // send `null` instead of `undefined`. JSON.stringify drops keys
    // with undefined values, which means an "untouched" patch and an
    // "explicitly cleared" patch look identical on the server. The
    // server data layer treats null as "clear this field".
    //
    // TypeScript-wise, the Listing type has these as `T | undefined`
    // rather than `T | null | undefined`, so we cast here — the null
    // never makes it into stored state (the data layer converts it
    // back to "key absent").
    const compareAtCents = state.compareAtDollars
      ? Math.round(Number(state.compareAtDollars) * 100)
      : (null as unknown as undefined);
    const category =
      state.category === ADD_NEW_CATEGORY
        ? state.newCategory.trim()
        : state.category;

    const base = {
      slug: state.slug,
      name: state.name.trim(),
      tagline: state.tagline.trim(),
      description: state.description.trim(),
      priceCents,
      compareAtCents,
      images: state.images,
      category,
      tags: state.tags,
      options:
        state.options.length > 0
          ? state.options
          : (null as unknown as undefined),
      featured: state.featured,
      inStock: state.inStock,
      isPublished: state.isPublished,
      availability:
        state.availability === "available"
          ? (null as unknown as undefined)
          : state.availability,
      processingTime:
        state.processingTime.trim() || (null as unknown as undefined),
    };

    if (state.type === "product") {
      return {
        ...base,
        type: "product",
        sku: state.sku.trim(),
        weightGrams: state.weightGrams
          ? Number(state.weightGrams)
          : (null as unknown as undefined),
        stockCount: state.stockCount
          ? Number(state.stockCount)
          : (null as unknown as undefined),
      };
    }
    return {
      ...base,
      type: "service",
      durationMinutes: state.hasFixedDuration
        ? Number(state.durationMinutes)
        : (null as unknown as undefined),
      locationType: state.locationType,
      locationLabel:
        state.locationLabel.trim() || (null as unknown as undefined),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix the highlighted fields");
      // Scroll to first error
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    const payload = buildPayload();
    startTransition(async () => {
      if (mode === "create") {
        const res = await createListingAction(payload);
        if (res.ok) {
          toast.success("Listing created", { description: res.listing.name });
          router.push(`/admin/listings/${res.listing.id}/edit`);
        } else {
          toast.error("Couldn't create listing", { description: res.error });
        }
      } else if (initial) {
        const res = await updateListingAction(initial.id, payload);
        if (res.ok) {
          toast.success("Changes saved");
          router.refresh();
        } else {
          toast.error("Couldn't save changes", { description: res.error });
        }
      }
    });
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-destructive mt-1 text-xs">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/listings"
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {mode === "create" ? "New listing" : state.name || "Edit listing"}
            </h1>
            {mode === "edit" && (
              <Badge variant={state.isPublished ? "default" : "secondary"}>
                {state.isPublished ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/listings">Cancel</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            <Save className="mr-2 h-4 w-4" />
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Type toggle */}
      <section className="space-y-3">
        <Label>Listing type</Label>
        <RadioGroup
          value={state.type}
          onValueChange={(v) => set("type", v as ListingType)}
          className="grid grid-cols-2 gap-3 sm:max-w-md"
        >
          {[
            { v: "product", label: "Product", desc: "Something that ships" },
            {
              v: "service",
              label: "Service",
              desc: "A class, consultation, or booking",
            },
          ].map((opt) => (
            <Label
              key={opt.v}
              htmlFor={`type-${opt.v}`}
              className="hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3"
            >
              <RadioGroupItem value={opt.v} id={`type-${opt.v}`} />
              <div>
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-muted-foreground text-xs">{opt.desc}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </section>

      <Separator />

      {/* Basics */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Basics</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={state.name}
              onChange={(e) => onNameChange(e.target.value)}
            />
            {fieldError("name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={state.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className="font-mono text-sm"
            />
            {fieldError("slug")}
            <p className="text-muted-foreground text-xs">
              Used in the URL: /shop/<span className="font-mono">{state.slug || "…"}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={state.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Short marketing line shown on cards"
          />
          {fieldError("tagline")}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={state.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            placeholder="The full description shown on the product page."
          />
          {fieldError("description")}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={state.category}
              onValueChange={(v) => set("category", v)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value={ADD_NEW_CATEGORY}>
                  + Add new category…
                </SelectItem>
              </SelectContent>
            </Select>
            {state.category === ADD_NEW_CATEGORY && (
              <Input
                value={state.newCategory}
                onChange={(e) => set("newCategory", e.target.value)}
                placeholder="New category name"
                className="mt-2"
              />
            )}
            {fieldError("category")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              id="tags"
              value={state.tags}
              onChange={(v) => set("tags", v)}
              placeholder="Type a tag, press Enter…"
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Images */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Images</h2>
        <p className="text-muted-foreground text-sm">
          Paste image URLs. For testing, try
          <span className="text-foreground font-mono">
            {" "}
            https://picsum.photos/seed/your-seed/1200/1200
          </span>
          .
        </p>
        <div id="images">
          <ImageListEditor
            value={state.images}
            onChange={(v) => set("images", v)}
          />
        </div>
        {fieldError("images")}
      </section>

      <Separator />

      {/* Pricing */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Pricing</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priceDollars">Price (USD)</Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="priceDollars"
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                value={state.priceDollars}
                onChange={(e) => set("priceDollars", e.target.value)}
              />
            </div>
            {fieldError("priceDollars")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="compareAtDollars">
              Compare-at price{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                id="compareAtDollars"
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                value={state.compareAtDollars}
                onChange={(e) => set("compareAtDollars", e.target.value)}
              />
            </div>
            {fieldError("compareAtDollars")}
            <p className="text-muted-foreground text-xs">
              Shown as a strikethrough next to the sale price.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Customization options */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">
            Customization options{" "}
            <span className="text-muted-foreground text-sm font-normal">
              (optional)
            </span>
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Dropdowns, write-ins, and numeric inputs the shopper fills out
            before adding to cart. Use <em>dropdown</em> for choices like
            size or artisan selection; use <em>long text</em> for
            commission descriptions.
          </p>
        </div>
        <OptionsEditor
          value={state.options}
          onChange={(next) => set("options", next)}
        />
      </section>

      <Separator />

      {/* Type-specific */}
      {state.type === "product" ? (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">Product details</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={state.sku}
                onChange={(e) => set("sku", e.target.value)}
                className="font-mono text-sm"
              />
              {fieldError("sku")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightGrams">
                Weight{" "}
                <span className="text-muted-foreground font-normal">(g)</span>
              </Label>
              <Input
                id="weightGrams"
                type="number"
                min="0"
                value={state.weightGrams}
                onChange={(e) => set("weightGrams", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockCount">
                Stock count{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="stockCount"
                type="number"
                min="0"
                value={state.stockCount}
                onChange={(e) => set("stockCount", e.target.value)}
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-5">
          <h2 className="text-lg font-semibold">Service details</h2>

          <SwitchRow
            id="hasFixedDuration"
            label="Has a fixed duration"
            description="Turn off for services where the shopper picks the length via a customization option (e.g. 'how many hours')."
            checked={state.hasFixedDuration}
            onChange={(v) => set("hasFixedDuration", v)}
          />

          <div className="grid gap-5 md:grid-cols-2">
            {state.hasFixedDuration && (
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={state.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                />
                {fieldError("durationMinutes")}
              </div>
            )}
            <div className="space-y-2">
              <Label>Location</Label>
              <RadioGroup
                value={state.locationType}
                onValueChange={(v) =>
                  set("locationType", v as FormState["locationType"])
                }
                className="grid grid-cols-3 gap-2"
              >
                {[
                  { v: "in-person", label: "In person" },
                  { v: "remote", label: "Remote" },
                  { v: "either", label: "Either" },
                ].map((opt) => (
                  <Label
                    key={opt.v}
                    htmlFor={`loc-${opt.v}`}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                  >
                    <RadioGroupItem value={opt.v} id={`loc-${opt.v}`} />
                    {opt.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationLabel">
              Location label{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="locationLabel"
              value={state.locationLabel}
              onChange={(e) => set("locationLabel", e.target.value)}
              placeholder="e.g. Oakland studio"
            />
          </div>
        </section>
      )}

      <Separator />

      {/* Visibility */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">Visibility & inventory</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            <Select
              value={state.availability}
              onValueChange={(v) =>
                set("availability", v as AvailabilityStatus)
              }
            >
              <SelectTrigger id="availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {AVAILABILITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              &ldquo;Available&rdquo; defers to stock levels. Pick
              &ldquo;Sold out&rdquo; or &ldquo;Unavailable&rdquo; to force a
              non-purchasable state (e.g. paused while you restock, or
              temporarily closed to orders).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="processingTime">
              Processing time{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="processingTime"
              value={state.processingTime}
              onChange={(e) => set("processingTime", e.target.value)}
              placeholder="e.g. Ships in 2–3 business days"
            />
            <p className="text-muted-foreground text-xs">
              Short freeform line shown on the product page. Hide by
              leaving empty.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <SwitchRow
            id="isPublished"
            label="Published"
            description="Unpublished drafts are hidden from the public shop."
            checked={state.isPublished}
            onChange={(v) => set("isPublished", v)}
          />
          <SwitchRow
            id="featured"
            label="Featured"
            description='Show this listing in the "Featured this week" section on the home page.'
            checked={state.featured}
            onChange={(v) => set("featured", v)}
          />
          <SwitchRow
            id="inStock"
            label="In stock"
            description={
              state.type === "product"
                ? "Available for purchase."
                : "Available for booking."
            }
            checked={state.inStock}
            onChange={(v) => set("inStock", v)}
          />
        </div>
      </section>
    </form>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
