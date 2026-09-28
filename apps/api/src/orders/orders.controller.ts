import { Body, Controller, Get, Param, Patch, Query, Res, UseGuards, UseInterceptors } from "@nestjs/common";
import type { Response } from "express";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import { QueryOrdersDto } from "./dto/query-orders.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, type AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { AdminJwtAuthGuard } from "../common/guards/admin-jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditLog } from "../common/decorators/audit-log.decorator";
import { AuditLogInterceptor } from "../common/interceptors/audit-log.interceptor";
import { CurrentAdmin, type AuthenticatedAdmin } from "../common/decorators/current-admin.decorator";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listOwn(user.id);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.ordersService.findOwn(user.id, id);
  }

  @Get(":id/invoice")
  async invoice(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Res() res: Response) {
    await this.ordersService.findOwn(user.id, id); // 404s if not the owner
    await this.invoiceService.streamInvoice(id, res);
  }
}

@Controller("admin/orders")
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditLogInterceptor)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get("summary")
  @Permissions("orders:read")
  summary() {
    return this.ordersService.adminSummary();
  }

  @Get()
  @Permissions("orders:read")
  list(@Query() query: QueryOrdersDto) {
    return this.ordersService.listAdmin(query);
  }

  @Get(":id")
  @Permissions("orders:read")
  findOne(@Param("id") id: string) {
    return this.ordersService.findAdminOne(id);
  }

  @Get(":id/invoice")
  @Permissions("orders:read")
  async invoice(@Param("id") id: string, @Res() res: Response) {
    await this.invoiceService.streamInvoice(id, res);
  }

  @Patch(":id/status")
  @Permissions("orders:write")
  @AuditLog("Order")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.ordersService.updateStatus(id, dto, admin.id);
  }
}
