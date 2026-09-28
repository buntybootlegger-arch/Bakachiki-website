import { Body, Controller, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { PaymentsService } from "./payments.service";

/**
 * PayU posts back here directly from the customer's browser (surl/furl) —
 * no session cookie, no JWT. Authenticity is established via the hash +
 * server-to-server verify_payment call in PaymentsService, not by NestJS
 * guards. Body is typed as a plain Record (not a class DTO) so the global
 * ValidationPipe's whitelist doesn't reject PayU's payment-mode-dependent
 * extra fields (card/UPI/netbanking each send different optional fields).
 */
@Controller("payments/payu")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post("success")
  async success(@Body() payload: Record<string, string>, @Res() res: Response) {
    const { orderId } = await this.paymentsService.handlePayuCallback(payload);
    res.redirect(302, `${this.confirmationUrl()}?orderId=${encodeURIComponent(orderId)}`);
  }

  @Post("failure")
  async failure(@Body() payload: Record<string, string>, @Res() res: Response) {
    const { orderId } = await this.paymentsService.handlePayuCallback(payload);
    res.redirect(302, `${this.confirmationUrl()}?orderId=${encodeURIComponent(orderId)}`);
  }

  private confirmationUrl(): string {
    const webUrl = this.config.get<string>("WEB_URL") ?? "http://localhost:3000";
    return `${webUrl}/checkout/confirmation`;
  }
}
