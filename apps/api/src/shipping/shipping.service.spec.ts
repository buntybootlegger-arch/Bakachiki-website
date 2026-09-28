import { BadRequestException } from "@nestjs/common";
import { ShippingService } from "./shipping.service";

function makeService() {
  const prisma = {
    shippingZone: { findMany: jest.fn() },
  };
  const service = new ShippingService(prisma as any);
  return { service, prisma };
}

describe("ShippingService — zone matching & free-shipping threshold", () => {
  it("prefers a state-specific zone over a whole-country fallback zone", async () => {
    const { service, prisma } = makeService();
    prisma.shippingZone.findMany.mockResolvedValue([
      {
        id: "zone-country",
        states: [],
        rates: [{ id: "rate-country", baseRate: 100, perKgRate: 0, freeShippingThreshold: null, codAvailable: true }],
      },
      {
        id: "zone-mh",
        states: ["Maharashtra"],
        rates: [{ id: "rate-mh", baseRate: 40, perKgRate: 0, freeShippingThreshold: null, codAvailable: true }],
      },
    ]);

    const quote = await service.calculate({ country: "IN", state: "Maharashtra", weightGrams: 500, subtotal: 1000 });

    expect(quote.zoneId).toBe("zone-mh");
    expect(quote.amount).toBe(40);
  });

  it("falls back to the whole-country zone when no state-specific zone matches", async () => {
    const { service, prisma } = makeService();
    prisma.shippingZone.findMany.mockResolvedValue([
      {
        id: "zone-country",
        states: [],
        rates: [{ id: "rate-country", baseRate: 100, perKgRate: 0, freeShippingThreshold: null, codAvailable: true }],
      },
      {
        id: "zone-mh",
        states: ["Maharashtra"],
        rates: [{ id: "rate-mh", baseRate: 40, perKgRate: 0, freeShippingThreshold: null, codAvailable: true }],
      },
    ]);

    const quote = await service.calculate({ country: "IN", state: "Karnataka", weightGrams: 500, subtotal: 1000 });

    expect(quote.zoneId).toBe("zone-country");
    expect(quote.amount).toBe(100);
  });

  it("charges by weight via perKgRate", async () => {
    const { service, prisma } = makeService();
    prisma.shippingZone.findMany.mockResolvedValue([
      {
        id: "zone-country",
        states: [],
        rates: [{ id: "rate-country", baseRate: 30, perKgRate: 20, freeShippingThreshold: null, codAvailable: true }],
      },
    ]);

    // 2.5kg * 20/kg + 30 base = 80
    const quote = await service.calculate({ country: "IN", state: "Karnataka", weightGrams: 2500, subtotal: 1000 });

    expect(quote.amount).toBe(80);
  });

  it("waives shipping once the subtotal meets the free-shipping threshold", async () => {
    const { service, prisma } = makeService();
    prisma.shippingZone.findMany.mockResolvedValue([
      {
        id: "zone-country",
        states: [],
        rates: [{ id: "rate-country", baseRate: 100, perKgRate: 0, freeShippingThreshold: 999, codAvailable: true }],
      },
    ]);

    const quote = await service.calculate({ country: "IN", state: "Karnataka", weightGrams: 500, subtotal: 1000 });

    expect(quote.amount).toBe(0);
  });

  it("throws when no zone matches the address", async () => {
    const { service, prisma } = makeService();
    prisma.shippingZone.findMany.mockResolvedValue([]);

    await expect(
      service.calculate({ country: "US", state: "CA", weightGrams: 500, subtotal: 1000 }),
    ).rejects.toThrow(BadRequestException);
  });
});
