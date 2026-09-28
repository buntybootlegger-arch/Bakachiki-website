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

## Payments (Razorpay)

Not wired up yet — the checkout/payments/orders module is a later phase (see `ROADMAP.md`). The architecture (a `StorageProvider`-style interface per gateway) is designed to make adding Razorpay, and later other gateways, a matter of implementing one class.

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

## Deployment (when you're ready)

- **Frontend** → Vercel or Netlify (`apps/web`, Nuxt's `node-server` preset works on both)
- **Backend** → Render (`apps/api`, `pnpm build && pnpm start:prod`)
- **Database** → Render PostgreSQL
- **Media** → Cloudinary (see above)

Set the same environment variables from `.env.example` in each platform's dashboard. Never commit real secrets — `.env` files are gitignored.
