import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import type { StorageProvider, UploadResult } from "../storage-provider.interface";

@Injectable()
export class CloudinaryProvider implements StorageProvider {
  constructor(config: ConfigService) {
    // Config is applied lazily and tolerates missing values so this provider can be
    // instantiated even when Cloudinary isn't configured (MediaService only routes
    // uploads here once it has verified all three env vars are present).
    cloudinary.config({
      cloud_name: config.get<string>("CLOUDINARY_CLOUD_NAME") ?? "",
      api_key: config.get<string>("CLOUDINARY_API_KEY") ?? "",
      api_secret: config.get<string>("CLOUDINARY_API_SECRET") ?? "",
      secure: true,
    });
  }

  upload(file: Express.Multer.File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "bakachiki", resource_type: "auto" },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }
          resolve({
            provider: "cloudinary",
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
          });
        },
      );
      stream.end(file.buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
  }
}
