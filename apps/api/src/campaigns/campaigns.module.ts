import { Module } from "@nestjs/common";
import { CampaignsController, AdminCampaignsController } from "./campaigns.controller";
import { CampaignsService } from "./campaigns.service";

@Module({
  controllers: [CampaignsController, AdminCampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
