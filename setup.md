# MyStore — Setup & Command Reference

Every command you might need, organized by what you're trying to do.
Read top to bottom on a fresh machine; skip around once you know
what you're looking for.

---

## Prerequisites

These have to exist on your machine before anything else works.

- **Node.js** — any recent LTS. Check with `node --version`.
- **npm** — comes with Node. Check with `npm --version`.
- **MySQL server** — 8.0 or newer, running locally on port 3306.
  - macOS: `brew install mysql && brew services start mysql`
  - Windows: MySQL Installer from dev.mysql.com
  - Linux: your distro's `mysql-server` package
- **Git** (optional but recommended) — for version control.

---

## First-time setup (cloning this project onto a new machine)

### 1. Clone and install

```bash
git clone <repo-url> mystore
cd mystore
npm install
```

### 2. Create the MySQL database and app user

```bash
mysql -u root -p
```

Inside the `mysql>` prompt, paste this, replacing `yourpassword` with
whatever you want (pick something boring — you'll paste it into a
config file, not memorize it):

```sql
CREATE DATABASE mystore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'storedev'@'localhost' IDENTIFIED BY 'yourpassword';

GRANT ALL PRIVILEGES ON mystore.* TO 'storedev'@'localhost';

-- Prisma needs these to create its "shadow database" during migrations:
GRANT CREATE, DROP, ALTER, REFERENCES ON *.* TO 'storedev'@'localhost';

FLUSH PRIVILEGES;
exit;
```

Verify the user works:

```bash
mysql -u storedev -p mystore
```

Enter the password. If you get a `mysql>` prompt, you're set. Exit
with `exit`.

### 3. Create `.env.local`

In the project root, create a file called `.env.local` with this
line — one line, no commas, double quotes matter:

```
DATABASE_URL="mysql://storedev:yourpassword@localhost:3306/mystore"
```

Use the same password as step 2. No trailing comma, no extra whitespace.

### 4. Generate the Prisma client

```bash
npx prisma generate
```

This creates `src/generated/prisma/` with the typed database client
the app imports from. Re-run any time the schema changes.

### 5. Run the initial migration

```bash
npx prisma migrate dev --name init
```

Creates all the tables. If this errors with "P3014: Prisma Migrate
could not create the shadow database," the `GRANT CREATE, DROP,
ALTER, REFERENCES` part of step 2 didn't take — re-run that line.

### 6. Seed the database

```bash
npm run seed:default
```

Populates the database with the baseline test dataset. See the "Seed
datasets" section below for other options.

### 7. Start the dev server

```bash
npm run dev
```

Visit <http://localhost:3000>. You should see the home page with
seed content.

---

## Daily workflow

### Start the app

```bash
npm run dev
```

Hot-reload is active — save a file, the browser reloads.

### Stop the app

`Ctrl-C` in the terminal running `npm run dev`.

### See the database

```bash
npx prisma studio
```

Opens a GUI at <http://localhost:5555> showing all tables. You can
edit rows directly. Close with `Ctrl-C`.

---

## Seed datasets

Each seed wipes the database first, then populates it with a
different test scenario. Run any time to reset to a known state.

### Canonical seeds (committed to the repo)

Live in `prisma/seeds/public/`. Run with:

```bash
npm run seed:default       # baseline — 15 listings, 7 orders
npm run seed:empty         # zero of everything (test empty states)
npm run seed:busy          # ~60 listings, 40 orders (scale test)
npm run seed:edge-cases    # deliberately weird data (find UI bugs)
```

The official `npx prisma db seed` also works — it routes to
`seed:default`.

### When to use each

- **default** — everyday development
- **empty** — verifying "no listings yet" screens, first-run UX
- **busy** — testing admin tables and search at realistic scale
- **edge-cases** — finding layout bugs before they find you

---

## Snapshot tool — freeze current DB state as a seed

When you've set up a specific test scenario worth preserving, the
freeze tool captures the current database into a runnable seed file.

### Freeze current state

```bash
npm run seed:freeze                        # default name: frozen-YYYY-MM-DD.ts
npm run seed:freeze -- --name my-state     # custom name
```

Output goes to `prisma/seeds/private/<name>.ts`. The `private/`
folder is gitignored by default — frozen seeds stay local unless
you explicitly commit one.

### Restore a frozen seed

Frozen seeds aren't added to `package.json` as npm scripts (because
their paths would leak personal data). Run them directly:

```bash
npx tsx prisma/seeds/private/frozen-2026-04-19.ts
```

The `npx` is needed because `tsx` is a project-local binary — see
"Notes on project-local binaries" at the bottom.

### Why freeze?

- Capture a specific bug reproduction state
- Save a demo-ready dataset before experiments
- Back up before trying something risky

Frozen seeds are plain TypeScript files — open them, edit them, diff
them. The freeze tool is just the starting point.

---

## Schema changes

If you edit `prisma/schema.prisma` to add a table, column, relation,
or constraint:

```bash
# 1. Create a migration and apply it to your local DB
npx prisma migrate dev --name describe_what_changed

# 2. Regenerate the typed client (usually automatic, but run if types
#    look stale in your editor)
npx prisma generate

# 3. Re-seed if the change affected existing table shapes
npm run seed:default
```

`--name describe_what_changed` becomes the migration folder name —
use a short description, like `add_user_table` or
`add_sku_to_option_choices`.

### Adding required columns to tables with existing rows

This fails by default — Prisma can't add a non-null column to a
table that already has rows. Two options:

1. Make the column nullable: `field Json?` instead of `field Json`
2. Use `--create-only` to generate the migration, hand-edit it to
   backfill existing rows, then apply

Option 1 is almost always the right call for dev. The data layer
can handle null and fall back to a default.

### After editing schema.prisma, restart your TS server

In VS Code: `Cmd/Ctrl-Shift-P` → "TypeScript: Restart TS Server".
Otherwise Prisma's generated types look stale in your editor until a
full reload.

---

## Common troubleshooting

### "Can't reach database server" / pool timeout

Something wrong with the DB connection. Work through these in order:

```bash
# 1. Is MySQL actually running?
mysql -u storedev -p mystore -e "SELECT 1"
```

If that fails, MySQL isn't running or the user/password is wrong. On
macOS, `brew services list` shows running services; `brew services
start mysql` restarts it.

```bash
# 2. Can Prisma's own tooling connect?
npx prisma studio
```

If Studio opens and shows data, Prisma can connect — meaning the app
has a different path and it's broken. Check `src/lib/db.ts` against
`.env.local`.

```bash
# 3. Check .env.local for formatting issues
cat .env.local
```

Common culprits:
- Trailing comma after the URL string
- Stray whitespace around `=`
- Wrong quote style (use straight double quotes `"`, not smart quotes)
- Password with special characters not URL-encoded (`@` → `%40`,
  `#` → `%23`, `/` → `%2F`)

### "Cannot find module '@prisma/client'" or similar

```bash
npx prisma generate
```

Then restart the TS server in your editor.

### "P1012: The datasource property `url` is no longer supported"

Prisma 7 moved the connection URL from `schema.prisma` into
`prisma.config.ts`. If you see this error, your schema's `datasource`
block still has a `url = env("DATABASE_URL")` line it shouldn't.
Remove that line; the URL is already in `prisma.config.ts`.

### "P1013: The provided database string is invalid"

The `DATABASE_URL` in `.env.local` has a formatting issue — check
for trailing commas, missing quotes, unescaped special characters in
the password. Rewrite it cleanly:

```
DATABASE_URL="mysql://storedev:yourpassword@localhost:3306/mystore"
```

### "P3014: shadow database permission denied"

The app's MySQL user doesn't have permission to create databases.
Re-run in a root MySQL session:

```sql
GRANT CREATE, DROP, ALTER, REFERENCES ON *.* TO 'storedev'@'localhost';
FLUSH PRIVILEGES;
```

### "Unknown argument `X`" when saving data

The Prisma client in memory is stale — it pre-dates the schema
change that added the field. Fully stop the dev server (Ctrl-C),
regenerate, then start fresh:

```bash
npx prisma generate
npm run dev
```

If that doesn't help, nuke the generated client and rebuild:

```bash
rm -rf node_modules/.prisma src/generated/prisma
npx prisma generate
npm run dev
```

### Saving content shows success toast but doesn't persist

Usually a stale Prisma client after a schema change (see above).
Regenerate + restart. If the issue is specifically that the UI says
success while the database silently failed, it often means a server
action is missing `await` somewhere — the Prisma write errors in the
background but the action already returned. Grep `src/lib/actions.ts`
for any `const content = _updateX(...)` without `await`.

### CSS changes don't appear even after save

Turbopack's CSS cache invalidation has rough edges. Three escape
hatches, from least to most aggressive:

1. Save the file twice — first with a deliberate syntax error
   (to force full re-parse), then the corrected version.
2. Hard-reload the browser (Ctrl/Cmd + Shift + R).
3. Nuke the build cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

If this is a recurring pain, switch dev mode off Turbopack by
changing `package.json`'s dev script to `"next dev --no-turbo"`.
Slower startup, more reliable CSS handling.

### TypeScript errors after a pull from git

Someone else changed the schema. Regenerate the client:

```bash
npm install          # pick up any new packages
npx prisma generate  # regenerate typed client
npx prisma migrate dev  # catch up on any new migrations
```

Then restart the TS server.

### Something broke and I want to start completely over

Nuclear option. Drops and recreates the whole database.

```bash
mysql -u root -p -e "DROP DATABASE mystore; CREATE DATABASE mystore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npx prisma migrate dev --name init
npm run seed:default
```

Back to a clean slate.

---

## Production builds (for reference)

Not something you'll do day-to-day, but the commands exist:

```bash
npm run build        # produces an optimized production build
npm run start        # serves the production build on port 3000
npm run lint         # checks for code style issues
```

`npm run build` is worth running periodically even in development —
it compiles every file strictly, surfacing TypeScript errors that
the lazy dev server missed. Treat it as an honest correctness check.

Production deployment requires more than this — auth, real payments,
file storage, etc. See `TODO-LATER.md` for the roadmap to going live.

---

## Project structure quick map

```
storefront/
├── prisma/
│   ├── schema.prisma          # database schema (8 models)
│   ├── seeds/
│   │   ├── shared.ts          # seed helpers + re-exported defaults
│   │   ├── _freeze.ts         # snapshot tool (captures DB → seed file)
│   │   ├── public/            # canonical seeds (committed)
│   │   │   ├── default.ts
│   │   │   ├── empty.ts
│   │   │   ├── busy.ts
│   │   │   └── edge-cases.ts
│   │   └── private/           # personal snapshots (gitignored content)
│   └── migrations/            # auto-generated, commit these to git
│
├── src/
│   ├── app/                   # Next.js pages (file = route)
│   │   ├── layout.tsx         # root layout, theme provider, popup
│   │   ├── page.tsx           # home page (renders from sections)
│   │   ├── shop/              # shopper-facing browsing routes
│   │   ├── admin/             # admin-only routes
│   │   ├── cart/
│   │   └── checkout/
│   │
│   ├── components/            # React components
│   │   ├── ui/                # shadcn primitives (don't edit these)
│   │   ├── admin/             # admin-specific components
│   │   ├── layout/            # headers, footers, theme, popup
│   │   └── shop/              # shopper-facing components
│   │
│   ├── lib/
│   │   ├── db.ts                    # shared Prisma client
│   │   ├── data.ts                  # data access layer (CRUD)
│   │   ├── actions.ts               # server actions (mutations)
│   │   ├── types.ts                 # domain types
│   │   ├── default-storefront.ts    # default storefront content
│   │   ├── storefront-helpers.ts    # section helpers
│   │   ├── cart-store.ts            # Zustand cart
│   │   ├── session-store.ts         # mock auth (replace when real)
│   │   ├── uploads.ts               # image upload server action
│   │   ├── config.ts                # store-wide config (name, etc.)
│   │   └── format.ts                # money/date formatters
│   │
│   └── generated/prisma/      # auto-generated by prisma generate
│                              # (don't commit, don't edit)
│
├── public/
│   └── uploads/               # uploaded images land here locally
│                              # (content gitignored, folder preserved)
│
├── .env.local                 # DATABASE_URL — NEVER commit
├── prisma.config.ts           # Prisma CLI config (URL lives here)
├── next.config.ts             # Next.js config
├── package.json               # dependencies and npm scripts
├── README.md                  # project overview
├── SETUP.md                   # this file
└── TODO-LATER.md              # roadmap
```

---

## Environment variables

All project secrets live in `.env.local`. This file is `.gitignore`d
and must never be committed.

Currently the only variable:

- **`DATABASE_URL`** — MySQL connection string in the format
  `mysql://user:password@host:port/database`

Future variables (when those features land):

- `AUTH_SECRET` — NextAuth session signing key
- `STRIPE_SECRET_KEY` — Stripe API key for payments
- `RESEND_API_KEY` — for transactional email

---

## The package.json scripts in one place

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "seed:default":    "tsx prisma/seeds/public/default.ts",
  "seed:empty":      "tsx prisma/seeds/public/empty.ts",
  "seed:busy":       "tsx prisma/seeds/public/busy.ts",
  "seed:edge-cases": "tsx prisma/seeds/public/edge-cases.ts",
  "seed:freeze":     "tsx prisma/seeds/_freeze.ts"
}
```

Run any of these with `npm run <script-name>`.

Private snapshots (frozen seeds in `prisma/seeds/private/`) aren't
listed here on purpose — their filenames can be personal. Run them
directly with `npx tsx prisma/seeds/private/<name>.ts`.

---

## Notes on project-local binaries

Running `tsx` or other project binaries directly from bash fails
("command not found") because they're installed in `node_modules/`,
not globally.

Two ways to invoke them:

- **From an npm script** — npm automatically finds binaries in
  `node_modules/.bin/`. Used for the `seed:*` scripts above.
- **From a bash prompt directly** — use `npx` to locate the binary:
  `npx tsx prisma/seeds/private/my-state.ts`

This applies to other tools too — `prisma`, `next`, `tsc`, `vitest`,
etc. Inside a script, bare command works; from a terminal, prepend
`npx`.

---

_Last updated with the freeze tool, subfolder restructure, and popup
feature integrated._