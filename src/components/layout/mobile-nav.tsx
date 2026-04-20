"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { STORE } from "@/lib/config";
import { useSessionStore } from "@/lib/session-store";
import { NAV_LINKS } from "./nav-links";

export function MobileNav() {
  const session = useSessionStore((s) => s.session);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">{STORE.name}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="hover:bg-accent rounded-md px-3 py-2 text-base"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
          {session.role === "admin" && (
            <>
              <Separator className="my-2" />
              <SheetClose asChild>
                <Link
                  href="/admin"
                  className="hover:bg-accent rounded-md px-3 py-2 text-base"
                >
                  Admin
                </Link>
              </SheetClose>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
