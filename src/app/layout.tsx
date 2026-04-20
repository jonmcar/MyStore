import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeProvider } from "@/components/layout/theme";
import { STORE } from "@/lib/config";
import { FirstVisitPopup } from "@/components/layout/first-visit-popup";
import { getStorefrontContent } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: STORE.name,
    template: `%s — ${STORE.name}`,
  },
  description: STORE.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch storefront content once here so the popup config is
  // available. The popup component is client-side (needs
  // sessionStorage) but its config comes from the server.
  const storefront = await getStorefrontContent();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider>
          <AnnouncementBanner />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster richColors position="bottom-right" />
          <FirstVisitPopup popup={storefront.popup} />
        </ThemeProvider>
      </body>
    </html>
  );
}