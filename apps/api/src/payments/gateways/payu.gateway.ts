import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  GatewayInitParams,
  GatewayInitResult,
  GatewayVerifyResult,
  PaymentGateway,
} from "./payment-gateway.interface";
import { buildForwardHashString, buildReverseHashString, buildVerifyPaymentHashString, sha512 } from "./payu.hash";

/**
 * PayU India "hosted checkout" (classic, redirect-POST) integration.
 * Hash field order lives in payu.hash.ts (unit-tested there against PayU's
 * documented formulas) — don't duplicate the pipe-building logic here.
 */
@Injectable()
export class PayuGateway implements PaymentGateway {
  constructor(private readonly config: ConfigService) {}

  private get key(): string {
    return this.config.getOrThrow<string>("PAYU_MERCHANT_KEY");
  }

  private get salt(): string {
    return this.config.getOrThrow<string>("PAYU_MERCHANT_SALT");
  }

  private get isLive(): boolean {
    return (this.config.get<string>("PAYU_MODE") ?? "test") === "live";
  }

  private get checkoutUrl(): string {
    return this.isLive ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";
  }

  private get verifyUrl(): string {
    return this.isLive
      ? "https://info.payu.in/merchant/postservice.php?form=2"
      : "https://test.payu.in/merchant/postservice.php?form=2";
  }

  private get apiUrl(): string {
    return this.config.getOrThrow<string>("API_URL");
  }

  initiate(params: GatewayInitParams): GatewayInitResult {
    const { key, salt } = this;
    const txnid = params.orderId;
    const amount = params.amount.toFixed(2);
    const productinfo = `Order ${params.orderNumber}`;
    const firstname = params.customerName;
    const email = params.customerEmail;
    const udf1 = params.orderId;

    const hash = sha512(buildForwardHashString({ key, txnid, amount, productinfo, firstname, email, udf1, salt }));

    return {
      actionUrl: this.checkoutUrl,
      fields: {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone: params.customerPhone,
        surl: `${this.apiUrl}/api/payments/payu/success`,
        furl: `${this.apiUrl}/api/payments/payu/failure`,
        udf1,
        hash,
      },
    };
  }

  verifyCallbackHash(payload: Record<string, string>): boolean {
    const { key, salt } = this;
    const {
      status = "",
      txnid = "",
      amount = "",
      productinfo = "",
      firstname = "",
      email = "",
      udf1 = "",
      hash = "",
      additionalCharges,
    } = payload;

    const expectedHash = sha512(
      buildReverseHashString({
        salt,
        status,
        udf1,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        key,
        additionalCharges,
      }),
    );
    return expectedHash === hash;
  }

  async verifyServerSide(txnId: string): Promise<GatewayVerifyResult> {
    const { key, salt } = this;
    const command = "verify_payment";
    const hash = sha512(buildVerifyPaymentHashString(key, command, txnId, salt));

    const body = new URLSearchParams({ key, command, var1: txnId, hash });
    const response = await fetch(this.verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const json = (await response.json()) as {
      status?: number;
      transaction_details?: Record<string, { status?: string; amt?: string; mihpayid?: string }>;
    };

    const detail = json.transaction_details?.[txnId];
    return {
      success: json.status === 1 && detail?.status === "success",
      gatewayTxnId: detail?.mihpayid ?? txnId,
      amount: detail?.amt ? Number(detail.amt) : 0,
      rawResponse: json as unknown as Record<string, unknown>,
    };
  }
}
