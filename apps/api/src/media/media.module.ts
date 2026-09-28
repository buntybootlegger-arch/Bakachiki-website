import { Module } from "@nestjs/common";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { LocalDiskProvider } from "./providers/local-disk.provider";
import { CloudinaryProvider } from "./providers/cloudinary.provider";

@Module({
  controllers: [MediaController],
  providers: [MediaService, LocalDiskProvider, CloudinaryProvider],
  exports: [MediaService],
})
export class MediaModule {}
