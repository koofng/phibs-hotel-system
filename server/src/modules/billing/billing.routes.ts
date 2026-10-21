import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as billingService from "./billing.service.js";

export const billingRouter = Router();

billingRouter.use(requireAuth);

const lineItemSchema = z.object({
  type: z.enum(["ROOM_CHARGE", "SERVICE", "TAX", "DISCOUNT"]),
  description: z.string().min(1),
  amount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
});

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "CARD", "TRANSFER"]),
});

const paymentMethods = ["CASH", "CARD", "TRANSFER"] as const;

billingRouter.get("/payments", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { dateFrom, dateTo, method, guestId } = req.query;
    res.json({
      payments: await billingService.listPayments({
        dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
        dateTo: dateTo ? new Date(String(dateTo)) : undefined,
        method: method as (typeof paymentMethods)[number] | undefined,
        guestId: guestId as string | undefined,
      }),
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/payments/:id/receipt", async (req, res, next) => {
  try {
    res.json({ receipt: await billingService.getPaymentReceipt(req.params.id) });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/folios/:id", async (req, res, next) => {
  try {
    res.json({ folio: await billingService.getFolio(req.params.id) });
  } catch (err) {
    next(err);
  }
});

billingRouter.post("/folios/:id/line-items", async (req, res, next) => {
  try {
    const input = lineItemSchema.parse(req.body);
    res.status(201).json({ folio: await billingService.addLineItem(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});

billingRouter.delete("/folios/:id/line-items/:itemId", async (req, res, next) => {
  try {
    res.json({ folio: await billingService.removeLineItem(req.params.id, req.params.itemId) });
  } catch (err) {
    next(err);
  }
});

billingRouter.post("/folios/:id/payments", async (req, res, next) => {
  try {
    const input = paymentSchema.parse(req.body);
    res.status(201).json({
      folio: await billingService.addPayment(req.params.id, { ...input, receivedById: req.user!.userId }),
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.post("/folios/:id/invoice", async (req, res, next) => {
  try {
    res.status(201).json({
      folio: await billingService.generateInvoice(req.params.id, req.user!.userId),
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/invoices/:id", async (req, res, next) => {
  try {
    res.json({ invoice: await billingService.getInvoice(req.params.id) });
  } catch (err) {
    next(err);
  }
});
