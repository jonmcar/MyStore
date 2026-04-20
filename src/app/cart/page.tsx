"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  const subtotalCents = useCartStore((s) => s.subtotalCents());
  const taxCents = useCartStore((s) => s.taxCents());
  const shippingCents = useCartStore((s) => s.shippingCents());
  const totalCents = useCartStore((s) => s.totalCents());

  if (!hasHydrated) {
    return (
      <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-muted-foreground text-sm">Loading your cart…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <ShoppingBag className="text-muted-foreground h-12 w-12" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground text-sm">
            Nothing here yet. Browse the shop and come back when something
            catches your eye.
          </p>
          <Button asChild size="lg" className="mt-2">
            <Link href="/shop">
              Browse the shop
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your cart
        </h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y">
          {items.map((item) => (
            <li key={item.lineItemId} className="flex gap-4 py-6">
              <Link
                href={`/shop/${item.slugAtAdd}`}
                className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-md sm:h-32 sm:w-32"
              >
                {item.imageAtAdd && (
                  <Image
                    src={item.imageAtAdd}
                    alt={item.nameAtAdd}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/shop/${item.slugAtAdd}`}
                      className="font-medium hover:underline"
                    >
                      {item.nameAtAdd}
                    </Link>
                    <p className="text-muted-foreground mt-0.5 text-sm capitalize">
                      {item.typeAtAdd}
                    </p>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <ul className="text-muted-foreground mt-1 space-y-0.5 text-sm">
                        {item.selectedOptions.map((o, i) => (
                          <li key={i}>
                            <span className="text-foreground/80">{o.optionName}:</span>{" "}
                            {o.value}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-muted-foreground mt-1 text-sm">
                      {formatMoney(item.priceCentsAtAdd)} each
                    </p>
                  </div>
                  <div className="text-right font-medium tabular-nums">
                    {formatMoney(item.priceCentsAtAdd * item.quantity)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(q) => setQuantity(item.lineItemId, q)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.lineItemId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border p-6 lg:sticky lg:top-24">
          <h2 className="font-semibold">Order summary</h2>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {shippingCents === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Free
                  </span>
                ) : (
                  formatMoney(shippingCents)
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated tax</dt>
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
          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/checkout">
              Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-muted-foreground"
            onClick={clear}
          >
            Clear cart
          </Button>
        </aside>
      </div>
    </div>
  );
}
