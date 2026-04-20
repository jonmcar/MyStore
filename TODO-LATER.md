# MyStore — Roadmap

Running list of what's done and what's not. Tick items off with `[x]`
as they land.

---

## ✅ Done — 1.0 shipped

### Foundation
- [x] Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind v4
- [x] shadcn/ui components (Vega preset)
- [x] React 19 with hooks throughout
- [x] Zustand for cart state
- [x] Prisma 7 + MySQL via MariaDB adapter
- [x] Schema with 8 models (categories, listings, options, choices,
      orders, order items, discount codes, storefront content)

### Shopper experience
- [x] Landing page rendered from configurable storefront sections
- [x] Shop grid with filtering and sorting
- [x] Listing detail pages with customization options
- [x] Discriminated product vs. service listing types
- [x] Customization options (seven input types, price modifiers,
      per-choice stock)
- [x] Availability enum (Sold out red / Unavailable amber)
- [x] Processing time per listing
- [x] Services with optional/variable duration
- [x] Cart with persistent Zustand state
- [x] Mock checkout flow with address + payment forms
- [x] Applied discount code UI
- [x] Customer notes at checkout
- [x] First-visit popup with customizable content and icon

### Admin
- [x] Full CRUD for listings (both products and services)
- [x] Duplicate listing, publish/draft toggle
- [x] Orders table with inline status updates
- [x] Customer + admin notes on orders
- [x] Discount code management (percent/fixed, min subtotal, expiry,
      usage cap)
- [x] Drag-to-reorder page builder for home page sections
- [x] Section types: hero, featured, editorial, categories, promo,
      services, text block, image banner
- [x] Announcement banner (site-wide, admin-toggleable)
- [x] First-visit popup editor
- [x] Admin dashboard with summary stats
- [x] Role-gated admin access via mock session store

### Visual system
- [x] Multi-theme system with four themes (default, dark, playful,
      confetti)
- [x] Theme switcher in account menu with cross-tab sync
- [x] Theme persistence via localStorage
- [x] Semantic color tokens throughout (no hardcoded colors)

### Data & tooling
- [x] DB migration from mock arrays to Prisma
- [x] Single source of truth for default storefront content
- [x] Four canonical seed datasets (default, empty, busy, edge-cases)
- [x] Freeze tool — captures DB state as a runnable seed file
- [x] public/private seed folder split for committable vs. personal
- [x] Local image uploads to `public/uploads/` (swappable for cloud)
- [x] `<ImagePicker>` component wired into listing form, hero, and
      image-banner section editors

### Docs
- [x] README.md with project overview and design decisions
- [x] SETUP.md covering setup, commands, and troubleshooting
- [x] TODO-LATER.md (this file) tracking what's next

---

## 🎯 Next up (no new infrastructure required)

These are all doable without picking up new services, accounts, or
external dependencies. Good candidates for when you want to ship
without ceremony.

### Routing and static content
- [ ] Static pages: `/about`, `/shipping`, `/faq` (currently dead
      links in the footer)
- [ ] Order detail page (`/admin/orders/[id]`) with full info,
      editable admin notes, status history
- [ ] Dedicated `/search` route with bigger/better search UX
- [ ] `/account` page for logged-in shoppers (blocked on auth)

### Admin enhancements
- [ ] Listing preview before publishing
- [ ] Bulk publish/unpublish on listings table (row checkboxes)
- [ ] Storefront editor live preview pane (iframe alongside editor)
- [ ] Mobile preview toggle in storefront editor
- [ ] Duplicate section button in page builder
- [ ] More section types: testimonials, newsletter callout, FAQ
      accordion, video hero
- [ ] Manual featured picks (alternative to auto-pull from
      `featured: true`)
- [ ] Per-section spacing control
- [ ] Admin notes editor UI (server action already exists)

### Shopper nice-to-haves
- [ ] Favorites / wishlist (localStorage first, per-user after auth)
- [ ] Recently viewed listings (session-based)
- [ ] Product image zoom / lightbox on listing detail
- [ ] Featured collection pages (`/collections/[slug]`)

### Quality
- [ ] Loading states (skeletons for cards, tables, lists)
- [ ] Error boundaries on key routes
- [ ] Accessibility audit with axe DevTools, fix surfaced issues
- [ ] Basic test setup (Vitest) with a few tests for format.ts and
      cart store
- [ ] Mobile layout review of admin pages (likely need work)

---

## 🔒 Big milestones (require new infrastructure / services)

### Real authentication
- [ ] Pick library (NextAuth.js / Clerk / Auth.js)
- [ ] Add `User` table to Prisma schema
- [ ] Email + password sign-in
- [ ] OAuth providers (Google / GitHub)
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Replace mock session store
- [ ] Wire real sessions into `<AdminGuard>`
- [ ] `/login` and `/signup` pages
- [ ] `/account` page for logged-in shoppers (order history, saved
      addresses)

### Real payments
- [ ] Stripe account setup
- [ ] Stripe Checkout integration (hosted payment page)
- [ ] Webhook handler for `payment_intent.succeeded`,
      `.payment_failed`, `charge.refunded`
- [ ] Update order status automatically from webhooks
- [ ] Admin-triggered refund flow (wire to Stripe refund API)
- [ ] Stripe test-mode end-to-end testing

### Cloud image storage
- [ ] Pick a storage provider (Cloudflare R2 / UploadThing / S3)
- [ ] Replace body of `src/lib/uploads.ts` with cloud provider calls
- [ ] (Everything else in the app keeps working — `<ImagePicker>`
      and the DB schema are storage-agnostic)
- [ ] Handle image deletion when listings are deleted

### Real sales tax
- [ ] Stripe Tax (easiest if already on Stripe) OR TaxJar
- [ ] Replace the 8.75% flat tax calculation in checkout
- [ ] Handle international orders (VAT, etc.)

### Transactional email
- [ ] Pick provider (Resend / Postmark)
- [ ] Email templates (React Email or MJML)
- [ ] Order confirmation email on `_createOrder`
- [ ] Shipping notification on status change to "shipped"
- [ ] Password reset email (needs auth first)
- [ ] Admin notification on new order

### Shipping
- [ ] Live carrier rates (EasyPost / Shippo) — replace flat $7.95
- [ ] Printable shipping labels
- [ ] Tracking numbers surfaced to shopper in order emails

### Going live
- [ ] Production database (PlanetScale / Supabase / Railway)
- [ ] Migrate schema + data from local MySQL to production
- [ ] Deploy to Vercel (or Netlify / Railway)
- [ ] Custom domain
- [ ] TLS certificate (automatic on Vercel)
- [ ] Error monitoring (Sentry)
- [ ] Analytics (Plausible / PostHog — privacy-friendly options)
- [ ] Environment variable management in production

### Legal & business (only relevant for a real launch)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Return policy / refund policy
- [ ] Real cookie consent behavior (current popup is decorative)
- [ ] Business entity (LLC)
- [ ] Business bank account
- [ ] Sales tax registration

---

## 🧩 Architectural improvements worth considering

- [ ] Form library — React Hook Form + Zod (current forms use manual
      `useState` + hand-rolled validation)
- [ ] Data table library — TanStack Table for listings, orders,
      discounts
- [ ] Explicit error boundaries on routes that can fail
- [ ] Typed server action return shape convention across all actions
- [ ] Consolidate storefront default data further (consider removing
      the `DEFAULT_STOREFRONT_DATA` alias in seeds/shared.ts in
      favor of direct `STOREFRONT_DEFAULTS` imports)

---

## 🎨 Customization features still open

- [ ] Real file uploads for the `file` option type (blocked on
      cloud storage)
- [ ] Time-slot calendar for `datetime` option (real scheduling UX)
- [ ] Variant SKU codes per choice (add `sku?: string` to
      `ListingOptionChoice`)
- [ ] Dependent options ("only show X if Y is checked")

---

## 🛒 Shopper-side deeper features

- [ ] Reviews and ratings on listings (needs users table first)
- [ ] Abandoned cart emails (needs auth + email)
- [ ] Gift cards
- [ ] Multi-currency display
- [ ] Product recommendations ("customers also viewed")
- [ ] Save-for-later from the cart

---

_Last updated: 1.0 shipped — project committed to git for the first
time with foundation complete._