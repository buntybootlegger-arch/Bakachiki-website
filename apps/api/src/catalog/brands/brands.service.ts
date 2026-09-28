import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  listAdmin() {
    return this.prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException("Brand not found");
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.name, { lower: true });
    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A brand with this slug already exists");
    return this.prisma.brand.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.findOne(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!, { lower: true });
      const existing = await this.prisma.brand.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A brand with this slug already exists");
      data.slug = slug;
    }
    return this.prisma.brand.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.brand.delete({ where: { id } });
    return { success: true };
  }
}
