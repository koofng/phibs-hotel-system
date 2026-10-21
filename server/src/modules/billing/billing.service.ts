import { Prisma, type LineItemType, type PaymentMethod } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/ApiError.js";

const TAX_RATE = 0;

const folioInclude = {
  lineItems: { orderBy: { createdAt: "asc" } },
  payments: { orderBy: { paidAt: "asc" } },
  invoice: true,
  reservation: { include: { guest: true, room: true } },
} as const;

export async function getFolio(id: string) {
  const folio = await prisma.folio.findUnique({ where: { id }, include: folioInclude });
  if (!folio) {
    throw ApiError.notFound("Folio not found");
  }
  const { subtotal, taxTotal, total } = computeTotals(folio.lineItems);
  const amountPaid = folio.payments.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
  return {
    ...folio,
    totals: { taxRate: TAX_RATE, subtotal, taxTotal, total, amountPaid, balanceDue: total.sub(amountPaid) },
  };
}

async function assertFolioOpen(id: string) {
  const folio = await prisma.folio.findUnique({ where: { id } });
  if (!folio) {
    throw ApiError.notFound("Folio not found");
  }
  if (folio.status !== "OPEN") {
    throw ApiError.conflict("Folio is closed and can no longer be modified");
  }
  return folio;
}

export async function addLineItem(
  folioId: string,
  input: { type: LineItemType; description: string; amount: number; quantity: number },
) {
  await assertFolioOpen(folioId);
  await prisma.folioLineItem.create({ data: { folioId, ...input } });
  return getFolio(folioId);
}

export async function removeLineItem(folioId: string, itemId: string) {
  await assertFolioOpen(folioId);
  const item = await prisma.folioLineItem.findUnique({ where: { id: itemId } });
  if (!item || item.folioId !== folioId) {
    throw ApiError.notFound("Line item not found");
  }
  await prisma.folioLineItem.delete({ where: { id: itemId } });
  return getFolio(folioId);
}

export async function addPayment(
  folioId: string,
  input: { amount: number; method: PaymentMethod; receivedById: string },
) {
  await assertFolioOpen(folioId);
  await prisma.payment.create({ data: { folioId, ...input } });
  return getFolio(folioId);
}

function computeTotals(lineItems: { type: LineItemType; amount: Prisma.Decimal; quantity: number }[]) {
  let subtotal = new Prisma.Decimal(0);
  for (const item of lineItems) {
    const lineTotal = item.amount.mul(item.quantity);
    subtotal = item.type === "DISCOUNT" ? subtotal.sub(lineTotal) : subtotal.add(lineTotal);
  }
  const taxTotal = subtotal.mul(TAX_RATE);
  const total = subtotal.add(taxTotal);
  return { subtotal, taxTotal, total };
}

export async function generateInvoice(folioId: string, issuedById: string) {
  const folio = await prisma.folio.findUnique({
    where: { id: folioId },
    include: { lineItems: true, payments: true, invoice: true },
  });
  if (!folio) {
    throw ApiError.notFound("Folio not found");
  }
  if (folio.status !== "OPEN") {
    throw ApiError.conflict("Folio is already closed");
  }

  const { subtotal, taxTotal, total } = computeTotals(folio.lineItems);
  const amountPaid = folio.payments.reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
  const balanceDue = total.sub(amountPaid);
  const invoiceNumber = `INV-${Date.now()}`;

  await prisma.$transaction([
    prisma.invoice.create({
      data: {
        folioId,
        invoiceNumber,
        subtotal,
        taxTotal,
        total,
        amountPaid,
        balanceDue,
        issuedById,
      },
    }),
    prisma.folio.update({ where: { id: folioId }, data: { status: "CLOSED" } }),
  ]);

  return getFolio(folioId);
}

export function listPayments(filters: {
  dateFrom?: Date;
  dateTo?: Date;
  method?: PaymentMethod;
  guestId?: string;
}) {
  return prisma.payment.findMany({
    where: {
      method: filters.method,
      paidAt: {
        gte: filters.dateFrom,
        lte: filters.dateTo,
      },
      folio: filters.guestId
        ? { reservation: { guestId: filters.guestId } }
        : undefined,
    },
    include: {
      receivedBy: { select: { id: true, fullName: true } },
      folio: {
        include: {
          lineItems: true,
          reservation: { include: { guest: true, room: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });
}

export async function getPaymentReceipt(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      receivedBy: { select: { id: true, fullName: true } },
      folio: {
        include: {
          lineItems: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { paidAt: "asc" } },
          reservation: { include: { guest: true, room: { include: { roomType: true } } } },
        },
      },
    },
  });
  if (!payment) {
    throw ApiError.notFound("Payment not found");
  }

  const { subtotal, taxTotal, total } = computeTotals(payment.folio.lineItems);
  // Only count payments made up to and including this one, so a receipt
  // always reflects the balance at the moment it was issued.
  const paidToDate = payment.folio.payments
    .filter((p) => p.paidAt <= payment.paidAt)
    .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));

  return {
    receiptNumber: `RCT-${payment.id.slice(0, 8).toUpperCase()}`,
    payment,
    summary: {
      subtotal,
      taxTotal,
      total,
      paidToDate,
      balanceAfterPayment: total.sub(paidToDate),
    },
  };
}

export async function getInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { folio: { include: folioInclude } },
  });
  if (!invoice) {
    throw ApiError.notFound("Invoice not found");
  }
  return invoice;
}
