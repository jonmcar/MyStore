import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderById } from "@/lib/data";
import { formatMoney, formatDate } from "@/lib/format";
import { STORE } from "@/lib/config";

interface SuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

export const metadata = { title: "Order confirmed" };

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const { order: orderId } = await searchParams;

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">No order specified.</h1>
        <Button asChild className="mt-4">
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const order = await getOrderById(orderId);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Thanks for your order.
        </h1>
        <p className="text-muted-foreground mt-2">
          A confirmation is on its way to{" "}
          <span className="text-foreground font-medium">
            {order?.email ?? "your email"}
          </span>
          .
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          Order reference:{" "}
          <span className="text-foreground font-mono">{orderId}</span>
        </p>
      </div>

      {order ? (
        <div className="mt-10 rounded-lg border p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Order details</h2>
            <span className="text-muted-foreground text-xs">
              Placed {formatDate(order.placedAt)}
            </span>
          </div>
          <Separator className="my-4" />
          <ul className="space-y-3 text-sm">
            {order.items.map((item) => (
              <li
                key={item.lineItemId}
                className="flex items-start justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{item.nameAtAdd}</p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {item.selectedOptions
                        .map((o) => `${o.optionName}: ${o.value}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {item.quantity} × {formatMoney(item.priceCentsAtAdd)}
                  </p>
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
              <dd className="tabular-nums">
                {formatMoney(order.subtotalCents)}
              </dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <dt>
                  Discount{" "}
                  {order.appliedDiscount && (
                    <span className="font-mono text-xs">
                      ({order.appliedDiscount.code})
                    </span>
                  )}
                </dt>
                <dd className="tabular-nums">
                  −{formatMoney(order.discountCents)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {order.shippingCents === 0
                  ? "Free"
                  : formatMoney(order.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd className="tabular-nums">{formatMoney(order.taxCents)}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold tabular-nums">
              {formatMoney(order.totalCents)}
            </span>
          </div>

          {order.shippingAddress && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <p className="mb-1 font-medium">Shipping to</p>
                <address className="text-muted-foreground not-italic">
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && (
                    <>
                      <br />
                      {order.shippingAddress.line2}
                    </>
                  )}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
                  {order.shippingAddress.postalCode}
                </address>
              </div>
            </>
          )}

          {order.customerNotes && (
            <>
              <Separator className="my-4" />
              <div className="text-sm">
                <p className="mb-1 font-medium">Your special instructions</p>
                <p className="text-muted-foreground whitespace-pre-line italic">
                  &ldquo;{order.customerNotes}&rdquo;
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground mt-10 rounded-lg border border-dashed p-6 text-center text-sm">
          Couldn&apos;t find that order. It may have been placed before the
          server restarted.
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/shop">
            Continue shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to {STORE.name}</Link>
        </Button>
      </div>
    </div>
  );
}
