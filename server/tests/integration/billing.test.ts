import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../setup.js";
import { app, createGuest, createRoom, createRoomType, createUser, loginAgent } from "../helpers.js";

describe("billing", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setupOpenFolio() {
    const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
    const agent = await loginAgent(admin.email);
    const roomType = await createRoomType({ basePrice: 100 });
    const room = await createRoom(roomType.id);
    const guest = await createGuest();

    const res = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-07-01", checkOutDate: "2027-07-03" })
      .expect(201);

    return { agent, folioId: res.body.reservation.folio.id as string };
  }

  it("computes correct totals and balance due with line items and a partial payment", async () => {
    const { agent, folioId } = await setupOpenFolio();

    // room charge already added: 100 x 2 nights = 200
    await agent
      .post(`/api/v1/billing/folios/${folioId}/line-items`)
      .send({ type: "SERVICE", description: "Room service", amount: 20, quantity: 1 })
      .expect(201);

    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 50, method: "CASH" })
      .expect(201);

    const invoiceRes = await agent.post(`/api/v1/billing/folios/${folioId}/invoice`).expect(201);
    const invoice = invoiceRes.body.folio.invoice;

    // subtotal = 200 + 20 = 220, tax 0%, total = 220, paid = 50, balance = 170
    expect(invoice.subtotal).toBe("220");
    expect(invoice.taxTotal).toBe("0");
    expect(invoice.total).toBe("220");
    expect(invoice.amountPaid).toBe("50");
    expect(invoice.balanceDue).toBe("170");
  });

  it("locks the folio from further edits once an invoice is generated", async () => {
    const { agent, folioId } = await setupOpenFolio();

    await agent.post(`/api/v1/billing/folios/${folioId}/invoice`).expect(201);

    await agent
      .post(`/api/v1/billing/folios/${folioId}/line-items`)
      .send({ type: "SERVICE", description: "Late charge", amount: 10, quantity: 1 })
      .expect(409);

    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 10, method: "CASH" })
      .expect(409);
  });

  it("lists all payments for admins with linked guest and line-item context", async () => {
    const { agent, folioId } = await setupOpenFolio();

    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 75, method: "CASH" })
      .expect(201);

    const res = await agent.get("/api/v1/billing/payments").expect(200);

    expect(res.body.payments.length).toBeGreaterThan(0);
    const payment = res.body.payments[0];
    expect(payment.amount).toBe("75");
    expect(payment.folio.reservation.guest.fullName).toBeDefined();
    expect(payment.folio.lineItems.length).toBeGreaterThan(0);
  });

  it("rejects non-admins from the payments report", async () => {
    const staff = await createUser({ email: "staff-billing@test.local", role: "FRONT_DESK" });
    const agent = await loginAgent(staff.email);
    await agent.get("/api/v1/billing/payments").expect(403);
  });

  it("returns a receipt for a payment with the balance as of that payment", async () => {
    const { agent, folioId } = await setupOpenFolio();

    // room charge 200, tax 0%, total 200
    const first = await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 100, method: "CASH" })
      .expect(201);
    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 50, method: "CARD" })
      .expect(201);

    const firstPaymentId = first.body.folio.payments[0].id as string;
    const res = await agent.get(`/api/v1/billing/payments/${firstPaymentId}/receipt`).expect(200);
    const { receipt } = res.body;

    expect(receipt.receiptNumber).toMatch(/^RCT-[0-9A-F]{8}$/);
    expect(receipt.payment.amount).toBe("100");
    expect(receipt.summary.total).toBe("200");
    expect(receipt.summary.paidToDate).toBe("100");
    expect(receipt.summary.balanceAfterPayment).toBe("100");
  });

  it("returns 404 for an unknown payment receipt", async () => {
    const { agent } = await setupOpenFolio();
    await agent.get("/api/v1/billing/payments/00000000-0000-0000-0000-000000000000/receipt").expect(404);
  });

  it("returns folio totals with the balance still due", async () => {
    const { agent, folioId } = await setupOpenFolio();

    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 80, method: "TRANSFER" })
      .expect(201);

    const res = await agent.get(`/api/v1/billing/folios/${folioId}`).expect(200);
    expect(res.body.folio.totals).toMatchObject({
      taxRate: 0,
      subtotal: "200",
      taxTotal: "0",
      total: "200",
      amountPaid: "80",
      balanceDue: "120",
    });
  });
});
