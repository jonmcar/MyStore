import Link from "next/link";
import { STORE } from "@/lib/config";
import { NewsletterForm } from "./newsletter-form";

export function SiteFooter() {
  return (
    <footer className="bg-muted/30 mt-24 border-t">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="bg-foreground text-background grid h-7 w-7 place-items-center rounded-md text-xs font-bold">
                {STORE.name[0]}
              </span>
              <span>{STORE.name}</span>
            </div>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              {STORE.description}
            </p>
            <NewsletterForm />
            <p className="text-muted-foreground text-xs">
              Occasional notes on new arrivals and workshops. No spam.
            </p>
          </div>

          <nav aria-label="Shop" className="space-y-3">
            <h3 className="text-sm font-medium">Shop</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-foreground">
                  All listings
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?type=product"
                  className="hover:text-foreground"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?type=service"
                  className="hover:text-foreground"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=Workshops"
                  className="hover:text-foreground"
                >
                  Workshops
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="About" className="space-y-3">
            <h3 className="text-sm font-medium">About</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  Our story
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${STORE.supportEmail}`}
                  className="hover:text-foreground"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-foreground">
                  Shipping & returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="text-muted-foreground mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {STORE.name}. All rights
            reserved.
          </p>
          <p>Built with Next.js. Research demo — not a real store.</p>
        </div>
      </div>
    </footer>
  );
}
