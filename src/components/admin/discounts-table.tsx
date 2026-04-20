"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
  deleteDiscountCodeAction,
} from "@/lib/actions";
import { formatMoney, formatDate } from "@/lib/format";
import type { DiscountCode } from "@/lib/types";

interface DiscountsTableProps {
  codes: DiscountCode[];
}

/** Formats "20%" or "$10.00" for display depending on the code's kind */
function formatAmount(code: DiscountCode): string {
  if (code.kind === "percent") return `${code.amount}%`;
  return formatMoney(code.amount);
}

function isExpired(code: DiscountCode): boolean {
  if (!code.expiresAt) return false;
  return new Date(code.expiresAt) < new Date();
}

function isUsedUp(code: DiscountCode): boolean {
  return (
    typeof code.usageLimit === "number" && code.timesUsed >= code.usageLimit
  );
}

export function DiscountsTable({ codes }: DiscountsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<DiscountCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<DiscountCode | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query.trim()) return codes;
    const q = query.toLowerCase();
    return codes.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [codes, query]);

  const toggleActive = (code: DiscountCode) => {
    startTransition(async () => {
      const res = await updateDiscountCodeAction(code.id, {
        active: !code.active,
      });
      if (res.ok) {
        toast.success(
          res.code.active ? "Code activated" : "Code deactivated"
        );
        router.refresh();
      } else {
        toast.error("Couldn't update", { description: res.error });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      const res = await deleteDiscountCodeAction(target.id);
      if (res.ok) {
        toast.success("Code deleted", { description: target.code });
        router.refresh();
      } else {
        toast.error("Couldn't delete", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search codes…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New code
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead className="hidden md:table-cell">Expires</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  No codes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const expired = isExpired(c);
                const usedUp = isUsedUp(c);
                const dim = !c.active || expired || usedUp;
                return (
                  <TableRow key={c.id} className={dim ? "opacity-60" : ""}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        {c.code}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{c.description}</TableCell>
                    <TableCell className="text-sm font-medium tabular-nums">
                      {formatAmount(c)}
                      {c.kind === "fixed" && (
                        <span className="text-muted-foreground ml-1 text-xs font-normal">
                          off
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!c.active ? (
                        <Badge variant="secondary">Paused</Badge>
                      ) : expired ? (
                        <Badge variant="outline">Expired</Badge>
                      ) : usedUp ? (
                        <Badge variant="outline">Used up</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {c.timesUsed}
                      {typeof c.usageLimit === "number" && (
                        <span className="text-muted-foreground">
                          /{c.usageLimit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {c.expiresAt ? (
                        formatDate(c.expiresAt)
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pending}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(c)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              toast.success("Code copied", {
                                description: c.code,
                              });
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(c)}>
                            {c.active ? "Pause" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleting(c)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DiscountFormDialog
        open={creating}
        mode="create"
        onClose={() => setCreating(false)}
      />
      <DiscountFormDialog
        open={!!editing}
        mode="edit"
        initial={editing ?? undefined}
        onClose={() => setEditing(null)}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this code?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  <span className="text-foreground font-mono font-medium">
                    {deleting.code}
                  </span>{" "}
                  will be permanently removed. Orders that already redeemed
                  it keep their discount.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Create/edit dialog ─────────────────────────────────────────────

interface FormState {
  code: string;
  description: string;
  kind: "percent" | "fixed";
  /** Percent: the percentage integer. Fixed: dollars string. */
  amountInput: string;
  hasMinSubtotal: boolean;
  minSubtotalDollars: string;
  hasExpiry: boolean;
  expiresAt: string; // yyyy-mm-dd
  hasUsageLimit: boolean;
  usageLimit: string;
  active: boolean;
}

function initialForm(code?: DiscountCode): FormState {
  if (!code) {
    return {
      code: "",
      description: "",
      kind: "percent",
      amountInput: "10",
      hasMinSubtotal: false,
      minSubtotalDollars: "",
      hasExpiry: false,
      expiresAt: "",
      hasUsageLimit: false,
      usageLimit: "",
      active: true,
    };
  }
  return {
    code: code.code,
    description: code.description,
    kind: code.kind,
    amountInput:
      code.kind === "percent"
        ? String(code.amount)
        : (code.amount / 100).toFixed(2),
    hasMinSubtotal: typeof code.minSubtotalCents === "number",
    minSubtotalDollars:
      typeof code.minSubtotalCents === "number"
        ? (code.minSubtotalCents / 100).toFixed(2)
        : "",
    hasExpiry: !!code.expiresAt,
    expiresAt: code.expiresAt ? code.expiresAt.slice(0, 10) : "",
    hasUsageLimit: typeof code.usageLimit === "number",
    usageLimit:
      typeof code.usageLimit === "number" ? String(code.usageLimit) : "",
    active: code.active,
  };
}

function DiscountFormDialog({
  open,
  mode,
  initial,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: DiscountCode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialForm(initial));
  const [pending, startTransition] = useTransition();

  // Reset when the dialog opens with a new initial value
  useMemo(() => {
    if (open) setForm(initialForm(initial));
  }, [open, initial]);

  const set = <K extends keyof FormState>(key: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  const buildPayload = () => {
    const amount =
      form.kind === "percent"
        ? Math.round(Number(form.amountInput))
        : Math.round(Number(form.amountInput) * 100);
    // See comment on buildPayload in listing-form.tsx for the null-
    // vs-undefined reasoning here.
    return {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      kind: form.kind,
      amount,
      minSubtotalCents:
        form.hasMinSubtotal && form.minSubtotalDollars
          ? Math.round(Number(form.minSubtotalDollars) * 100)
          : (null as unknown as undefined),
      expiresAt:
        form.hasExpiry && form.expiresAt
          ? new Date(form.expiresAt + "T23:59:59").toISOString()
          : (null as unknown as undefined),
      usageLimit:
        form.hasUsageLimit && form.usageLimit
          ? Number(form.usageLimit)
          : (null as unknown as undefined),
      active: form.active,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    const payload = buildPayload();
    if (payload.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createDiscountCodeAction(payload)
          : await updateDiscountCodeAction(initial!.id, payload);
      if (res.ok) {
        toast.success(
          mode === "create" ? "Code created" : "Changes saved",
          { description: res.code.code }
        );
        router.refresh();
        onClose();
      } else {
        toast.error("Couldn't save", { description: res.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "New discount code" : "Edit code"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Shoppers can enter this code at checkout."
                : "Update this code's behavior. Redemptions on existing orders are unaffected."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. SPRING20"
                  className="font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Kind</Label>
                <RadioGroup
                  value={form.kind}
                  onValueChange={(v) =>
                    set("kind", v as "percent" | "fixed")
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  {[
                    { v: "percent", label: "Percent" },
                    { v: "fixed", label: "Fixed $" },
                  ].map((opt) => (
                    <Label
                      key={opt.v}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
                    >
                      <RadioGroupItem value={opt.v} />
                      {opt.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Shown at checkout when the code is applied"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                {form.kind === "percent"
                  ? "Percentage off"
                  : "Amount off (USD)"}
              </Label>
              <div className="relative">
                {form.kind === "fixed" && (
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                    $
                  </span>
                )}
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step={form.kind === "percent" ? "1" : "0.01"}
                  value={form.amountInput}
                  onChange={(e) => set("amountInput", e.target.value)}
                  className={form.kind === "fixed" ? "pl-7" : undefined}
                  required
                />
                {form.kind === "percent" && (
                  <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                    %
                  </span>
                )}
              </div>
            </div>

            <Separator />

            <FieldToggle
              label="Minimum subtotal"
              checked={form.hasMinSubtotal}
              onChange={(v) => set("hasMinSubtotal", v)}
            >
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minSubtotalDollars}
                  onChange={(e) =>
                    set("minSubtotalDollars", e.target.value)
                  }
                  placeholder="50.00"
                  className="pl-7"
                />
              </div>
            </FieldToggle>

            <FieldToggle
              label="Expiry date"
              checked={form.hasExpiry}
              onChange={(v) => set("hasExpiry", v)}
            >
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
            </FieldToggle>

            <FieldToggle
              label="Usage limit"
              checked={form.hasUsageLimit}
              onChange={(v) => set("hasUsageLimit", v)}
            >
              <Input
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                placeholder="25"
              />
            </FieldToggle>

            <Separator />

            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <Label
                  htmlFor="active"
                  className="cursor-pointer text-sm font-medium"
                >
                  Active
                </Label>
                <p className="text-muted-foreground text-xs">
                  Paused codes aren&apos;t accepted at checkout.
                </p>
              </div>
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(c) => set("active", c)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : mode === "create"
                  ? "Create code"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldToggle({
  label,
  checked,
  onChange,
  children,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
      {checked && children}
    </div>
  );
}
