import { buildForwardHashString, buildReverseHashString, buildVerifyPaymentHashString } from "./payu.hash";

describe("PayU hash string builders", () => {
  // Verified field order/pipe count against PayU's published formulas:
  // https://docs.payu.in/docs/generate-hash-payu-hosted
  // https://docs.payu.in/reference/verify_payment_api
  // Asserting split-by-index (rather than one long hand-typed literal) so
  // the test itself isn't just as error-prone as counting pipes by eye.

  it("builds the forward hash string as 17 pipe-delimited fields in the documented order", () => {
    const result = buildForwardHashString({
      key: "KEY",
      txnid: "TXNID",
      amount: "AMOUNT",
      productinfo: "PRODUCTINFO",
      firstname: "FIRSTNAME",
      email: "EMAIL",
      udf1: "UDF1",
      salt: "SALT",
    });
    const fields = result.split("|");

    expect(fields).toHaveLength(17);
    expect(fields).toEqual([
      "KEY",
      "TXNID",
      "AMOUNT",
      "PRODUCTINFO",
      "FIRSTNAME",
      "EMAIL",
      "UDF1", // udf1
      "", // udf2
      "", // udf3
      "", // udf4
      "", // udf5
      "",
      "",
      "",
      "",
      "", // 5 reserved blanks
      "SALT",
    ]);
  });

  it("builds the reverse (response verification) hash string as 18 fields in the documented order", () => {
    const result = buildReverseHashString({
      salt: "SALT",
      status: "STATUS",
      udf1: "UDF1",
      email: "EMAIL",
      firstname: "FIRSTNAME",
      productinfo: "PRODUCTINFO",
      amount: "AMOUNT",
      txnid: "TXNID",
      key: "KEY",
    });
    const fields = result.split("|");

    expect(fields).toHaveLength(18);
    expect(fields).toEqual([
      "SALT",
      "STATUS",
      "",
      "",
      "",
      "",
      "", // 5 reserved blanks
      "", // udf5
      "", // udf4
      "", // udf3
      "", // udf2
      "UDF1",
      "EMAIL",
      "FIRSTNAME",
      "PRODUCTINFO",
      "AMOUNT",
      "TXNID",
      "KEY",
    ]);
  });

  it("prefixes additionalCharges when present, confirmed against a real PayU sandbox card-fee postback", () => {
    const result = buildReverseHashString({
      salt: "SALT",
      status: "STATUS",
      udf1: "UDF1",
      email: "EMAIL",
      firstname: "FIRSTNAME",
      productinfo: "PRODUCTINFO",
      amount: "AMOUNT",
      txnid: "TXNID",
      key: "KEY",
      additionalCharges: "55.90",
    });

    expect(result.split("|")).toEqual([
      "55.90",
      "SALT",
      "STATUS",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "UDF1",
      "EMAIL",
      "FIRSTNAME",
      "PRODUCTINFO",
      "AMOUNT",
      "TXNID",
      "KEY",
    ]);
  });

  it("omits the additionalCharges prefix when not present (UPI / fee-less transactions)", () => {
    const withFee = buildReverseHashString({
      salt: "SALT",
      status: "STATUS",
      udf1: "UDF1",
      email: "EMAIL",
      firstname: "FIRSTNAME",
      productinfo: "PRODUCTINFO",
      amount: "AMOUNT",
      txnid: "TXNID",
      key: "KEY",
    });
    expect(withFee.startsWith("SALT|")).toBe(true);
  });

  it("builds the verify_payment hash string as key|command|var1|salt", () => {
    const result = buildVerifyPaymentHashString("KEY", "verify_payment", "TXNID", "SALT");
    expect(result.split("|")).toEqual(["KEY", "verify_payment", "TXNID", "SALT"]);
  });
});
