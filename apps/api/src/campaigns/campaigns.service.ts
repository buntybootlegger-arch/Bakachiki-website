import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import slugify from "slugify";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCampaignDto } from "./dto/create-campaign.dto";
import { UpdateCampaignDto } from "./dto/update-campaign.dto";

const PUBLIC_INCLUDE = { collection: true };

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublicBySlug(slug: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { slug },
      include: PUBLIC_INCLUDE,
    });
    if (!campaign || !campaign.isActive) throw new NotFoundException("Campaign not found");
    return campaign;
  }

  listAdmin() {
    return this.prisma.campaign.findMany({ orderBy: { position: "asc" }, include: PUBLIC_INCLUDE });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id }, include: PUBLIC_INCLUDE });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return campaign;
  }

  async create(dto: CreateCampaignDto) {
    const slug = dto.slug ? slugify(dto.slug, { lower: true }) : slugify(dto.name, { lower: true });
    const existing = await this.prisma.campaign.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("A campaign with this slug already exists");
    return this.prisma.campaign.create({ data: { ...dto, slug } });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    const data = { ...dto } as Record<string, unknown>;
    if (dto.slug || dto.name) {
      const slug = slugify(dto.slug ?? dto.name!, { lower: true });
      const existing = await this.prisma.campaign.findFirst({ where: { slug, NOT: { id } } });
      if (existing) throw new ConflictException("A campaign with this slug already exists");
      data.slug = slug;
    }
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.campaign.delete({ where: { id } });
    return { success: true };
  }
}
