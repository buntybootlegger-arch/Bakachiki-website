import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import slugify from "slugify";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductsDto } from "./dto/query-products.dto";

const PUBLIC_LIST_INCLUDE = {
  images: { orderBy: { position: "asc" as const }, take: 1 },
  brand: { select: { name: true } },
  variants: { select: { stock: true } },
};

const PUBLIC_DETAIL_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  variants: true,
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
};

function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private mapListItem(product: any) {
    const totalVariantStock = product.variants?.reduce(
      (sum: number, v: { stock: number }) => sum + v.stock,
      0,
    );
    const inStock = product.variants?.length > 0 ? totalVariantStock > 0 : product.stock > 0;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: toNumber(product.price),
      salePrice: toNumber(product.salePrice),
      thumbnailUrl: product.images?.[0]?.url ?? null,
      brandName: product.brand?.name ?? null,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isBestSeller: product.isBestSeller,
      inStock,
    };
  }

  private mapDetail(product: any) {
    return {
      ...this.mapListItem(product),
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      category: product.category,
      brandId: product.brandId,
      images: product.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        position: img.position,
      })),
      variants: product.variants.map((v: any) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        price: toNumber(v.price),
        salePrice: toNumber(v.salePrice),
        stock: v.stock,
        imageUrl: v.imageUrl,
      })),
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      ogImageUrl: product.ogImageUrl,
    };
  }

  async listPublic(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }
    if (query.brandSlug) {
      where.brand = { slug: query.brandSlug };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { shortDescription: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.featured) where.isFeatured = true;
    if (query.newArrival) where.isNewArrival = true;
    if (query.bestSeller) where.isBestSeller = true;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === "price_asc"
        ? { price: "asc" }
        : query.sort === "price_desc"
          ? { price: "desc" }
          : query.sort === "name_asc"
            ? { name: "asc" }
            : { createdAt: "desc" };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PUBLIC_LIST_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => this.mapListItem(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** Resolves a set of product ids into public list DTOs, preserving the
   * given id order (used by Collections/Lookbooks to render curated sets). */
  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: PUBLIC_LIST_INCLUDE,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => this.mapListItem(p));
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PUBLIC_DETAIL_INCLUDE,
    });
    if (!product || !product.isActive) throw new NotFoundException("Product not found");
    return this.mapDetail(product);
  }

  async listAdmin(query: QueryProductsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ProductWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.categorySlug) where.category = { slug: query.categorySlug };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { images: { orderBy: { position: "asc" }, take: 1 }, category: true, brand: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOneAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, variants: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.name, { lower: true });
    const [slugTaken, skuTaken] = await Promise.all([
      this.prisma.product.findUnique({ where: { slug } }),
      this.prisma.product.findUnique({ where: { sku: dto.sku } }),
    ]);
    if (slugTaken) throw new ConflictException("A product with this slug already exists");
    if (skuTaken) throw new ConflictException("A product with this SKU already exists");

    const { images, variants, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        slug,
        images: images ? { create: images } : undefined,
        variants: variants ? { create: variants } : undefined,
      },
      include: { images: true, variants: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOneAdmin(id);
    const { images, variants, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };

    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!, { lower: true });
      const existing = await this.prisma.product.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A product with this slug already exists");
      data.slug = slug;
    }
    if (dto.sku) {
      const existing = await this.prisma.product.findFirst({ where: { sku: dto.sku, NOT: { id } } });
      if (existing) throw new ConflictException("A product with this SKU already exists");
    }

    return this.prisma.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({ data: images.map((img) => ({ ...img, productId: id })) });
      }
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId: id })),
        });
      }
      return tx.product.update({
        where: { id },
        data,
        include: { images: true, variants: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
