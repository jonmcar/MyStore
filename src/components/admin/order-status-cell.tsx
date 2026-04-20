"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction } from "@/lib/actions";
import { ORDER_STATUSES } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface OrderStatusCellProps {
  orderId: string;
  status: OrderStatus;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  "ready-for-pickup": "Ready for pickup",
  shipped: "Shipped",
  refunded: "Refunded",
};

/** Tailwind color classes for each status so the select trigger visually
 * echoes the state at a glance. */
const STATUS_STYLES: Record<OrderStatus, string> = {
  placed:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  "ready-for-pickup":
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  shipped:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  refunded:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

export function OrderStatusCell({ orderId, status }: OrderStatusCellProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleChange = (next: string) => {
    if (next === status) return;
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, next as OrderStatus);
      if (res.ok) {
        toast.success("Status updated", {
          description: `${orderId} → ${STATUS_LABELS[res.order.status]}`,
        });
        router.refresh();
      } else {
        toast.error("Couldn't update status", { description: res.error });
      }
    });
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger
        className={cn("h-8 w-[170px] text-xs", STATUS_STYLES[status])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
