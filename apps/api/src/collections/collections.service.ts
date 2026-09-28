import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "../catalog/products/products.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  listPublic() {
    return this.prisma.collection.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    });
  }

  async findPublicBySlug(slug: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      include: { products: { select: { id: true } } },
    });
    if (!collection || !collection.isActive) throw new NotFoundException("Collection not found");
    const products = await this.productsService.findByIds(collection.products.map((p) => p.id));
    const { products: _ids, ...rest } = collection;
    return { ...rest, products };
  }

  listAdmin() {
    return this.prisma.collection.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true, slug: true } } },
    });
    if (!collection) throw new NotFoundException("Collection not found");
    return collection;
  }

  async create(dto: CreateCollectionDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.name, { lower: true });
    const existing = await this.prisma.collection.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A collection with this slug already exists");
    return this.prisma.collection.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateCollectionDto) {
    await this.findOne(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!, { lower: true });
      const existing = await this.prisma.collection.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A collection with this slug already exists");
      data.slug = slug;
    }
    return this.prisma.collection.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.collection.delete({ where: { id } });
    return { success: true };
  }

  async setProducts(id: string, productIds: string[]) {
    await this.findOne(id);
    return this.prisma.collection.update({
      where: { id },
      data: { products: { set: productIds.map((productId) => ({ id: productId })) } },
      include: { products: { select: { id: true, name: true, slug: true } } },
    });
  }
}
