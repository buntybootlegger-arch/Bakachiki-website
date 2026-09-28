import { Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type { Response } from "express";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";

/** Matches the storefront's default brand palette (see prisma/seed.ts's
 * SiteSettings + apps/web/tailwind.config.ts) — kept fixed rather than
 * pulled from the live-editable SiteSettings so the invoice's identity
 * stays stable even if an admin retunes the storefront's accent colors. */
const BRAND = {
  ink: "#0E0E10",
  paper: "#F5F1E6",
  lime: "#C6FF3D",
  gray: "#6B6B70",
};

const LOGO_PATH = path.join(process.cwd(), "assets", "logo", "mark.png");

function money(value: number): string {
  return `Rs ${value.toFixed(2)}`;
}

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  /** Streams a GST invoice PDF directly to the response — regenerated on
   * every request from Order+OrderItem rather than persisted, so it's
   * always consistent with the order's current (immutable, snapshotted)
   * data and needs no storage/cleanup story. */
  async streamInvoice(orderId: string, res: Response) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException("Order not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.orderNumber}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const marginX = 50;
    const rightEdge = pageWidth - marginX;

    // ── Header band ──────────────────────────────────────────────
    const headerHeight = 110;
    doc.rect(0, 0, pageWidth, headerHeight).fill(BRAND.ink);
    doc.image(LOGO_PATH, marginX, 30, { width: 44, height: 44 });
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("BAKACHIKI", marginX + 56, 36);
    doc
      .fillColor(BRAND.lime)
      .font("Helvetica")
      .fontSize(8)
      .text("FUNKY FASHION — WEAR THE NOISE", marginX + 56, 58);

    doc
      .fillColor(BRAND.lime)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("TAX INVOICE", 0, 32, { align: "right", width: rightEdge });
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica")
      .fontSize(10)
      .text(`#${order.orderNumber}`, 0, 62, { align: "right", width: rightEdge });

    let y = headerHeight + 28;

    // ── Meta ─────────────────────────────────────────────────────
    doc.font("Helvetica").fontSize(9).fillColor(BRAND.gray);
    doc.text(`Invoice Date: ${order.placedAt.toISOString().slice(0, 10)}`, marginX, y);
    if (order.gstNumber) doc.text(`GSTIN: ${order.gstNumber}`, marginX, y + 13);
    y += order.gstNumber ? 34 : 22;

    // ── Bill To / Ship To ────────────────────────────────────────
    const colGap = 30;
    const colWidth = (rightEdge - marginX - colGap) / 2;
    const col2X = marginX + colWidth + colGap;
    const addrTop = y;

    const renderAddress = (x: number, heading: string, lines: string[]) => {
      let ay = addrTop;
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.ink).text(heading, x, ay, { characterSpacing: 0.5 });
      ay += 15;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND.ink).text(lines[0], x, ay, { width: colWidth });
      ay += 14;
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.gray);
      for (const line of lines.slice(1)) {
        doc.text(line, x, ay, { width: colWidth });
        ay += 13;
      }
      return ay;
    };

    const billLines = [
      order.billToName,
      order.billToLine1,
      ...(order.billToLine2 ? [order.billToLine2] : []),
      `${order.billToCity}, ${order.billToState} ${order.billToPostalCode}`,
      order.billToCountry,
      order.billToPhone,
      order.user.email,
    ];
    const shipLines = [
      order.shipToName,
      order.shipToLine1,
      ...(order.shipToLine2 ? [order.shipToLine2] : []),
      `${order.shipToCity}, ${order.shipToState} ${order.shipToPostalCode}`,
      order.shipToCountry,
      order.shipToPhone,
    ];

    const billEndY = renderAddress(marginX, "BILL TO", billLines);
    const shipEndY = renderAddress(col2X, "SHIP TO", shipLines);
    y = Math.max(billEndY, shipEndY) + 16;

    // ── Items table ──────────────────────────────────────────────
    const col = { item: marginX, qty: marginX + 260, price: marginX + 320, gst: marginX + 390 };
    const rowHeight = 22;

    doc.rect(marginX, y, rightEdge - marginX, 24).fill(BRAND.ink);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5);
    doc.text("ITEM", col.item + 8, y + 8);
    doc.text("QTY", col.qty, y + 8, { width: 40, align: "right" });
    doc.text("PRICE", col.price, y + 8, { width: 60, align: "right" });
    doc.text("GST", col.gst, y + 8, { width: 50, align: "right" });
    doc.text("AMOUNT", rightEdge - 70, y + 8, { width: 70, align: "right" });
    y += 24;

    doc.font("Helvetica").fontSize(9.5);
    order.items.forEach((item, idx) => {
      if (idx % 2 === 1) doc.rect(marginX, y, rightEdge - marginX, rowHeight).fill(BRAND.paper);
      doc.fillColor(BRAND.ink);
      const label = item.variantLabel ? `${item.productName} (${item.variantLabel})` : item.productName;
      doc.text(label, col.item + 8, y + 6, { width: 240 });
      doc.text(String(item.quantity), col.qty, y + 6, { width: 40, align: "right" });
      doc.text(money(Number(item.unitPrice)), col.price, y + 6, { width: 60, align: "right" });
      doc.text(money(Number(item.taxAmount)), col.gst, y + 6, { width: 50, align: "right" });
      doc.text(money(Number(item.lineTotal)), rightEdge - 70, y + 6, { width: 70, align: "right" });
      y += rowHeight;
    });

    doc.moveTo(marginX, y).lineTo(rightEdge, y).lineWidth(1).strokeColor(BRAND.ink).stroke();
    y += 14;

    // ── Summary ──────────────────────────────────────────────────
    const summaryLabelX = rightEdge - 200;
    const summaryValueX = rightEdge - 90;
    const summaryLine = (label: string, value: number, negative = false) => {
      doc.font("Helvetica").fontSize(9.5).fillColor(BRAND.ink);
      doc.text(label, summaryLabelX, y, { width: 100 });
      doc.text(`${negative ? "-" : ""}${money(Math.abs(value))}`, summaryValueX, y, { width: 90, align: "right" });
      y += 16;
    };
    summaryLine("Subtotal", Number(order.subtotal));
    if (Number(order.discountAmount) > 0) summaryLine("Discount", Number(order.discountAmount), true);
    summaryLine("Shipping", Number(order.shippingAmount));
    summaryLine("Tax (GST)", Number(order.taxAmount));

    y += 6;
    doc.rect(summaryLabelX - 10, y, rightEdge - summaryLabelX + 10, 30).fill(BRAND.lime);
    doc.fillColor(BRAND.ink).font("Helvetica-Bold").fontSize(12);
    doc.text("TOTAL", summaryLabelX, y + 9, { width: 100 });
    doc.text(money(Number(order.totalAmount)), summaryValueX, y + 9, { width: 90, align: "right" });

    // ── Footer ───────────────────────────────────────────────────
    const footerY = doc.page.height - 70;
    doc.rect(0, footerY, pageWidth, 3).fill(BRAND.lime);
    doc
      .fillColor(BRAND.gray)
      .font("Helvetica")
      .fontSize(8)
      .text("Thank you for shopping with Bakachiki — bold, funky, streetwear-inspired fashion.", marginX, footerY + 14, {
        width: rightEdge - marginX,
        align: "center",
      });
    doc.text(`This is a system-generated invoice for order ${order.orderNumber}.`, marginX, footerY + 28, {
      width: rightEdge - marginX,
      align: "center",
    });

    doc.end();
  }
}
