# Roadmap

The full platform spec describes 50+ admin-manageable modules. This file tracks what's built and what's next, mapped to the phases from the implementation plan, so a future session can resume without re-deriving architecture decisions.

## Phase 1 — Foundation, Auth/RBAC, Catalog, Storefront & Admin Shell — ✅ Done

- Monorepo (pnpm workspaces): `apps/api` (NestJS), `apps/web` (Nuxt 4), `packages/shared`
- Prisma schema: User/Address, Admin/Role/Permission/RolePermission/AdminPermission, Category, Brand, Product/ProductVariant/ProductImage, Media, Cart/CartItem, WishlistItem, Page/PageSection, AuditLog
- Customer auth (register/login/refresh/logout/forgot-reset password) — JWT access + httpOnly-cookie refresh, bcrypt hashing
- Admin auth — separate JWT audience/guard from customer auth
- RBAC — DB-backed roles + permissions, per-admin permission overrides (grant/revoke), enforced server-side via `PermissionsGuard` (recomputed per-request, so revocation is immediate)
- Catalog — categories (nested, reorderable), brands, products (variants, images, SEO fields, featured/new/bestseller flags), public + admin APIs
- Media — `StorageProvider` abstraction; local-disk in dev, Cloudinary auto-selected when env vars are present
- Cart — guest cart (cookie token) + logged-in cart with merge-on-login, server-side stock validation (no overselling)
- Wishlist — add/remove/list, "move to cart"
- Pages — `Page`/`PageSection` model + CRUD API + dynamic storefront renderer, 11 section types — **not hardcoded**, admin-editable from day one (see the Funky Fashion Rebrand slice below for the full type list)
- Storefront — home, shop (filters/sort/pagination), category page, product detail (variants, gallery), cart page/drawer, login/register, account (profile + addresses), wishlist
- Admin panel (`/admin/*` inside the same Nuxt app) — dashboard (counts + low-stock alerts), products (list/create/edit with images+variants), categories, brands, homepage builder, media library, admins & roles (create/disable/reset password/assign role/permission overrides)
- Animations — GSAP + ScrollTrigger: hero reveal, product-grid stagger reveal, cart-drawer transition, add-to-cart flying-image micro-interaction; respects `prefers-reduced-motion`
- Audit logging — lightweight interceptor capturing admin mutations (who/action/entity/entityId/newValue/timestamp/IP)
- Security — rate-limited login endpoints, global validation pipe, CORS locked to the web origin, no secrets in frontend code
- Tests — RBAC permission resolution, auth password/login paths, cart stock-protection (16 passing Jest tests)

**Known Phase 1 limitations** (intentional, to be addressed in later phases below):
- Refresh tokens are single-slot (one active session per user/admin) rather than a full session table
- Audit log captures `newValue` only, not a before/after diff, and has no admin UI yet
- Page builder supports manual up/down reordering, not full drag-and-drop or scheduling (start/end dates), or a preview/publish workflow
- Product `description` is rendered as plain text (no rich-text editor/sanitization yet — intentional, to avoid a stored-XSS vector until a sanitizing editor is added)

## Funky Fashion Rebrand + CMS Expansion — ✅ Done (out-of-sequence, ahead of Phase 2)

Pulled forward from Phases 3–4 at the client's request: the brand is a multi-category
"funky fashion / streetwear" label (T-shirts, shirts, oversized shirts, hoodies,
sweatshirts, jackets, jeans, pants, shorts, dresses, co-ord sets, accessories, bags,
caps — not a T-shirt-only shop), with a bold editorial visual language and a CMS
expressive enough to run it without hardcoding.

- **Architecture change**: `HomepageSection` was generalized into `Page` (slug-addressable)
  + `PageSection` (ordered, typed, `config: Json`). The homepage is the `Page` at slug
  `"home"`; any other slug is an admin-created landing page — same builder UI, same
  section-type system, reused rather than duplicated. A catch-all storefront route
  (`apps/web/app/pages/[...slug].vue`) resolves arbitrary landing-page slugs.
- Section types grew from 4 to 11: `HERO`, `BANNER`, `PRODUCT_GRID`, `CATEGORY_GRID`,
  `MARQUEE`, `VIDEO_BANNER`, `POSTER_GRID`, `COLLECTION_GRID`, `CAMPAIGN_TEASER`,
  `LOOKBOOK_TEASER`, `RICH_TEXT`. Each section can carry an `animation.preset`
  (`fadeUp`/`fadeIn`/`staggerUp`/`parallax`/`scaleReveal`/`none`), admin-selectable per
  section — a lightweight version of the Phase 4 "Animation Presets" item, as a config
  field rather than a dedicated table.
- New first-class content models, each with their own admin CRUD + public API, mirroring
  the Category/Brand pattern: `Collection` (curated cross-category merchandising, m2m to
  `Product`), `Campaign` (marketing landing pages, optional linked `Collection`), `Lookbook`
  + `LookbookSlide` (editorial slide sequences with tagged `productIds`).
- `SiteSettings` singleton — theme accent colors (primary/secondary) + SEO defaults,
  admin-editable at `/admin/settings`, injected into the storefront at runtime as CSS
  custom properties (`--accent-primary`/`--accent-secondary`) so a color change takes
  effect without a rebuild.
- New permissions: `pages:*` (renamed from `homepage:*`), `collections:*`, `campaigns:*`,
  `lookbooks:*` — see `packages/shared/src/permissions.ts`.
- Design system rework: new palette (ink/cream/charcoal neutrals + a lime/orange/pink/
  purple/blue/yellow accent set, with the live UI restricted to two admin-configurable
  accents at a time), `Unbounded` display type + `Space Grotesk` body + `Permanent Marker`
  for sticker/doodle accents, inline-SVG decorative components
  (`apps/web/app/components/decor/`: `DoodleBlob`, `StickerBurst`, `HalftoneDots`,
  `GrainOverlay`, `MarqueeText`).
- Animation system generalized: `useScrollReveal` → `useSectionAnimation` (preset-driven),
  plus `useMarquee`, `useParallax`, `useWishlistPulse`. GSAP-driven cart drawer transitions,
  product-card hover, and a global CSS page-transition. All still hard-gated by
  `usePrefersReducedMotion` — see `apps/web/app/composables/`.
- Wishlist gained an actual toggle UI (`useWishlistStore` + heart button on `ProductCard`
  and the product page) — previously only reachable via direct API calls from the
  `/wishlist` page itself.
- Seed data (`apps/api/prisma/seed.ts`) rebuilt with the full category breadth, 13 demo
  products, 3 collections, 1 campaign, 1 lookbook, and a home page exercising 8 of the
  11 section types.

**Known limitations carried forward**: no true scroll-pinned lookbook transitions (each
slide reveals on scroll via `scaleReveal`, not pinned); `PosterGrid`/theme colors have no
scheduling or A/B preview; `SiteSettings` covers accent colors + SEO defaults only, not a
full theme system (fonts/layout are still code-level, per the plan's explicit scope).

## Phase 2 — Commerce Core (Orders, Payments, Checkout) — ✅ Done

- Prisma: `Order`/`OrderItem`/`OrderStatusHistory`, `Payment`, `Coupon`/`CouponUsage`, `ShippingZone`/`ShippingRate`, `Product.gstRate` (additive), plus a raw-SQL `order_number_seq` sequence for atomic human-readable order numbers (`BK-1000`, ...)
- Checkout — `apps/web/app/pages/checkout/index.vue` (address → real shipping quote → coupon → payment method) → `POST /checkout/place-order`. `OrdersService.placeOrder` runs the whole thing in **one Prisma transaction**: re-derives pricing from `Product`/`ProductVariant` server-side (never trusts the client), decrements stock with a guarded `updateMany({ stock: { gte: qty } })` (atomic, race-safe — a concurrent checkout for the last unit rolls back cleanly), validates + redeems any coupon, computes shipping and per-item GST, creates the Order/Payment rows, clears the cart
- Order lifecycle — `OrderStatus` enum with an explicit `ALLOWED_TRANSITIONS` map in `OrdersService`; cancelling an order restores the reserved stock. Return/refund *processing* (approve/reject, restock-on-inspection) is still Phase 4 — the enum values (`RETURN_REQUESTED`/`RETURNED`/`REFUNDED`) exist now so that migration never has to be a breaking one
- Payment gateway — **PayU** (not Razorpay; client's explicit instruction), behind a `PaymentGateway` interface + `GatewayRegistry` so a second gateway is one new file + one registry line, no core changes. Classic hosted-checkout redirect-POST flow; hash formulas live in `apps/api/src/payments/gateways/payu.hash.ts` (unit-tested against PayU's docs — see `payu.hash.spec.ts`) and had to be corrected twice against **real sandbox transactions**: the commonly-published test salt (`eCwWELxi`) is stale — PayU's actual current test salt for key `gtKFFx` is `4R38IvwiV57FwVpsgOvTXBdLE4tHUXFW` (their own "Transaction Error" page discloses the correct salt when the hash is wrong); and PayU prepends an `additionalCharges` field to the *response* hash on card transactions that carry a convenience fee (`additional_charges|SALT|status|...`), confirmed by logging a real postback payload — absent on UPI/no-fee transactions. `PaymentsService.handlePayuCallback` never trusts the browser postback alone: verifies the hash, then calls PayU's server-to-server `verify_payment` API before marking anything `SUCCESS` (idempotent — a repeated callback for an already-resolved payment no-ops)
- Shipping — zone matching (state-specific zone beats a whole-country fallback), `baseRate + perKgRate × weightKg`, free-shipping threshold; admin CRUD at `/admin/shipping`
- Coupons — percentage/fixed/free-shipping, min order, max discount cap, total + per-customer usage limits, category/product scoping (discount allocated proportionally across qualifying lines only); admin CRUD at `/admin/coupons`. The checkout-UI preview endpoints (`/shipping/quote`, `/coupons/preview`) are explicitly non-authoritative — `placeOrder` re-validates everything for real inside its transaction
- GST invoice — `InvoiceService` streams a PDF (`pdfkit`) generated on-demand from Order+OrderItem (not persisted); available to the customer (own orders only) and admin
- Admin dashboard gained real Total Orders/Total Revenue stat cards (`GET /admin/orders/summary`), replacing the Phase-1 placeholder note

**Two pre-existing Phase 1 bugs surfaced and fixed while building this** (not scoped to commerce, but blocked it from working for any real user hitting these pages via a fresh/hard navigation rather than in-app SPA routing):
- Customer auth tokens live in memory client-side only (`middleware/auth.ts`), so a fresh page load runs `useAsyncData` server-side with no token, caching an empty/401 result that hydration never refetches. Fixed per-page (`account.vue`, `checkout/index.vue`, `checkout/confirmation.vue`, `orders/index.vue`, `orders/[id].vue`) with an `onMounted` refetch — middleware runs (and `tryRefresh()` resolves) before the page component mounts, so this is reliably after a real token exists. A separate, narrower case — `auth.user` interpolated directly in a template (`account.vue`'s greeting) — needed `<ClientOnly>` instead, since Vue intentionally doesn't repaint hydration text mismatches.
- Nuxt's file-based routing: `pages/orders.vue` + `pages/orders/[id].vue` (and `pages/checkout.vue` + `pages/checkout/confirmation.vue`) makes the flat file the *parent layout* for the nested route, which silently never renders without a `<NuxtPage />` outlet it doesn't have. Fixed by moving both flat files to `index.vue` inside their directory — the pattern `admin/orders/` already used correctly.

**Known Phase 2 scope boundaries** (intentional, deferred to later phases per ROADMAP):
- Only PayU is implemented (Razorpay was the original plan; superseded by explicit instruction) — the gateway abstraction supports adding it later
- No DB-encrypted gateway credentials — PayU key/salt are plain env vars via `ConfigService`, matching every other secret in this codebase (single-tenant store, no multi-tenant need today)
- No standalone admin "Payments" page — payment info shows inline on the order detail page
- One payment attempt per order (txnid = orderId) — a "retry payment" flow for a failed/abandoned PayU attempt is a future enhancement, not built here
- `adminAuth.can()` in the frontend is still the Phase 1 stub (server-side `PermissionsGuard` is the real enforcement) — new Orders/Coupons/Shipping admin pages don't add client-side permission gating either, matching every existing admin page

## Phase 3 — Full CMS & Merchandising

- Homepage/Landing Page Builder: remaining section types, drag-and-drop reorder, scheduling (start/end dates), preview/publish workflow, custom-HTML block (sanitized)
- Navigation builder (header mega-menu, footer columns)
- Blog CMS (draft/publish/schedule, categories/tags, related products)
- Global SEO settings, sitemap.xml, JSON-LD, robots config
- Media Library polish (search/filter/rename, bulk actions)
- Reviews & ratings (submission + moderation)

## Phase 4 — Operations & Insight

- Returns & refunds workflow
- Notifications (order lifecycle emails, low-stock alerts; webhook-ready for future WhatsApp)
- Analytics dashboard (real revenue/order charts, top products/categories, cohort views)
- Audit log admin UI (browse/filter the log already being captured)
- Animation Presets admin module (spec §37) — per-section `animation.preset` selection already shipped (see Funky Fashion Rebrand slice); this item is now specifically about a dedicated, named/reusable presets table (custom easing/duration per preset) rather than the fixed preset enum in `packages/shared/src/pages.ts`
- Product search upgraded to Meilisearch (current `/products` query filters remain API-compatible)

## Phase 5 — Polish & Launch

- Optional 3D/TresJS section for the homepage builder
- Full test suite (e2e for checkout/payments/webhooks, component tests for the storefront)
- CI/CD pipeline
- Production deployment: Vercel/Netlify (web), Render (api + Postgres), Cloudinary (media)

## Architecture notes for future phases (don't re-derive these)

- Admin panel lives inside the Nuxt app at `/admin/*` (`routeRules: { "/admin/**": { ssr: false } }` in `nuxt.config.ts`) — admin session tokens live only in client memory (never a server-readable cookie), so admin routes are intentionally client-rendered only. Don't try to SSR admin pages without changing that auth model first.
- Customer vs. admin auth are fully separate JWT audiences/guards/cookies (`/auth/*` vs `/admin-auth/*`) — don't merge them.
- `PermissionsGuard` recomputes effective permissions from the DB on every request rather than baking them into the JWT, specifically so a permission revocation takes effect immediately. Keep that property when extending RBAC.
- New Prisma models for Phases 2+ should be added as new migrations, not by editing Phase 1 models in place, unless a field is genuinely wrong. (The `HomepageSection` → `Page`/`PageSection` rename was the one deliberate exception — done pre-launch with no real data, and explicitly anticipated by this file and by a code comment in the original `packages/shared/src/homepage.ts`.)
- The storefront's live accent colors come from `SiteSettings` at runtime (`apps/web/app/plugins/theme.client.ts` sets `--accent-primary`/`--accent-secondary` on `documentElement`), not from `tailwind.config.ts` alone — a rebuild is not required to change them, only an edit in `/admin/settings`.
- `Collection` (merchandising) and `Category` (taxonomy) are intentionally separate models with different purposes — don't collapse them.
- Every new GSAP animation must go through `usePrefersReducedMotion` the same way `useSectionAnimation`/`useMarquee`/`useParallax`/`useFlyToCart` already do (hard-disable, not just a shorter duration). This has been a hard requirement since Phase 1 and stays one.
