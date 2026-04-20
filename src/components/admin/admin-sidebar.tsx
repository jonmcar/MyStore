"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Home,
  TicketPercent,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/listings", label: "Listings", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/discounts", label: "Discounts", icon: TicketPercent },
  { href: "/admin/storefront", label: "Storefront", icon: Home },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="bg-muted/30 hidden w-56 shrink-0 border-r md:block">
      <div className="sticky top-16 p-4">
        <p className="text-muted-foreground px-3 pb-2 text-xs font-medium tracking-wide uppercase">
          Admin
        </p>
        <nav className="space-y-1">
          {ADMIN_LINKS.map((link) => {
            const active = isActive(link.href, "exact" in link && link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t pt-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            View storefront
          </Link>
        </div>
      </div>
    </aside>
  );
}
