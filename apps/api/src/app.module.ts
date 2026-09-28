import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { AdminAuthModule } from "./admin-auth/admin-auth.module";
import { RolesModule } from "./roles/roles.module";
import { AdminsModule } from "./admins/admins.module";
import { UsersModule } from "./users/users.module";
import { CatalogModule } from "./catalog/catalog.module";
import { MediaModule } from "./media/media.module";
import { CartModule } from "./cart/cart.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { PagesModule } from "./pages/pages.module";
import { CollectionsModule } from "./collections/collections.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { LookbooksModule } from "./lookbooks/lookbooks.module";
import { SettingsModule } from "./settings/settings.module";
import { ShippingModule } from "./shipping/shipping.module";
import { CouponsModule } from "./coupons/coupons.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    AdminAuthModule,
    RolesModule,
    AdminsModule,
    UsersModule,
    CatalogModule,
    MediaModule,
    CartModule,
    WishlistModule,
    PagesModule,
    CollectionsModule,
    CampaignsModule,
    LookbooksModule,
    SettingsModule,
    ShippingModule,
    CouponsModule,
    PaymentsModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
