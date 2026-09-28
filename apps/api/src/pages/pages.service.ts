import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePageDto } from "./dto/create-page.dto";
import { UpdatePageDto } from "./dto/update-page.dto";
import { CreatePageSectionDto } from "./dto/create-section.dto";
import { UpdatePageSectionDto } from "./dto/update-section.dto";

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: { sections: { where: { isActive: true }, orderBy: { order: "asc" } } },
    });
    if (!page || !page.isActive) throw new NotFoundException("Page not found");
    return page;
  }

  async listAdminPages() {
    return this.prisma.page.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { sections: true } } },
    });
  }

  async findPage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  async createPage(dto: CreatePageDto) {
    const slug = slugify(dto.slug, { lower: true });
    const existing = await this.prisma.page.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A page with this slug already exists");
    return this.prisma.page.create({ data: { ...dto, slug } });
  }

  async updatePage(id: string, dto: UpdatePageDto) {
    const page = await this.findPage(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug) {
      const slug = slugify(dto.slug, { lower: true });
      const existing = await this.prisma.page.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A page with this slug already exists");
      data.slug = slug;
    }
    if (page.slug === "home" && dto.slug && dto.slug !== "home") {
      throw new ConflictException("The home page's slug cannot be changed");
    }
    return this.prisma.page.update({ where: { id }, data });
  }

  async removePage(id: string) {
    const page = await this.findPage(id);
    if (page.slug === "home") throw new ConflictException("The home page cannot be deleted");
    await this.prisma.page.delete({ where: { id } });
    return { success: true };
  }

  async listSectionsAdmin(pageId: string) {
    await this.findPage(pageId);
    return this.prisma.pageSection.findMany({ where: { pageId }, orderBy: { order: "asc" } });
  }

  async findSection(pageId: string, id: string) {
    const section = await this.prisma.pageSection.findFirst({ where: { id, pageId } });
    if (!section) throw new NotFoundException("Section not found");
    return section;
  }

  async createSection(pageId: string, dto: CreatePageSectionDto) {
    await this.findPage(pageId);
    const maxOrder = await this.prisma.pageSection.aggregate({
      where: { pageId },
      _max: { order: true },
    });
    return this.prisma.pageSection.create({
      data: {
        pageId,
        type: dto.type,
        config: dto.config as any,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSection(pageId: string, id: string, dto: UpdatePageSectionDto) {
    await this.findSection(pageId, id);
    return this.prisma.pageSection.update({
      where: { id },
      data: { ...dto, config: dto.config as any },
    });
  }

  async removeSection(pageId: string, id: string) {
    await this.findSection(pageId, id);
    await this.prisma.pageSection.delete({ where: { id } });
    return { success: true };
  }

  async reorderSections(pageId: string, items: { id: string; order: number }[]) {
    await this.findPage(pageId);
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.pageSection.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
    return this.listSectionsAdmin(pageId);
  }
}
