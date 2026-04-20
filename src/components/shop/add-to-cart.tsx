"use client";

import { useState, useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import {
  OptionPicker,
  type OptionValues,
  type OptionRawValue,
} from "@/components/shop/option-picker";
import { useCartStore } from "@/lib/cart-store";
import { effectiveAvailability, AVAILABILITY_LABELS } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import type { Listing, ListingOption } from "@/lib/types";

interface AddToCartProps {
  listing: Listing;
}

/** Is the raw value missing/empty for this option type? */
function isEmpty(option: ListingOption, raw: OptionRawValue): boolean {
  switch (option.type) {
    case "select":
      return typeof raw !== "string" || raw === "";
    case "multi-select":
      return !Array.isArray(raw) || raw.length === 0;
    case "text":
    case "textarea":
      return typeof raw !== "string" || raw.trim() === "";
    case "number":
      return typeof raw !== "string" || raw.trim() === "";
    case "file":
      return !raw || typeof raw !== "object" || !("name" in raw);
    case "datetime":
      return typeof raw !== "string" || raw === "";
  }
}

/** Apply option-specific bounds (min/max for multi-select, etc.) */
function failsBounds(option: ListingOption, raw: OptionRawValue): boolean {
  if (option.type === "multi-select" && Array.isArray(raw)) {
    if (
      typeof option.minSelections === "number" &&
      raw.length < option.minSelections
    ) {
      return true;
    }
    if (
      typeof option.maxSelections === "number" &&
      raw.length > option.maxSelections
    ) {
      return true;
    }
  }
  return false;
}

/** Build the display string captured for the cart line. Returns null
 * if the value should be skipped (empty, non-required). */
function toDisplayValue(
  option: ListingOption,
  raw: OptionRawValue
): string | null {
  if (isEmpty(option, raw)) return null;
  switch (option.type) {
    case "select": {
      const choice = option.choices.find((c) => c.id === raw);
      return choice?.label ?? null;
    }
    case "multi-select": {
      const ids = raw as string[];
      const labels = option.choices
        .filter((c) => ids.includes(c.id))
        .map((c) => c.label);
      return labels.length > 0 ? labels.join(", ") : null;
    }
    case "text":
    case "textarea":
      return (raw as string).trim();
    case "number":
      return (raw as string).trim();
    case "file":
      return (raw as { name: string }).name;
    case "datetime":
      return raw as string;
  }
}

/** Sum of price modifiers for the current selections. Positive = add. */
function computeModifierCents(
  options: ListingOption[],
  values: OptionValues
): number {
  let total = 0;
  for (const option of options) {
    const raw = values[option.id];
    if (isEmpty(option, raw)) continue;
    if (option.type === "select") {
      const choice = option.choices.find((c) => c.id === raw);
      if (choice?.priceModifierCents) total += choice.priceModifierCents;
    } else if (option.type === "multi-select") {
      const ids = raw as string[];
      for (const id of ids) {
        const choice = option.choices.find((c) => c.id === id);
        if (choice?.priceModifierCents) total += choice.priceModifierCents;
      }
    }
  }
  return total;
}

export function AddToCart({ listing }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [values, setValues] = useState<OptionValues>({});
  const [missing, setMissing] = useState<string[]>([]);
  const addItem = useCartStore((s) => s.addItem);

  const options = listing.options ?? [];
  const availability = effectiveAvailability(listing);
  const isBlocked = availability !== "available";

  const modifierCents = useMemo(
    () => computeModifierCents(options, values),
    [options, values]
  );
  const effectivePriceCents = listing.priceCents + modifierCents;

  const handleAdd = () => {
    // Validate required + bounds
    const missingIds = options
      .filter((o) => {
        const raw = values[o.id];
        if (o.required && isEmpty(o, raw)) return true;
        if (failsBounds(o, raw)) return true;
        return false;
      })
      .map((o) => o.id);

    if (missingIds.length > 0) {
      setMissing(missingIds);
      toast.error("Almost there", {
        description: `Please complete ${missingIds.length === 1 ? "the required option" : "all required options"} above.`,
      });
      const first = document.getElementById(`option-${missingIds[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setMissing([]);

    // Build snapshot for the cart line
    const selectedOptions = options
      .map((option) => {
        const raw = values[option.id];
        const value = toDisplayValue(option, raw);
        if (value === null) return null;
        return { optionName: option.name, value };
      })
      .filter((x): x is { optionName: string; value: string } => x !== null);

    addItem(
      listing,
      quantity,
      selectedOptions.length > 0 ? selectedOptions : undefined,
      effectivePriceCents
    );

    toast.success("Added to cart", {
      description:
        selectedOptions.length > 0
          ? `${listing.name} — ${selectedOptions.map((s) => s.value).slice(0, 3).join(" · ")}`
          : `${listing.name}${quantity > 1 ? ` × ${quantity}` : ""}`,
    });

    setValues({});
    setQuantity(1);
  };

  if (isBlocked) {
    return (
      <Button size="lg" disabled className="w-full sm:w-auto">
        {AVAILABILITY_LABELS[availability]}
      </Button>
    );
  }

  return (
    <div className="space-y-5">
      {options.length > 0 && (
        <OptionPicker
          options={options}
          value={values}
          onChange={(next) => {
            setValues(next);
            setMissing((prev) =>
              prev.filter((id) => {
                const opt = options.find((o) => o.id === id);
                if (!opt) return false;
                const raw = next[id];
                return isEmpty(opt, raw) || failsBounds(opt, raw);
              })
            );
          }}
          missing={missing}
        />
      )}

      {modifierCents !== 0 && (
        <div className="bg-muted/50 flex items-baseline justify-between rounded-md px-3 py-2 text-sm">
          <span className="text-muted-foreground">Your total per unit</span>
          <span className="font-semibold tabular-nums">
            {formatMoney(effectivePriceCents)}
            <span className="text-muted-foreground ml-1 text-xs font-normal">
              ({modifierCents > 0 ? "+" : "−"}
              {formatMoney(Math.abs(modifierCents))} options)
            </span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={quantity} onChange={setQuantity} />
        <Button size="lg" onClick={handleAdd} className="flex-1 sm:flex-none">
          <ShoppingBag className="mr-2 h-4 w-4" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
