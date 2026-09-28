-- CreateEnum
CREATE TYPE "PageSectionType" AS ENUM ('HERO', 'BANNER', 'PRODUCT_GRID', 'CATEGORY_GRID', 'MARQUEE', 'VIDEO_BANNER', 'POSTER_GRID', 'COLLECTION_GRID', 'CAMPAIGN_TEASER', 'LOOKBOOK_TEASER', 'RICH_TEXT');

-- CreateEnum
CREATE TYPE "LookbookMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "PageSectionType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "page_sections_pageId_idx" ON "page_sections"("pageId");

-- MigrateData: carry the existing homepage_sections rows into page_sections
-- scoped to a seeded "home" Page, before the old table/enum are dropped.
INSERT INTO "pages" ("id", "slug", "title", "isActive", "createdAt", "updatedAt")
VALUES ('home', 'home', 'Home', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "page_sections" ("id", "pageId", "type", "order", "isActive", "config", "createdAt", "updatedAt")
SELECT "id", 'home', "type"::text::"PageSectionType", "order", "isActive", "config", "createdAt", "updatedAt"
FROM "homepage_sections";

-- DropTable
DROP TABLE "homepage_sections";

-- DropEnum
DROP TYPE "HomepageSectionType";

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "heroImageUrl" TEXT,
    "heroVideoUrl" TEXT,
    "themeColor" TEXT,
    "collectionId" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "ogImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookbooks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lookbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookbook_slides" (
    "id" TEXT NOT NULL,
    "lookbookId" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" "LookbookMediaType" NOT NULL DEFAULT 'IMAGE',
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "lookbook_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "siteName" TEXT NOT NULL DEFAULT 'Bakachiki',
    "colorInk" TEXT NOT NULL DEFAULT '#0E0E10',
    "colorPaper" TEXT NOT NULL DEFAULT '#F5F1E6',
    "colorAccentPrimary" TEXT NOT NULL DEFAULT '#C6FF3D',
    "colorAccentSecondary" TEXT NOT NULL DEFAULT '#FF6A2B',
    "defaultSeoTitle" TEXT NOT NULL DEFAULT 'Bakachiki — Funky Fashion',
    "defaultSeoDescription" TEXT NOT NULL DEFAULT 'Bold, editorial, streetwear-inspired fashion.',
    "defaultOgImageUrl" TEXT,
    "socialLinks" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionToProduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_collectionId_idx" ON "campaigns"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "lookbooks_slug_key" ON "lookbooks"("slug");

-- CreateIndex
CREATE INDEX "lookbook_slides_lookbookId_idx" ON "lookbook_slides"("lookbookId");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToProduct_AB_unique" ON "_CollectionToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToProduct_B_index" ON "_CollectionToProduct"("B");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookbook_slides" ADD CONSTRAINT "lookbook_slides_lookbookId_fkey" FOREIGN KEY ("lookbookId") REFERENCES "lookbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionToProduct" ADD CONSTRAINT "_CollectionToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
