import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecentOrders } from "@/lib/data";
import { formatMoney, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  "ready-for-pickup": "Ready for pickup",
  shipped: "Shipped",
  refunded: "Refunded",
};

export async function RecentOrdersCard() {
  const recent = await getRecentOrders(5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
            <Receipt className="h-8 w-8 opacity-30" />
            <p>No orders yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {recent.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs">{order.id}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {order.email} · {formatDate(order.placedAt)}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {STATUS_LABELS[order.status]}
                </Badge>
                <div className="shrink-0 text-right tabular-nums">
                  {formatMoney(order.totalCents)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
