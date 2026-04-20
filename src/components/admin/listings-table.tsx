"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
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
  deleteListingAction,
  duplicateListingAction,
  updateListingAction,
} from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import type { Listing } from "@/lib/types";

interface ListingsTableProps {
  listings: Listing[];
}

export function ListingsTable({ listings }: ListingsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Listing | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!query.trim()) return listings;
    const q = query.toLowerCase();
    return listings.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        ("sku" in l && l.sku.toLowerCase().includes(q))
    );
  }, [listings, query]);

  const togglePublish = (listing: Listing) => {
    startTransition(async () => {
      const res = await updateListingAction(listing.id, {
        isPublished: !listing.isPublished,
      });
      if (res.ok) {
        toast.success(
          res.listing.isPublished ? "Listing published" : "Listing unpublished"
        );
        router.refresh();
      } else {
        toast.error("Something went wrong", { description: res.error });
      }
    });
  };

  const duplicate = (listing: Listing) => {
    startTransition(async () => {
      const res = await duplicateListingAction(listing.id);
      if (res.ok) {
        toast.success("Listing duplicated", {
          description: `${res.listing.name} — saved as a draft.`,
        });
        router.push(`/admin/listings/${res.listing.id}/edit`);
      } else {
        toast.error("Couldn't duplicate listing", { description: res.error });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    startTransition(async () => {
      const res = await deleteListingAction(target.id);
      if (res.ok) {
        toast.success("Listing deleted", { description: target.name });
        router.refresh();
      } else {
        toast.error("Something went wrong", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings…"
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
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
                  No listings.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className={!l.isPublished ? "opacity-70" : ""}>
                  <TableCell>
                    <div className="bg-muted relative h-12 w-12 overflow-hidden rounded">
                      {l.images[0] && (
                        <Image
                          src={l.images[0]}
                          alt={l.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/listings/${l.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    <div className="text-muted-foreground font-mono text-xs">
                      {l.slug}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{l.category}</TableCell>
                  <TableCell className="text-sm capitalize">{l.type}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {l.isPublished ? (
                        <Badge
                          variant="outline"
                          className="w-fit border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="w-fit">
                          Draft
                        </Badge>
                      )}
                      {l.availability === "unavailable" ? (
                        <Badge className="w-fit bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                          Unavailable
                        </Badge>
                      ) : !l.inStock ? (
                        <Badge variant="destructive" className="w-fit">
                          Out of stock
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(l.priceCents)}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/listings/${l.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(l)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(l)}>
                          {l.isPublished ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleting(l)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  <span className="text-foreground font-medium">
                    {deleting.name}
                  </span>{" "}
                  will be permanently removed. This can&apos;t be undone.
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
