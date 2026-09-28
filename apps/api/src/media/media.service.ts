import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { StorageProvider } from "./storage-provider.interface";
import { LocalDiskProvider } from "./providers/local-disk.provider";
import { CloudinaryProvider } from "./providers/cloudinary.provider";

const ALLOWED_MIME_TYPES: Record<string, MediaType> = {
  "image/jpeg": MediaType.IMAGE,
  "image/png": MediaType.IMAGE,
  "image/webp": MediaType.IMAGE,
  "image/svg+xml": MediaType.IMAGE,
  "image/gif": MediaType.GIF,
  "video/mp4": MediaType.VIDEO,
  "video/webm": MediaType.VIDEO,
  "application/pdf": MediaType.DOCUMENT,
};

export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly localDiskProvider: LocalDiskProvider,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  private get activeProvider(): { name: string; instance: StorageProvider } {
    const hasCloudinary = Boolean(
      this.config.get<string>("CLOUDINARY_CLOUD_NAME") &&
        this.config.get<string>("CLOUDINARY_API_KEY") &&
        this.config.get<string>("CLOUDINARY_API_SECRET"),
    );
    return hasCloudinary
      ? { name: "cloudinary", instance: this.cloudinaryProvider }
      : { name: "local", instance: this.localDiskProvider };
  }

  async upload(file: Express.Multer.File) {
    if (!file) throw new BadRequestException("No file provided");
    const mediaType = ALLOWED_MIME_TYPES[file.mimetype];
    if (!mediaType) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException("File exceeds the maximum allowed size");
    }

    const { instance } = this.activeProvider;
    const result = await instance.upload(file);

    return this.prisma.media.create({
      data: {
        provider: result.provider,
        publicId: result.publicId,
        url: result.url,
        type: mediaType,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: result.width,
        height: result.height,
      },
    });
  }

  list(page = 1, pageSize = 40) {
    return this.prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async remove(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException("Media not found");

    if (media.publicId) {
      const providerInstance =
        media.provider === "cloudinary" ? this.cloudinaryProvider : this.localDiskProvider;
      await providerInstance.delete(media.publicId);
    }

    await this.prisma.media.delete({ where: { id } });
    return { success: true };
  }
}
