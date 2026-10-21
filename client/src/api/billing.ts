import { apiClient } from "./client";
import type { Folio, Invoice, LineItemType, PaymentMethod, PaymentReceipt, PaymentRecord } from "../types";

export async function getFolio(id: string): Promise<Folio> {
  const res = await apiClient.get(`/billing/folios/${id}`);
  return res.data.folio;
}

export async function addLineItem(
  folioId: string,
  input: { type: LineItemType; description: string; amount: number; quantity: number },
): Promise<Folio> {
  const res = await apiClient.post(`/billing/folios/${folioId}/line-items`, input);
  return res.data.folio;
}

export async function removeLineItem(folioId: string, itemId: string): Promise<Folio> {
  const res = await apiClient.delete(`/billing/folios/${folioId}/line-items/${itemId}`);
  return res.data.folio;
}

export async function addPayment(
  folioId: string,
  input: { amount: number; method: PaymentMethod },
): Promise<Folio> {
  const res = await apiClient.post(`/billing/folios/${folioId}/payments`, input);
  return res.data.folio;
}

export async function generateInvoice(folioId: string): Promise<Folio> {
  const res = await apiClient.post(`/billing/folios/${folioId}/invoice`);
  return res.data.folio;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const res = await apiClient.get(`/billing/invoices/${id}`);
  return res.data.invoice;
}

export async function listPayments(filters: {
  dateFrom?: string;
  dateTo?: string;
  method?: PaymentMethod;
  guestId?: string;
} = {}): Promise<PaymentRecord[]> {
  const res = await apiClient.get("/billing/payments", { params: filters });
  return res.data.payments;
}

export async function getPaymentReceipt(paymentId: string): Promise<PaymentReceipt> {
  const res = await apiClient.get(`/billing/payments/${paymentId}/receipt`);
  return res.data.receipt;
}
