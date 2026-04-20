import Link from "next/link";
import { Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusCell } from "@/components/admin/order-status-cell";
import { getAllOrders, _countOrders } from "@/lib/data";
import { formatMoney, formatDate } from "@/lib/format";

export const metadata = { title: "Orders · Admin" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  const counts = await _countOrders();

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Orders
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Orders placed through the storefront. Update status inline.
        </p>
      </div>

      {/* Status summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Placed", n: counts.placed },
          { label: "Ready for pickup", n: counts.readyForPickup },
          { label: "Shipped", n: counts.shipped },
          { label: "Refunded", n: counts.refunded },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-baseline justify-between p-4">
              <span className="text-muted-foreground text-sm">{s.label}</span>
              <span className="text-2xl font-semibold tabular-nums">{s.n}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-muted-foreground mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center text-sm">
          <Receipt className="h-10 w-10 opacity-30" />
          <p>No orders yet.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/shop">Place a test order</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Placed</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[180px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="align-top">
                    <span className="font-mono text-xs">{order.id}</span>
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    <div>{order.email}</div>
                    {order.shippingAddress && (
                      <div className="text-muted-foreground text-xs">
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.region}
                      </div>
                    )}
                    {order.customerNotes && (
                      <div className="mt-1 line-clamp-2 max-w-xs rounded bg-blue-50 px-2 py-1 text-xs italic text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                        From customer: &ldquo;{order.customerNotes}&rdquo;
                      </div>
                    )}
                    {order.notes && (
                      <div className="text-muted-foreground mt-1 line-clamp-2 max-w-xs text-xs italic">
                        Admin note: &ldquo;{order.notes}&rdquo;
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top hidden text-sm md:table-cell">
                    {formatDate(order.placedAt)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={item.lineItemId} className="leading-tight">
                          <span className="line-clamp-1">
                            {item.quantity} × {item.nameAtAdd}
                          </span>
                          {item.selectedOptions &&
                            item.selectedOptions.length > 0 && (
                              <span className="text-muted-foreground line-clamp-1 text-xs">
                                {item.selectedOptions
                                  .map((o) => o.value)
                                  .join(" · ")}
                              </span>
                            )}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="align-top text-right tabular-nums">
                    <div>{formatMoney(order.totalCents)}</div>
                    {order.discountCents > 0 && order.appliedDiscount && (
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        <span className="font-mono">
                          {order.appliedDiscount.code}
                        </span>{" "}
                        −{formatMoney(order.discountCents)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <OrderStatusCell
                      orderId={order.id}
                      status={order.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
