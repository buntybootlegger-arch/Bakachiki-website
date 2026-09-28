import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { ProductsService } from "../catalog/products/products.service";
import { CreateLookbookDto } from "./dto/create-lookbook.dto";
import { UpdateLookbookDto } from "./dto/update-lookbook.dto";
import type { SetLookbookSlidesDto } from "./dto/set-lookbook-slides.dto";

@Injectable()
export class LookbooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  listPublic() {
    return this.prisma.lookbook.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
  }

  async findPublicBySlug(slug: string) {
    const lookbook = await this.prisma.lookbook.findUnique({
      where: { slug },
      include: { slides: { orderBy: { position: "asc" } } },
    });
    if (!lookbook || !lookbook.isActive) throw new NotFoundException("Lookbook not found");
    const slides = await Promise.all(
      lookbook.slides.map(async (slide) => ({
        ...slide,
        products: await this.productsService.findByIds(slide.productIds),
      })),
    );
    return { ...lookbook, slides };
  }

  listAdmin() {
    return this.prisma.lookbook.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { slides: true } } },
    });
  }

  async findOne(id: string) {
    const lookbook = await this.prisma.lookbook.findUnique({
      where: { id },
      include: { slides: { orderBy: { position: "asc" } } },
    });
    if (!lookbook) throw new NotFoundException("Lookbook not found");
    return lookbook;
  }

  async create(dto: CreateLookbookDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.title, { lower: true });
    const existing = await this.prisma.lookbook.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A lookbook with this slug already exists");
    return this.prisma.lookbook.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateLookbookDto) {
    await this.findOne(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug || dto.title) {
      const slug = slugify(dto.slug ?? dto.title!, { lower: true });
      const existing = await this.prisma.lookbook.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A lookbook with this slug already exists");
      data.slug = slug;
    }
    return this.prisma.lookbook.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.lookbook.delete({ where: { id } });
    return { success: true };
  }

  async setSlides(id: string, dto: SetLookbookSlidesDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.lookbookSlide.deleteMany({ where: { lookbookId: id } });
      if (dto.slides.length) {
        await tx.lookbookSlide.createMany({
          data: dto.slides.map((slide) => ({ ...slide, lookbookId: id })),
        });
      }
      return tx.lookbook.findUnique({
        where: { id },
        include: { slides: { orderBy: { position: "asc" } } },
      });
    });
  }
}
