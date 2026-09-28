import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: "asc" },
    });
  }

  async listAdmin() {
    return this.prisma.category.findMany({
      orderBy: { position: "asc" },
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category || !category.isActive) throw new NotFoundException("Category not found");
    return category;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.name, { lower: true });
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A category with this slug already exists");

    return this.prisma.category.create({
      data: { ...dto, slug },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!, { lower: true });
      const existing = await this.prisma.category.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) throw new ConflictException("A category with this slug already exists");
      data.slug = slug;
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async reorder(items: { id: string; position: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({ where: { id: item.id }, data: { position: item.position } }),
      ),
    );
    return this.listAdmin();
  }
}
