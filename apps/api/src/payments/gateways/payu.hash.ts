import * as crypto from "crypto";

/**
 * Pure hash-string builders, split out from PayuGateway so the exact field
 * order/pipe placement can be unit-tested directly against PayU's documented
 * formulas without mocking ConfigService/crypto.
 *
 * Verified against https://docs.payu.in/docs/generate-hash-payu-hosted and
 * https://docs.payu.in/reference/verify_payment_api.
 */

export interface ForwardHashFields {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1: string;
  salt: string;
}

/** sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||SALT) */
export function buildForwardHashString(f: ForwardHashFields): string {
  return [
    f.key,
    f.txnid,
    f.amount,
    f.productinfo,
    f.firstname,
    f.email,
    f.udf1,
    "", // udf2
    "", // udf3
    "", // udf4
    "", // udf5
    "",
    "",
    "",
    "",
    "", // 5 reserved blanks
    f.salt,
  ].join("|");
}

export interface ReverseHashFields {
  salt: string;
  status: string;
  udf1: string;
  email: string;
  firstname: string;
  productinfo: string;
  amount: string;
  txnid: string;
  key: string;
  /** Present (e.g. "55.90") on card transactions PayU charged a convenience
   * fee on — confirmed empirically via a real sandbox postback's
   * `additionalCharges` field. When present, PayU prepends it to the hash:
   * sha512(additional_charges|SALT|status|...). Absent/empty on fee-less
   * transactions (UPI, no-fee cards), which use the plain formula. */
  additionalCharges?: string;
}

/** sha512(SALT|status|||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * — or, when `additionalCharges` is set, that whole string prefixed with
 * "<additionalCharges>|". */
export function buildReverseHashString(f: ReverseHashFields): string {
  const base = [
    f.salt,
    f.status,
    "",
    "",
    "",
    "",
    "", // 5 reserved blanks
    "", // udf5
    "", // udf4
    "", // udf3
    "", // udf2
    f.udf1,
    f.email,
    f.firstname,
    f.productinfo,
    f.amount,
    f.txnid,
    f.key,
  ].join("|");

  return f.additionalCharges ? `${f.additionalCharges}|${base}` : base;
}

/** sha512(key|command|var1|salt) */
export function buildVerifyPaymentHashString(key: string, command: string, var1: string, salt: string): string {
  return [key, command, var1, salt].join("|");
}

export function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}
