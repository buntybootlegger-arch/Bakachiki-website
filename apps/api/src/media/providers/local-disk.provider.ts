import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import type { StorageProvider, UploadResult } from "../storage-provider.interface";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

@Injectable()
export class LocalDiskProvider implements StorageProvider {
  private readonly logger = new Logger(LocalDiskProvider.name);

  constructor(private readonly config: ConfigService) {}

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);

    const apiUrl = this.config.get<string>("API_URL") ?? "http://localhost:4000";
    return {
      provider: "local",
      publicId: filename,
      url: `${apiUrl}/uploads/${filename}`,
    };
  }

  async delete(publicId: string): Promise<void> {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, publicId));
    } catch (err) {
      this.logger.warn(`Could not delete local file ${publicId}: ${(err as Error).message}`);
    }
  }
}
