"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, TicketPercent, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/lib/cart-store";
import { useSessionStore } from "@/lib/session-store";
import {
  placeOrderAction,
  validateDiscountCodeAction,
} from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { STORE } from "@/lib/config";
import type { Address } from "@/lib/types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

interface AppliedDiscountPreview {
  code: string;
  description: string;
  discountCents: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const clearCart = useCartStore((s) => s.clear);
  const subtotalCents = useCartStore((s) => s.subtotalCents());

  const session = useSessionStore((s) => s.session);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    line1: "",
    line2: "",
    city: "",
    region: "CA",
    postalCode: "",
    country: "US",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });
  const [customerNotes, setCustomerNotes] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discount, setDiscount] = useState<AppliedDiscountPreview | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  // Compute totals on the client reactively based on subtotal + discount.
  // The server re-validates these on placement so this is presentational only.
  const discountCents = discount?.discountCents ?? 0;
  const discountedSubtotal = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(discountedSubtotal * STORE.taxRate);
  const hasShippable = items.some((i) => i.typeAtAdd === "product");
  const shippingCents =
    !hasShippable || discountedSubtotal >= STORE.freeShippingOverCents
      ? 0
      : STORE.flatShippingCents;
  const totalCents = discountedSubtotal + taxCents + shippingCents;

  // If subtotal drops below the discount's minimum after item removal,
  // silently drop the applied discount.
  useEffect(() => {
    if (discount && discountCents > subtotalCents) {
      setDiscount(null);
      setDiscountInput("");
    }
  }, [subtotalCents, discount, discountCents]);

  // Prefill email if signed in
  useEffect(() => {
    if (session.email && !form.email) {
      setForm((f) => ({
        ...f,
        email: session.email ?? "",
        name: session.name ?? "",
      }));
    }
  }, [session.email, session.name, form.email]);

  // If someone lands here with an empty cart, bounce them back.
  useEffect(() => {
    if (hasHydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hasHydrated, items.length, router]);

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const isValid =
    form.email &&
    form.name &&
    form.line1 &&
    form.city &&
    form.region &&
    form.postalCode &&
    form.cardNumber.replace(/\s/g, "").length >= 12 &&
    form.cardExpiry &&
    form.cardCvc;

  const applyDiscount = async () => {
    const code = discountInput.trim();
    if (!code) return;
    setValidatingDiscount(true);
    const res = await validateDiscountCodeAction(code, subtotalCents);
    setValidatingDiscount(false);
    if (!res.ok) {
      toast.error("Code not applied", { description: res.error });
      return;
    }
    setDiscount({
      code: code.toUpperCase(),
      description: res.description,
      discountCents: res.discountCents,
    });
    toast.success("Discount applied", {
      description: `${res.description} — you save ${formatMoney(res.discountCents)}`,
    });
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountInput("");
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    // Simulate network payment latency
    await new Promise((r) => setTimeout(r, 600));

    const shippingAddress: Address = {
      name: form.name,
      line1: form.line1,
      line2: form.line2 || undefined,
      city: form.city,
      region: form.region,
      postalCode: form.postalCode,
      country: form.country,
    };

    const result = await placeOrderAction({
      items: [...items],
      email: form.email,
      shippingAddress,
      discountCode: discount?.code,
      customerNotes: customerNotes.trim() || undefined,
    });

    if (!result.ok) {
      setSubmitting(false);
      toast.error("Couldn't place order", { description: result.error });
      return;
    }

    clearCart();
    router.push(`/checkout/success?order=${result.order.id}`);
  };

  if (!hasHydrated || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/cart"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cart
      </Link>

      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        Checkout
      </h1>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-8"
        >
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">Contact</legend>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </fieldset>

          <Separator />

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold">
              Shipping address
            </legend>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line1">Street address</Label>
              <Input
                id="line1"
                required
                value={form.line1}
                onChange={(e) => setField("line1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line2">Apt, suite, etc. (optional)</Label>
              <Input
                id="line2"
                value={form.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px_160px]">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">State</Label>
                <Select
                  value={form.region}
                  onValueChange={(v) => setField("region", v)}
                >
                  <SelectTrigger id="region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">ZIP</Label>
                <Input
                  id="postalCode"
                  required
                  inputMode="numeric"
                  value={form.postalCode}
                  onChange={(e) =>
                    setField("postalCode", e.target.value)
                  }
                />
              </div>
            </div>
          </fieldset>

          <Separator />

          <fieldset className="space-y-4">
            <legend className="flex items-center gap-2 text-lg font-semibold">
              <Lock className="h-4 w-4" />
              Payment
            </legend>
            <p className="text-muted-foreground -mt-2 text-xs">
              Demo mode — any values work. No real card is charged.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card number</Label>
              <Input
                id="cardNumber"
                required
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={(e) => setField("cardNumber", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry</Label>
                <Input
                  id="cardExpiry"
                  required
                  placeholder="MM / YY"
                  value={form.cardExpiry}
                  onChange={(e) => setField("cardExpiry", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCvc">CVC</Label>
                <Input
                  id="cardCvc"
                  required
                  placeholder="123"
                  inputMode="numeric"
                  value={form.cardCvc}
                  onChange={(e) => setField("cardCvc", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <Separator />

          {/* Customer notes */}
          <fieldset className="space-y-3">
            <legend className="text-lg font-semibold">
              Special instructions{" "}
              <span className="text-muted-foreground text-sm font-normal">
                (optional)
              </span>
            </legend>
            <p className="text-muted-foreground -mt-1 text-xs">
              Gift messages, allergy notes, delivery notes — anything we
              should know before fulfilling this order.
            </p>
            <Textarea
              id="customerNotes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Gift — please don't include an invoice."
            />
            {customerNotes.length > 0 && (
              <p className="text-muted-foreground text-right text-xs">
                {customerNotes.length}/500
              </p>
            )}
          </fieldset>

          <Separator />

          {/* Discount code */}
          <fieldset className="space-y-3">
            <legend className="flex items-center gap-2 text-lg font-semibold">
              <TicketPercent className="h-4 w-4" />
              Discount code
            </legend>
            {discount ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <div>
                    <p className="font-mono font-medium">{discount.code}</p>
                    <p className="text-muted-foreground text-xs">
                      {discount.description} — saves{" "}
                      {formatMoney(discount.discountCents)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeDiscount}
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="discountCode"
                  value={discountInput}
                  onChange={(e) =>
                    setDiscountInput(e.target.value.toUpperCase())
                  }
                  placeholder="Enter a code"
                  className="font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyDiscount();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyDiscount}
                  disabled={!discountInput.trim() || validatingDiscount}
                >
                  {validatingDiscount ? "Checking…" : "Apply"}
                </Button>
              </div>
            )}
          </fieldset>

          <Button
            type="submit"
            size="lg"
            disabled={!isValid || submitting}
            className="w-full"
          >
            {submitting
              ? "Placing order…"
              : `Pay ${formatMoney(totalCents)}`}
          </Button>
        </form>

        <aside className="h-fit rounded-lg border p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <Separator className="my-4" />
          <ul className="space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={item.lineItemId}
                className="flex justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-tight">
                    {item.nameAtAdd}
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity}
                    </span>
                  </p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {item.selectedOptions
                        .map((o) => o.value)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 tabular-nums">
                  {formatMoney(item.priceCentsAtAdd * item.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <dt>
                  Discount{" "}
                  {discount && (
                    <span className="font-mono text-xs">({discount.code})</span>
                  )}
                </dt>
                <dd className="tabular-nums">
                  −{formatMoney(discountCents)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {shippingCents === 0 ? "Free" : formatMoney(shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">{formatMoney(taxCents)}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatMoney(totalCents)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
