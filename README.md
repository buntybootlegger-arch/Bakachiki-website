# Bakachiki — Funky Fashion Ecommerce Platform

A production-oriented ecommerce platform for a bold, editorial, streetwear-inspired multi-category fashion brand: Nuxt 4 + Vue 3 + Tailwind + GSAP storefront and admin panel, NestJS + Prisma + PostgreSQL backend.

This repository is being built in **phases** (see [`ROADMAP.md`](./ROADMAP.md)). **Phase 1** is a real, non-mocked foundation: auth/RBAC, a category-and-variant-generic product catalog, storefront (home/shop/PDP/cart), and an admin panel (products, categories, brands, admins & roles, media library). On top of that, a **Funky Fashion Rebrand + CMS Expansion** slice (see `ROADMAP.md`) shipped the current visual identity plus a much wider CMS: an 11-type page/section builder (reused for the homepage and any admin-created landing page), Collections, Campaigns, Lookbooks, and admin-editable theme colors — all driven by data, not hardcoded.

## Stack

- **Frontend** (`apps/web`): Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Pinia, GSAP + ScrollTrigger
- **Backend** (`apps/api`): NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Shared** (`packages/shared`): types/enums shared between both apps
- **Media**: Cloudinary in production, local disk in development (auto-selected — see below)

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable pnpm` or `npm i -g pnpm`)
- A local PostgreSQL 14+ server (Docker via `docker-compose.yml`, or a native install)

## Local setup

1. **Install dependencies** (also builds the shared package via `postinstall`):
   ```bash
   pnpm install
   ```

2. **Start Postgres + Redis** (skip if you already have Postgres running locally):
   ```bash
   docker compose up -d
   ```
   If you don't have Docker, point `DATABASE_URL` at any local Postgres instance instead — create a database and a role for it yourself.

3. **Configure environment variables.** Copy `.env.example` to `apps/api/.env` and fill in values (a fresh `openssl rand -hex 32` per secret is fine for local dev). Copy the `NUXT_PUBLIC_API_BASE` line into `apps/web/.env` too.

4. **Run migrations and seed the database:**
   ```bash
   pnpm --filter @bakachiki/api prisma migrate dev
   pnpm --filter @bakachiki/api prisma db seed
   ```
   The seed creates all RBAC roles/permissions, a super admin (`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` from your `.env`, defaults to `admin@bakachiki.dev` / `ChangeMe123!`), and a couple of sample products/categories/homepage sections.

5. **Run the apps** (two terminals):
   ```bash
   pnpm dev:api   # http://localhost:4000/api
   pnpm dev:web   # http://localhost:3000
   ```

6. Visit `http://localhost:3000` for the storefront and `http://localhost:3000/admin/login` for the admin panel (sign in with the seeded super admin).

## Media storage (Cloudinary)

The media module auto-selects its storage provider: if `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are all set in `apps/api/.env`, uploads go to Cloudinary; otherwise they're written to `apps/api/uploads/` and served locally. No code changes are needed to switch — just add the three env vars from your Cloudinary dashboard.

## Payments (PayU)

Checkout, orders, and payments are live (Phase 2 — see `ROADMAP.md`). The payment gateway sits behind a `PaymentGateway` interface + `GatewayRegistry` (`apps/api/src/payments/gateways/`), so adding a second gateway later is one new file + one registry entry — no changes to `OrdersService`/`CheckoutController`. PayU is the only gateway wired up today, in test mode by default:

```
PAYU_MERCHANT_KEY="gtKFFx"
PAYU_MERCHANT_SALT="4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW"
PAYU_MODE="test"
```

These are PayU's published generic sandbox credentials (safe to share, test-mode only — see `docs.payu.in/docs/test-integration`). All verification happens server-side: the browser postback's hash is checked, then `PaymentsService` calls PayU's server-to-server `verify_payment` API before ever marking a payment successful — the client is never trusted. Callback handling is idempotent (a repeated postback for an already-resolved payment is a no-op).

## Running tests

```bash
pnpm --filter @bakachiki/api test
```

Covers RBAC permission resolution (role + per-admin overrides), auth password hashing/login rejection paths, and cart stock-protection logic (prevents overselling).

## Project structure

```
apps/api      NestJS backend — see apps/api/src for module layout (auth, admin-auth, roles,
              admins, users, catalog/{categories,brands,products}, media, cart, wishlist,
              pages, collections, campaigns, lookbooks, settings)
apps/web      Nuxt 4 frontend — app/pages, app/components/{storefront,admin,homepage-sections,decor},
              app/stores (Pinia), app/composables
packages/shared   Types/enums shared by both apps (permissions, page/section configs, catalog DTOs,
                  collections, campaigns, lookbooks, settings)
```

## Production / demo deployment

Four platforms, each doing one job:

| Piece | Platform | Why |
|---|---|---|
| PostgreSQL | **Supabase** | Managed Postgres with no forced free-tier expiry (Render's free Postgres is deleted after 30 days) |
| API (`apps/api`) | **Render** | Node web service, always-on process (needed for a persistent NestJS server, unlike serverless) |
| Frontend (`apps/web`) | **Vercel** | First-class Nuxt/Nitro support, zero-config SSR |
| Media | **Cloudinary** | Render's and Vercel's filesystems are both ephemeral — nothing written to local disk survives a redeploy |

Payments run through PayU in test mode (see [Payments](#payments-payu) above) — nothing to configure differently for deployment, same env vars as local.

### 1. Database — Supabase

1. [supabase.com](https://supabase.com) → **New project**. Pick a region, set a database password (save it).
2. Project → **Settings → Database → Connection string** → copy the **URI** under "Connection pooling: Off" (the direct connection, port `5432`). A single long-running NestJS process doesn't need PgBouncer pooling — the direct connection is simpler and needs no Prisma schema changes.
3. This is your `DATABASE_URL` for the API service below. It looks like:
   ```
   postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
   ```

Prisma doesn't care what's hosting Postgres — no code or schema changes were needed to move off Render Postgres.

### 2. Backend — Render

**New +** → **Web Service** → connect this repo.

| Setting | Value |
|---|---|
| Name | `bakachiki-api` |
| Root Directory | *(leave blank — repo root; required for the pnpm workspace)* |
| Runtime | Node |
| Build Command | `corepack enable && corepack prepare pnpm@12.6.0 --activate && pnpm install --frozen-lockfile && pnpm --filter @bakachiki/api exec prisma generate && pnpm --filter @bakachiki/api build` |
| Start Command | `pnpm --filter @bakachiki/api start:prod` |

Environment variables:

```
DATABASE_URL            = <Supabase connection string from step 1>
NODE_VERSION            = 20
WEB_URL                 = <your Vercel frontend URL, set after step 3>
API_URL                 = <this Render service's own URL>
JWT_ACCESS_SECRET       = <openssl rand -hex 32>
JWT_ACCESS_EXPIRES_IN   = 15m
JWT_REFRESH_SECRET      = <openssl rand -hex 32>
JWT_REFRESH_EXPIRES_IN  = 30d
ADMIN_JWT_ACCESS_SECRET      = <openssl rand -hex 32>
ADMIN_JWT_ACCESS_EXPIRES_IN  = 15m
ADMIN_JWT_REFRESH_SECRET     = <openssl rand -hex 32>
ADMIN_JWT_REFRESH_EXPIRES_IN = 7d
SEED_SUPER_ADMIN_EMAIL     = <your admin email>
SEED_SUPER_ADMIN_PASSWORD  = <a strong password>
MEDIA_PROVIDER          = cloudinary
CLOUDINARY_CLOUD_NAME   = <from Cloudinary dashboard>
CLOUDINARY_API_KEY      = <from Cloudinary dashboard>
CLOUDINARY_API_SECRET   = <from Cloudinary dashboard>
PAYU_MERCHANT_KEY   = gtKFFx
PAYU_MERCHANT_SALT  = 4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW
PAYU_MODE           = test
```

Never commit any of these — `.env` files are gitignored, and none of the `*_SECRET` values above should ever reach frontend code or a client bundle.

Once live, open the service's **Shell** tab and run the migration + seed once:
```bash
pnpm --filter @bakachiki/api exec prisma migrate deploy
pnpm --filter @bakachiki/api prisma db seed
```

### 3. Frontend — Vercel

**New Project** → import this repo.

| Setting | Value |
|---|---|
| Framework Preset | Nuxt.js *(auto-detected)* |
| Root Directory | `apps/web` |
| Install Command (override) | `cd ../.. && corepack enable && corepack prepare pnpm@12.6.0 --activate && pnpm install --frozen-lockfile` |
| Build Command (override) | `cd ../.. && pnpm --filter @bakachiki/web build` |

Environment variable:
```
NUXT_PUBLIC_API_BASE = <your Render API URL from step 2>
```

Vercel's Nitro build auto-detects the Vercel environment and outputs its Build Output API format — no manual "Output Directory" setting needed.

Do **not** deploy the frontend to Render — Nuxt's SSR output runs fine there too, but Vercel's Nuxt integration is more turnkey and free-tier-friendly, and there's no reason to add a third always-on Render service just for a static/SSR frontend.

### 4. Wire the two together

1. Copy the deployed Vercel URL.
2. Back on the **Render API** service → Environment → set `WEB_URL` to that exact URL (and confirm `API_URL` matches the API's own URL). Save — this redeploys the API.

This matters for two things: CORS (`app.enableCors({ origin: process.env.WEB_URL, credentials: true })` in `apps/api/src/main.ts` — an exact origin match, never `*`) and PayU's redirect-back-to-your-site URL after checkout.

### 5. Verify end-to-end

- [ ] Storefront loads, browse/search/filter products
- [ ] Register + log in as a customer
- [ ] Add to cart, quantities update correctly
- [ ] Checkout: address → real shipping quote → coupon (seed one via admin or use the seeded `WELCOME10`) → PayU test payment
- [ ] Payment actually confirms (order status flips `PENDING` → `CONFIRMED`, not just "redirected somewhere")
- [ ] `/admin/login` with the seeded super-admin, dashboard shows real order/revenue numbers pulled from Supabase
- [ ] Create/edit a product, upload an image — confirm it lands in Cloudinary, not a 404
- [ ] Download an invoice PDF from an order
- [ ] Resize the browser down to phone width — checkout and account pages still usable

### Troubleshooting

These are real failures hit while first deploying this exact project — not hypothetical:

- **`ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE` / "Cannot update packageManagerDependencies"**: happens if `package.json`'s `packageManager` field and `pnpm-lock.yaml` fall out of sync (pnpm 12+ locks the pnpm binary itself once `packageManager` is declared). Fix: run `pnpm install` locally (no `--frozen-lockfile`) to regenerate the lockfile, commit it.
- **`nest build` fails with `Cannot find module '@bakachiki/shared'`**: the workspace package wasn't built before the app that depends on it. Both `apps/api` and `apps/web` have a `prebuild` script (`pnpm --filter @bakachiki/shared build`) specifically so this can't happen regardless of whether the host's install step happened to skip the root `postinstall` (this bit us on a cached Render build) — if you see this error, check that `prebuild` script is still present in the relevant `package.json`.
- **`Cannot find module '.../dist/main.js'` on start**: NestJS's build output is `dist/src/main.js` (not `dist/main.js`) whenever `nest-cli.json` sets `sourceRoot` without an explicit `tsconfig` `rootDir` override — check `apps/api/package.json`'s `start:prod` script points at the real path.
- **API process starts but Render/host shows "no open ports detected"**: the app must bind to `process.env.PORT` (the platform's assigned port), not a hardcoded port. `apps/api/src/main.ts` reads `process.env.PORT ?? process.env.API_PORT ?? 4000` — `PORT` first, for exactly this reason.
- **PayU redirects back to the wrong host, or CORS errors in the browser console**: `WEB_URL`/`API_URL` on the API service are stale or still pointing at placeholder values — re-check step 4.
- **Invoice PDF has no logo / 500s on download**: the logo asset lives at `apps/api/assets/logo/mark.png` (checked into git, not gitignored) and is loaded via a `process.cwd()`-relative path — this only breaks if the API's working directory at runtime differs from the package root, which shouldn't happen with the Start Command above.
