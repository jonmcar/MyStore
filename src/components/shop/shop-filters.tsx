"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ShopFiltersProps {
  categories: string[];
}

export function ShopFilters({ categories }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeQuery = searchParams.get("q") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeSort = searchParams.get("sort") ?? "featured";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => router.push(pathname, { scroll: false });
  const hasAnyFilter =
    activeQuery || activeCategory || activeType || activeSort !== "featured";

  return (
    <aside className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="filter-search" className="text-sm font-medium">
          Search
        </Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="filter-search"
            type="search"
            placeholder="Search listings…"
            defaultValue={activeQuery}
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setParam("q", e.currentTarget.value || null);
              }
            }}
          />
        </div>
      </div>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Type</legend>
        <RadioGroup
          value={activeType || "all"}
          onValueChange={(v) => setParam("type", v === "all" ? null : v)}
        >
          {[
            { v: "all", label: "Everything" },
            { v: "product", label: "Products" },
            { v: "service", label: "Services" },
          ].map((opt) => (
            <div key={opt.v} className="flex items-center gap-2">
              <RadioGroupItem value={opt.v} id={`type-${opt.v}`} />
              <Label
                htmlFor={`type-${opt.v}`}
                className="cursor-pointer text-sm font-normal"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Category</legend>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={activeCategory === cat}
                onCheckedChange={(checked) =>
                  setParam("category", checked ? cat : null)
                }
              />
              <Label
                htmlFor={`cat-${cat}`}
                className="cursor-pointer text-sm font-normal"
              >
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </fieldset>

      <Separator />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Sort by</legend>
        <RadioGroup
          value={activeSort}
          onValueChange={(v) =>
            setParam("sort", v === "featured" ? null : v)
          }
        >
          {[
            { v: "featured", label: "Featured" },
            { v: "newest", label: "Newest" },
            { v: "price-asc", label: "Price: low to high" },
            { v: "price-desc", label: "Price: high to low" },
          ].map((opt) => (
            <div key={opt.v} className="flex items-center gap-2">
              <RadioGroupItem value={opt.v} id={`sort-${opt.v}`} />
              <Label
                htmlFor={`sort-${opt.v}`}
                className="cursor-pointer text-sm font-normal"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>

      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </aside>
  );
}
