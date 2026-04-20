"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/shop/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { formatMoney } from "@/lib/format";

export function CartSheet() {
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotalCents = useCartStore((s) => s.subtotalCents());
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // During SSR the badge would always be 0; only render it post-hydration.
  const count = hasHydrated ? itemCount : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]"
              aria-hidden
            >
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            {count === 0
              ? "Your cart is empty."
              : `${count} item${count === 1 ? "" : "s"} ready for checkout.`}
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 text-sm">
            <ShoppingBag className="h-10 w-10 opacity-30" />
            <p>Nothing here yet.</p>
            <SheetClose asChild>
              <Button asChild variant="outline" size="sm">
                <Link href="/shop">Browse the shop</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 space-y-4 overflow-y-auto px-6">
              {items.map((item) => (
                <div key={item.lineItemId} className="flex gap-3">
                  <Link
                    href={`/shop/${item.slugAtAdd}`}
                    className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-md"
                  >
                    {item.imageAtAdd && (
                      <Image
                        src={item.imageAtAdd}
                        alt={item.nameAtAdd}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/shop/${item.slugAtAdd}`}
                        className="line-clamp-2 text-sm leading-tight font-medium hover:underline"
                      >
                        {item.nameAtAdd}
                      </Link>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                          {item.selectedOptions
                            .map((o) => `${o.optionName}: ${o.value}`)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatMoney(item.priceCentsAtAdd)} each
                      </p>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <QuantitySelector
                        value={item.quantity}
                        onChange={(q) => setQuantity(item.lineItemId, q)}
                        size="sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-7 w-7"
                        onClick={() => removeItem(item.lineItemId)}
                        aria-label={`Remove ${item.nameAtAdd}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4">
              <Separator />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-base font-medium tabular-nums">
                  {formatMoney(subtotalCents)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Tax and shipping calculated at checkout.
              </p>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <SheetClose asChild>
                  <Button asChild size="lg" className="w-full">
                    <Link href="/checkout">Checkout</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/cart">View full cart</Link>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
