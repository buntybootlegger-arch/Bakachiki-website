export interface GatewayInitParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface GatewayInitResult {
  actionUrl: string;
  fields: Record<string, string>;
}

export interface GatewayVerifyResult {
  success: boolean;
  gatewayTxnId: string;
  amount: number;
  rawResponse: Record<string, unknown>;
}

export interface PaymentGateway {
  initiate(params: GatewayInitParams): GatewayInitResult;
  /** Hash-only check on a browser postback — never sufficient on its own,
   * always followed by verifyServerSide() before trusting the result. */
  verifyCallbackHash(payload: Record<string, string>): boolean;
  /** Authoritative, server-to-server status check directly with the gateway. */
  verifyServerSide(txnId: string): Promise<GatewayVerifyResult>;
}
