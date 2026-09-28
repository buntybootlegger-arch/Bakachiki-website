import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { PrismaTx } from "../prisma/prisma.types";
import { CreateShippingZoneDto } from "./dto/create-shipping-zone.dto";
import { UpdateShippingZoneDto } from "./dto/update-shipping-zone.dto";
import { CreateShippingRateDto } from "./dto/create-shipping-rate.dto";
import { UpdateShippingRateDto } from "./dto/update-shipping-rate.dto";

function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export interface ShippingQuote {
  zoneId: string;
  rateId: string;
  label: string;
  amount: number;
  codAvailable: boolean;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Picks the cheapest active rate for the most specific zone matching the
   * address (state-specific zone beats a whole-country fallback zone), then
   * applies the rate's free-shipping threshold against `subtotal`. */
  async calculate(
    params: { country: string; state: string; weightGrams: number; subtotal: number },
    tx: PrismaTx = this.prisma,
  ): Promise<ShippingQuote> {
    const country = params.country || "IN";

    const zones = await tx.shippingZone.findMany({
      where: { isActive: true, countries: { has: country } },
      include: { rates: { where: { isActive: true } } },
      orderBy: { createdAt: "asc" },
    });

    const stateMatch = zones.find((z) => z.states.length > 0 && z.states.includes(params.state));
    const countryFallback = zones.find((z) => z.states.length === 0);
    const zone = stateMatch ?? countryFallback;

    if (!zone || zone.rates.length === 0) {
      throw new BadRequestException("No shipping option is available for this address");
    }

    const weightKg = params.weightGrams / 1000;
    const priced = zone.rates.map((rate) => {
      const base = Number(rate.baseRate) + Number(rate.perKgRate) * weightKg;
      const threshold = toNumber(rate.freeShippingThreshold);
      const amount = threshold !== null && params.subtotal >= threshold ? 0 : Number(base.toFixed(2));
      return { rate, amount };
    });

    const cheapest = priced.reduce((best, curr) => (curr.amount < best.amount ? curr : best));

    return {
      zoneId: zone.id,
      rateId: cheapest.rate.id,
      label: cheapest.rate.label,
      amount: cheapest.amount,
      codAvailable: cheapest.rate.codAvailable,
    };
  }

  /** Non-authoritative estimate for the checkout UI before an order is
   * placed — re-derives weight/subtotal from current product prices, same
   * as `calculate()`'s callers, but is never itself the source of truth for
   * what gets charged (OrdersService recomputes this for real at
   * placeOrder time, inside its own transaction). */
  async quoteForCart(
    items: { productId: string; variantId: string | null; quantity: number }[],
    address: { country: string; state: string },
    tx: PrismaTx = this.prisma,
  ): Promise<ShippingQuote> {
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = productIds.length
      ? await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true, salePrice: true, weightGrams: true },
        })
      : [];
    const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId as string);
    const variants = variantIds.length
      ? await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, price: true, salePrice: true },
        })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    const variantById = new Map(variants.map((v) => [v.id, v]));

    let weightGrams = 0;
    let subtotal = 0;
    for (const item of items) {
      const product = productById.get(item.productId);
      if (!product) continue;
      const variant = item.variantId ? variantById.get(item.variantId) : undefined;
      const unitPrice = variant
        ? Number(variant.salePrice ?? variant.price)
        : Number(product.salePrice ?? product.price);
      subtotal += unitPrice * item.quantity;
      weightGrams += (product.weightGrams ?? 0) * item.quantity;
    }

    return this.calculate(
      { country: address.country || "IN", state: address.state, weightGrams, subtotal: Number(subtotal.toFixed(2)) },
      tx,
    );
  }

  async listZones() {
    return this.prisma.shippingZone.findMany({
      include: { rates: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async createZone(dto: CreateShippingZoneDto) {
    return this.prisma.shippingZone.create({
      data: { ...dto, countries: dto.countries ?? ["IN"], states: dto.states ?? [] },
    });
  }

  async updateZone(id: string, dto: UpdateShippingZoneDto) {
    await this.findZoneOrThrow(id);
    return this.prisma.shippingZone.update({ where: { id }, data: dto });
  }

  async removeZone(id: string) {
    await this.findZoneOrThrow(id);
    await this.prisma.shippingZone.delete({ where: { id } });
    return { success: true };
  }

  async createRate(dto: CreateShippingRateDto) {
    await this.findZoneOrThrow(dto.zoneId);
    return this.prisma.shippingRate.create({ data: dto });
  }

  async updateRate(id: string, dto: UpdateShippingRateDto) {
    await this.findRateOrThrow(id);
    return this.prisma.shippingRate.update({ where: { id }, data: dto });
  }

  async removeRate(id: string) {
    await this.findRateOrThrow(id);
    await this.prisma.shippingRate.delete({ where: { id } });
    return { success: true };
  }

  private async findZoneOrThrow(id: string) {
    const zone = await this.prisma.shippingZone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException("Shipping zone not found");
    return zone;
  }

  private async findRateOrThrow(id: string) {
    const rate = await this.prisma.shippingRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException("Shipping rate not found");
    return rate;
  }
}
