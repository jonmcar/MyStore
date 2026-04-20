import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface PriceDisplayProps {
  priceCents: number;
  compareAtCents?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
} as const;

export function PriceDisplay({
  priceCents,
  compareAtCents,
  size = "md",
  className,
}: PriceDisplayProps) {
  const onSale =
    typeof compareAtCents === "number" && compareAtCents > priceCents;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-medium tabular-nums",
          SIZE_CLASSES[size],
          onSale && "text-destructive"
        )}
      >
        {formatMoney(priceCents)}
      </span>
      {onSale && (
        <span className="text-muted-foreground text-sm line-through tabular-nums">
          {formatMoney(compareAtCents!)}
        </span>
      )}
    </span>
  );
}
