import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS, ROLE_NAMES } from "@bakachiki/shared";

const prisma = new PrismaClient();

/** Rotating placeholder swatches matching the storefront's accent palette. */
const SWATCHES = [
  { bg: "C6FF3D", fg: "0E0E10" }, // lime
  { bg: "FF6A2B", fg: "0E0E10" }, // orange
  { bg: "FF3E9A", fg: "0E0E10" }, // pink
  { bg: "7B5CFF", fg: "F5F1E6" }, // purple
  { bg: "2E6BFF", fg: "F5F1E6" }, // blue
  { bg: "FFD23F", fg: "0E0E10" }, // yellow
];

function placeholder(text: string, index: number, size = "1000x1250") {
  const swatch = SWATCHES[index % SWATCHES.length];
  return `https://placehold.co/${size}/${swatch.bg}/${swatch.fg}?text=${encodeURIComponent(text)}`;
}

async function upsertCategory(name: string, slug: string, parentId?: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { parentId: parentId ?? null },
    create: { name, slug, parentId },
  });
}

interface ProductSeed {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  price: number;
  salePrice?: number;
  sizes?: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

async function main() {
  // 1. Permissions
  for (const permission of PERMISSIONS) {
    const [resource, action] = permission.split(":");
    await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [`${p.resource}:${p.action}`, p]));

  // 2. Roles + role-permission grants
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} default role` },
    });

    const grants = DEFAULT_ROLE_PERMISSIONS[roleName];
    for (const key of grants) {
      const permission = permissionByKey.get(key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // 3. Super admin
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const seedEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@bakachiki.dev";
  const seedPassword = process.env.SEED_SUPER_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await prisma.admin.upsert({
    where: { email: seedEmail },
    update: {},
    create: {
      email: seedEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      roleId: superAdminRole.id,
    },
  });

  // 4. Brand
  const brand = await prisma.brand.upsert({
    where: { slug: "bakachiki-house" },
    update: {},
    create: { name: "Bakachiki House", slug: "bakachiki-house" },
  });

  // 5. Category taxonomy — a real funky-fashion breadth, not a single T-shirt category.
  const tops = await upsertCategory("Tops", "tops");
  const outerwear = await upsertCategory("Outerwear", "outerwear");
  const bottoms = await upsertCategory("Bottoms", "bottoms");
  const dresses = await upsertCategory("Dresses", "dresses");
  const coordSets = await upsertCategory("Co-ord Sets", "co-ord-sets");
  const accessories = await upsertCategory("Accessories", "accessories");

  const tshirts = await upsertCategory("T-Shirts", "t-shirts", tops.id);
  const shirts = await upsertCategory("Shirts", "shirts", tops.id);
  const oversizedShirts = await upsertCategory("Oversized Shirts", "oversized-shirts", tops.id);
  const hoodies = await upsertCategory("Hoodies", "hoodies", tops.id);
  const sweatshirts = await upsertCategory("Sweatshirts", "sweatshirts", tops.id);
  const jackets = await upsertCategory("Jackets", "jackets", outerwear.id);
  const jeans = await upsertCategory("Jeans", "jeans", bottoms.id);
  const pants = await upsertCategory("Pants", "pants", bottoms.id);
  const shorts = await upsertCategory("Shorts", "shorts", bottoms.id);
  const bags = await upsertCategory("Bags", "bags", accessories.id);
  const caps = await upsertCategory("Caps", "caps", accessories.id);

  // 6. Demo products — one per leaf category, spanning the full catalog breadth.
  const productSeeds: ProductSeed[] = [
    { name: "Riot Graphic Tee", slug: "riot-graphic-tee", sku: "BKC-TSH-001", categorySlug: tshirts.slug, price: 1299, salePrice: 999, sizes: ["S", "M", "L", "XL"], isNewArrival: true, isFeatured: true },
    { name: "Static Check Shirt", slug: "static-check-shirt", sku: "BKC-SHT-001", categorySlug: shirts.slug, price: 1999, sizes: ["S", "M", "L", "XL"] },
    { name: "Blackout Oversized Shirt", slug: "blackout-oversized-shirt", sku: "BKC-OSH-001", categorySlug: oversizedShirts.slug, price: 2199, sizes: ["M", "L", "XL"], isFeatured: true },
    { name: "Neon Bolt Hoodie", slug: "neon-bolt-hoodie", sku: "BKC-HOD-001", categorySlug: hoodies.slug, price: 2999, salePrice: 2499, sizes: ["S", "M", "L", "XL"], isFeatured: true, isBestSeller: true },
    { name: "Grid Static Sweatshirt", slug: "grid-static-sweatshirt", sku: "BKC-SWT-001", categorySlug: sweatshirts.slug, price: 2599, sizes: ["S", "M", "L"] },
    { name: "Chrome Bomber Jacket", slug: "chrome-bomber-jacket", sku: "BKC-JKT-001", categorySlug: jackets.slug, price: 4999, salePrice: 3999, sizes: ["S", "M", "L", "XL"], isBestSeller: true },
    { name: "Acid Wash Straight Jeans", slug: "acid-wash-straight-jeans", sku: "BKC-JNS-001", categorySlug: jeans.slug, price: 2799, sizes: ["28", "30", "32", "34"] },
    { name: "Cargo Utility Pants", slug: "cargo-utility-pants", sku: "BKC-PNT-001", categorySlug: pants.slug, price: 2399, sizes: ["28", "30", "32", "34"], isFeatured: true },
    { name: "Terry Logo Shorts", slug: "terry-logo-shorts", sku: "BKC-SHR-001", categorySlug: shorts.slug, price: 1399, sizes: ["S", "M", "L"] },
    { name: "Static Slip Dress", slug: "static-slip-dress", sku: "BKC-DRS-001", categorySlug: dresses.slug, price: 2699, sizes: ["S", "M", "L"], isNewArrival: true },
    { name: "Neon Grid Co-ord Set", slug: "neon-grid-coord-set", sku: "BKC-CRD-001", categorySlug: coordSets.slug, price: 3499, sizes: ["S", "M", "L"], isFeatured: true, isNewArrival: true },
    { name: "Halftone Tote Bag", slug: "halftone-tote-bag", sku: "BKC-BAG-001", categorySlug: bags.slug, price: 1199 },
    { name: "Bolt Trucker Cap", slug: "bolt-trucker-cap", sku: "BKC-CAP-001", categorySlug: caps.slug, price: 899, isBestSeller: true },
  ];

  const productIdBySlug = new Map<string, string>();
  for (const [index, seed] of productSeeds.entries()) {
    const existing = await prisma.product.findUnique({ where: { slug: seed.slug } });
    if (existing) {
      productIdBySlug.set(seed.slug, existing.id);
      // gstRate/weightGrams have no admin UI yet (seed-only fields as of
      // Phase 2), so it's safe to always sync them onto already-seeded
      // products — unlike name/price/etc below, nothing else could have
      // legitimately changed them since the seed created the row.
      if (Number(existing.gstRate) === 0 || existing.weightGrams === null) {
        await prisma.product.update({ where: { id: existing.id }, data: { gstRate: 12, weightGrams: 350 } });
      }
      continue;
    }
    const sizes = seed.sizes ?? ["One Size"];
    const product = await prisma.product.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        sku: seed.sku,
        shortDescription: `${seed.name} — bold, streetwear-ready, made for the drop.`,
        description: `${seed.name} from the Bakachiki funky fashion line. Cut for movement, styled for the street.`,
        price: seed.price,
        salePrice: seed.salePrice,
        stock: sizes.length * 30,
        gstRate: 12,
        weightGrams: 350,
        isFeatured: seed.isFeatured ?? false,
        isNewArrival: seed.isNewArrival ?? false,
        isBestSeller: seed.isBestSeller ?? false,
        categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: seed.categorySlug } })).id,
        brandId: brand.id,
        images: {
          create: [
            { url: placeholder(seed.name, index), position: 0 },
            { url: placeholder(`${seed.name} 2`, index + 1), position: 1 },
          ],
        },
        variants: {
          create: sizes.map((size, sizeIndex) => ({
            sku: `${seed.sku}-${size.replace(/\s+/g, "")}`,
            size,
            price: seed.price,
            salePrice: seed.salePrice,
            stock: 30,
            imageUrl: sizeIndex === 0 ? undefined : placeholder(`${seed.name} ${size}`, index + sizeIndex),
          })),
        },
      },
    });
    productIdBySlug.set(seed.slug, product.id);
  }

  // 7. Collections — curated, cross-category groupings distinct from taxonomy.
  async function upsertCollection(name: string, slug: string, description: string, index: number, productSlugs: string[]) {
    const collection = await prisma.collection.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description, coverImageUrl: placeholder(name, index, "1600x900") },
    });
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        products: {
          set: productSlugs.map((s) => ({ id: productIdBySlug.get(s)! })),
        },
      },
    });
    return collection;
  }

  const neonDrop = await upsertCollection(
    "Neon Drop",
    "neon-drop",
    "The loudest pieces of the season, built to glow.",
    0,
    ["neon-bolt-hoodie", "riot-graphic-tee", "neon-grid-coord-set", "bolt-trucker-cap"],
  );
  await upsertCollection(
    "Blackout Essentials",
    "blackout-essentials",
    "Monochrome staples with maximum edge.",
    1,
    ["blackout-oversized-shirt", "chrome-bomber-jacket", "cargo-utility-pants", "halftone-tote-bag"],
  );
  await upsertCollection(
    "Retro Static",
    "retro-static",
    "Y2K-leaning silhouettes remixed for now.",
    2,
    ["static-check-shirt", "acid-wash-straight-jeans", "grid-static-sweatshirt", "static-slip-dress"],
  );

  // 8. Campaign
  const campaign = await prisma.campaign.upsert({
    where: { slug: "neon-drop-campaign" },
    update: {},
    create: {
      name: "The Neon Drop",
      slug: "neon-drop-campaign",
      tagline: "Wear the noise.",
      description: "A limited run built around one loud, unmissable idea: turn it up.",
      heroImageUrl: placeholder("The Neon Drop", 0, "1920x1080"),
      themeColor: "#C6FF3D",
      collectionId: neonDrop.id,
      isActive: true,
    },
  });

  // 9. Lookbook
  const lookbook = await prisma.lookbook.upsert({
    where: { slug: "street-static" },
    update: {},
    create: {
      title: "Street Static",
      slug: "street-static",
      coverImageUrl: placeholder("Street Static", 3, "1600x900"),
    },
  });
  await prisma.lookbookSlide.deleteMany({ where: { lookbookId: lookbook.id } });
  await prisma.lookbookSlide.createMany({
    data: [
      {
        lookbookId: lookbook.id,
        mediaUrl: placeholder("Look 01", 0, "1400x1750"),
        caption: "Neon Bolt Hoodie layered over the Riot Graphic Tee.",
        position: 0,
        productIds: [productIdBySlug.get("neon-bolt-hoodie")!, productIdBySlug.get("riot-graphic-tee")!],
      },
      {
        lookbookId: lookbook.id,
        mediaUrl: placeholder("Look 02", 1, "1400x1750"),
        caption: "Chrome Bomber over Cargo Utility Pants.",
        position: 1,
        productIds: [productIdBySlug.get("chrome-bomber-jacket")!, productIdBySlug.get("cargo-utility-pants")!],
      },
      {
        lookbookId: lookbook.id,
        mediaUrl: placeholder("Look 03", 2, "1400x1750"),
        caption: "Neon Grid Co-ord Set, head to toe.",
        position: 2,
        productIds: [productIdBySlug.get("neon-grid-coord-set")!],
      },
      {
        lookbookId: lookbook.id,
        mediaUrl: placeholder("Look 04", 3, "1400x1750"),
        caption: "Static Slip Dress with the Bolt Trucker Cap.",
        position: 3,
        productIds: [productIdBySlug.get("static-slip-dress")!, productIdBySlug.get("bolt-trucker-cap")!],
      },
    ],
  });

  // 10. Site settings (theme colors + SEO defaults)
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "Bakachiki",
      colorInk: "#0E0E10",
      colorPaper: "#F5F1E6",
      colorAccentPrimary: "#C6FF3D",
      colorAccentSecondary: "#FF6A2B",
      defaultSeoTitle: "Bakachiki — Funky Fashion",
      defaultSeoDescription: "Bold, editorial, streetwear-inspired fashion for the loud and unbothered.",
    },
  });

  // 11. Home page — rebuilt every run to exercise the new section types.
  const homePage = await prisma.page.upsert({
    where: { slug: "home" },
    update: {},
    create: { slug: "home", title: "Home" },
  });
  await prisma.pageSection.deleteMany({ where: { pageId: homePage.id } });
  await prisma.pageSection.createMany({
    data: [
      {
        pageId: homePage.id,
        type: "HERO",
        order: 0,
        config: {
          heading: "WEAR THE NOISE",
          subheading: "Bold, funky, streetwear-inspired drops — new arrivals weekly.",
          mediaType: "IMAGE",
          imageUrl: placeholder("Wear The Noise", 0, "1920x1000"),
          ctaText: "Shop the Drop",
          ctaUrl: "/shop",
          animation: { preset: "fadeUp" },
        },
      },
      {
        pageId: homePage.id,
        type: "MARQUEE",
        order: 1,
        config: { text: "FUNKY  //  BOLD  //  STREET  //  PREMIUM  //  ", repeat: 4, speed: 40 },
      },
      {
        pageId: homePage.id,
        type: "COLLECTION_GRID",
        order: 2,
        config: {
          title: "Shop Collections",
          collectionSlugs: ["neon-drop", "blackout-essentials", "retro-static"],
          animation: { preset: "staggerUp" },
        },
      },
      {
        pageId: homePage.id,
        type: "PRODUCT_GRID",
        order: 3,
        config: { title: "New Arrivals", source: "NEW_ARRIVALS", limit: 8, animation: { preset: "staggerUp" } },
      },
      {
        pageId: homePage.id,
        type: "CAMPAIGN_TEASER",
        order: 4,
        config: { campaignSlug: campaign.slug, heading: "The Neon Drop", ctaText: "Explore the Campaign" },
      },
      {
        pageId: homePage.id,
        type: "CATEGORY_GRID",
        order: 5,
        config: {
          title: "Shop by Category",
          categorySlugs: [hoodies.slug, jeans.slug, dresses.slug, caps.slug],
          animation: { preset: "staggerUp" },
        },
      },
      {
        pageId: homePage.id,
        type: "LOOKBOOK_TEASER",
        order: 6,
        config: { lookbookSlug: lookbook.slug, heading: "Street Static — The Lookbook", ctaText: "View Lookbook" },
      },
      {
        pageId: homePage.id,
        type: "PRODUCT_GRID",
        order: 7,
        config: { title: "Best Sellers", source: "BEST_SELLERS", limit: 8, animation: { preset: "staggerUp" } },
      },
    ],
  });

  // 12. Shipping (Phase 2) — a single whole-India zone with one flat + per-kg rate.
  const indiaZone = await prisma.shippingZone.upsert({
    where: { id: "seed-zone-india" },
    update: {},
    create: { id: "seed-zone-india", name: "India", countries: ["IN"], states: [] },
  });
  const existingRate = await prisma.shippingRate.findFirst({ where: { zoneId: indiaZone.id } });
  if (!existingRate) {
    await prisma.shippingRate.create({
      data: {
        zoneId: indiaZone.id,
        label: "Standard Shipping",
        baseRate: 59,
        perKgRate: 20,
        freeShippingThreshold: 1499,
        codAvailable: true,
      },
    });
  }

  // 13. Coupons (Phase 2) — one store-wide welcome discount for demo/testing.
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrderAmount: 999,
      maxDiscountAmount: 500,
      usageLimitPerCustomer: 1,
      isActive: true,
    },
  });

  console.log(`Seed complete. Super admin: ${seedEmail} / ${seedPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
