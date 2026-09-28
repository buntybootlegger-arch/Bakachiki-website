import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSettingsDto } from "./dto/update-settings.dto";

const SINGLETON_ID = "singleton";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
  }

  async update(dto: UpdateSettingsDto) {
    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      update: { ...dto, socialLinks: dto.socialLinks as any },
      create: { id: SINGLETON_ID, ...dto, socialLinks: dto.socialLinks as any },
    });
  }
}
