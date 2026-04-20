import Link from "next/link";
import { CartSheet } from "./cart-sheet";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { STORE } from "@/lib/config";
import { NAV_LINKS } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <MobileNav />

        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          aria-label={`${STORE.name} — home`}
        >
          <span className="bg-foreground text-background grid h-7 w-7 place-items-center rounded-md text-xs font-bold">
            {STORE.name[0]}
          </span>
          <span>{STORE.name}</span>
        </Link>

        <nav
          className="ml-6 hidden items-center gap-6 text-sm md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <UserMenu />
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
