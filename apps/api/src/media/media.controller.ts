import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MediaService, MAX_UPLOAD_SIZE_BYTES } from "./media.service";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";

@Controller("admin/media")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Permissions("media:read")
  list(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.mediaService.list(page ? Number(page) : 1, pageSize ? Number(pageSize) : 40);
  }

  @Post("upload")
  @Permissions("media:write")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_SIZE_BYTES } }), AuditLogInterceptor)
  @AuditLog("Media")
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.upload(file);
  }

  @Delete(":id")
  @Permissions("media:write")
  @UseInterceptors(AuditLogInterceptor)
  @AuditLog("Media")
  remove(@Param("id") id: string) {
    return this.mediaService.remove(id);
  }
}
