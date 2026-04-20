# MyStore App

A Next.js e-commerce storefront with a full admin back office — built as
an exploration of the modern React/Next.js stack by a long-time Angular
developer.

<!-- Drop a screenshot here once you're ready. GitHub renders images
     inline; an image at the top of the README is the single biggest
     improvement you can make. Suggestion:

     ![Store home page](./docs/screenshot-home.png)

     Save a screenshot to ./docs/ and uncomment. -->

## What this is

MyStore is a working storefront for a small fictional shop — ceramics,
stationery, services, workshops. Visitors can browse listings, add
items to a cart, and check out (the checkout is mocked — no real
payment processing). Admins can manage everything: listings, orders,
discount codes, and the storefront's home-page content via a
drag-and-drop page builder.

The project started as a learning exercise to understand Next.js,
React 19, and the surrounding ecosystem after years of working in
Angular. It has since grown into a reasonably complete application
that exercises most of the stack's interesting corners: server
components, server actions, Prisma with MySQL, Tailwind v4, a
multi-theme system, shadcn/ui, image uploads, and more.

It is not deployed anywhere. It's a personal project — the goal is
the building, not the launching.

## Features

**Storefront side.** Landing page built from ordered, configurable
sections (hero, featured listings, editorial blocks, category grids,
promos, service spotlights, text blocks, and image banners). Shop grid
with filtering and sorting, per-listing detail pages with
customization options, persistent cart, mock checkout flow with
address and payment forms, applied discount codes.

**Admin side.** Full CRUD for listings (both products and services),
an orders table with inline status updates, discount code management,
and a drag-to-reorder page builder for the home page. A customizable
announcement banner and a first-visit modal dialog with editable
content, icon, and button labels. Bulk-image uploads to local storage
(swappable for cloud hosting later). Role-gated admin access via a
mock session store.

**Styling.** A multi-theme system with four bundled themes: Default,
Dark, Playful, and Confetti (the last adds player-assigned accent
colors on the nav, section borders, and stat cards). Themes switch
live via a toggle in the account menu, and preferences persist
across reloads.

**Development tooling.** Four seeded test scenarios for different
demo states — Default (curated dataset), Empty (first-run UX),
Busy (scale test), and Edge cases (weird data that breaks lazy
layouts). A snapshot tool that freezes the current DB state as a
runnable seed file, useful for capturing specific test scenarios
and restoring them later.

## Stack

- **[Next.js 16](https://nextjs.org)** with the App Router and
  Turbopack. Server components handle data fetching directly from
  the database; server actions handle mutations; the rest is
  conventional React.
- **[React 19](https://react.dev)** with hooks throughout — no class
  components.
- **[TypeScript](https://www.typescriptlang.org)** across the whole
  project. Types flow from the Prisma schema through the data layer
  into components.
- **[Prisma 7](https://www.prisma.io)** as the ORM, talking to
  **MySQL** via the MariaDB adapter. Schema-first development with
  generated types.
- **[Tailwind CSS v4](https://tailwindcss.com)** for styling, with
  **[shadcn/ui](https://ui.shadcn.com)** components (Vega preset).
  Theme system built on CSS custom properties scoped by class.
- **[Zustand](https://zustand-demo.pmnd.rs)** for client-side state
  (cart, mock session).
- **[Lucide React](https://lucide.dev)** for icons.

## Getting started

See [SETUP.md](./SETUP.md) for full setup instructions, including
MySQL configuration, environment variables, database migrations,
and the seeding workflow.

The short version:

```bash
npm install
# Set up .env.local with DATABASE_URL="mysql://user:pass@localhost:3306/storedev"
npx prisma migrate dev
npm run seed:default
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000). To reach
the admin, sign in as an admin user via the account menu (the mock
session store lets you pick any role — no real auth).

## Project structure

```
storefront/
├── prisma/
│   ├── schema.prisma       # Database schema — 8 models
│   ├── migrations/         # Versioned migration history
│   └── seeds/
│       ├── shared.ts       # Common helpers used by all seeds
│       ├── _freeze.ts      # Snapshot tool — captures DB state as a seed
│       ├── public/         # Canonical seed scenarios (committed)
│       └── private/        # Personal snapshots (gitignored)
│
├── src/
│   ├── app/                # Next.js routes (file = URL)
│   │   ├── layout.tsx      # Root layout, theme provider, popup
│   │   ├── page.tsx        # Home (renders from storefront sections)
│   │   ├── shop/           # Shopper-facing listing browsing
│   │   ├── cart/           # Cart page
│   │   ├── checkout/       # Mock checkout flow
│   │   └── admin/          # Admin-only routes (role-gated)
│   │
│   ├── components/
│   │   ├── ui/             # shadcn primitives — don't edit
│   │   ├── layout/         # Header, footer, theme, popup
│   │   ├── shop/           # Shopper-facing components
│   │   └── admin/          # Admin components
│   │
│   └── lib/
│       ├── db.ts           # Prisma client singleton
│       ├── data.ts         # Data access layer (all CRUD)
│       ├── actions.ts      # Server actions (mutations)
│       ├── types.ts        # Domain types — single source of truth
│       ├── default-storefront.ts  # Default home-page content
│       ├── cart-store.ts   # Zustand cart state
│       ├── session-store.ts # Mock auth (replace when real)
│       └── uploads.ts      # Image upload server action
│
├── public/uploads/         # Local image storage (gitignored content)
├── SETUP.md                # Full setup reference
├── TODO-LATER.md           # Roadmap
└── README.md               # You are here
```

## Design decisions worth noting

### Money is integers, never floats

Every price and dollar amount is stored and passed around as integer
cents. No `$29.99` floats anywhere — that's `2999`. The `formatMoney`
helper converts to display strings. This avoids every floating-point
bug that plagues amateur e-commerce code.

### Listings are a discriminated union

A listing is either a product or a service, never both. The `type`
field narrows the shape: products have stock, weight, SKU; services
have duration, location type. TypeScript enforces the distinction
throughout. One table in the database, one `Listing` type, two
shapes depending on the `type` discriminator.

### Orders snapshot listings at purchase

An `OrderItem` records what the listing looked like *when it was
bought* — name, price, image. No foreign-key-with-side-effects: if
a product is later deleted or its price changes, old orders still
render correctly. Historical accuracy over database normalization.

### Storefront content is a single JSON column

The home page's sections are stored as an ordered array in one JSON
column on the `StorefrontContent` singleton row. This is less
"proper" than a sections table with foreign keys, but dramatically
simpler: the whole page is one read, the admin editor works on one
state object, and reordering is a pure array operation. For a
storefront where the home page is edited by humans and read by
everyone, this trade-off makes sense.

### Themes are CSS variables, not component props

Every theme-aware color in the project references a semantic token
(`bg-background`, `text-foreground`, `border-accent`) rather than a
literal value. Themes are blocks of CSS variables scoped by class
on `<html>`. Adding a new theme is ~40 lines of CSS; no component
changes. See
[`src/app/globals.css`](./src/app/globals.css) for the pattern.

### Data flows in one direction

Components never write to the database. Writes go through server
actions in `src/lib/actions.ts`, which call into `src/lib/data.ts`.
Reads happen in server components directly from `data.ts`. The
admin editors are client components that collect user input and
call server actions on save. No ORM calls from component files.

## Known rough edges

Honest list of things I know aren't ideal:

- **Authentication is mocked.** The session store lets anyone pick
  any role. Real auth (NextAuth, Clerk, or similar) is a deliberate
  future milestone, not something I pretended to build.
- **Checkout doesn't actually charge anything.** It collects address
  and fake payment info and creates an order with a `placed` status.
  No Stripe, no PayPal, no real processing.
- **Image uploads go to the local filesystem.** Works in dev; would
  fail on serverless hosts like Vercel. The `src/lib/uploads.ts`
  module is deliberately swappable for a cloud provider.
- **React 19 theme flash on first load.** When a non-default theme
  is active, there's a brief flash of default colors before the
  ThemeProvider mounts. A no-flash script would fix it but triggers
  a React 19 false-positive warning. Currently living with the
  flash.
- **No tests.** Feature development has been the priority. Tests
  are something I should add incrementally.
- **Some dead footer links.** `/about`, `/shipping`, `/faq` are
  linked from the footer but the pages don't exist yet. On the
  list.

These are honest gaps, not embarrassments. Calling them out here
is how I keep myself honest about what's done and what isn't.

## Roadmap

See [TODO-LATER.md](./TODO-LATER.md) for the full roadmap. Top
items in no particular order: real auth, order detail page, static
pages (about / shipping / faq), payment processing, wishlist, and
cloud image storage.

## About this project

MyStore was built as a learning exercise — me, an Angular developer
for years, teaching myself Next.js and React 19 by doing rather than
reading. Most features were built in paired sessions with an AI
assistant; the architecture, decisions, and persistent debugging
were mine.

The project is private and not intended for production use. If
you've somehow landed here and want to poke around, feel free.

## License

No formal license. This is a personal learning and demonstration
project, and I'm not currently offering it for reuse. All rights
reserved by default.

If you find something in here genuinely useful for your own work,
reach out — I'm likely happy to grant specific permission or
release a snippet under MIT on request.