import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../setup.js";
import { app, createGuest, createRoom, createRoomType, createUser, loginAgent } from "../helpers.js";

describe("reservations", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setup() {
    const admin = await createUser({ email: "admin@test.local", role: "ADMIN" });
    const agent = await loginAgent(admin.email);
    const roomType = await createRoomType({ basePrice: 100 });
    const room = await createRoom(roomType.id);
    const guest = await createGuest();
    return { agent, room, guest };
  }

  it("creates a reservation and auto-creates an open folio with a room charge", async () => {
    const { agent, room, guest } = await setup();

    const res = await agent
      .post("/api/v1/reservations")
      .send({
        guestId: guest.id,
        roomId: room.id,
        checkInDate: "2027-01-10",
        checkOutDate: "2027-01-13",
        numGuests: 2,
      })
      .expect(201);

    expect(res.body.reservation.status).toBe("BOOKED");
    expect(res.body.reservation.folio.status).toBe("OPEN");
  });

  it("rejects an overlapping booking for the same room", async () => {
    const { agent, room, guest } = await setup();

    await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-02-01", checkOutDate: "2027-02-05" })
      .expect(201);

    await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-02-03", checkOutDate: "2027-02-06" })
      .expect(409);
  });

  it("allows adjacent (non-overlapping) bookings for the same room", async () => {
    const { agent, room, guest } = await setup();

    await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-03-01", checkOutDate: "2027-03-05" })
      .expect(201);

    await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-03-05", checkOutDate: "2027-03-08" })
      .expect(201);
  });

  it("frees the room when a reservation is cancelled", async () => {
    const { agent, room, guest } = await setup();

    const first = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-04-01", checkOutDate: "2027-04-05" })
      .expect(201);

    await agent.post(`/api/v1/reservations/${first.body.reservation.id}/cancel`).expect(200);

    await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-04-01", checkOutDate: "2027-04-05" })
      .expect(201);
  });

  it("rejects checking in a reservation twice", async () => {
    const { agent, room, guest } = await setup();

    const res = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-05-01", checkOutDate: "2027-05-03" })
      .expect(201);
    const id = res.body.reservation.id;

    await agent.post(`/api/v1/reservations/${id}/check-in`).expect(200);
    await agent.post(`/api/v1/reservations/${id}/check-in`).expect(409);
  });

  it("marks the room DIRTY on checkout", async () => {
    const { agent, room, guest } = await setup();

    const res = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-06-01", checkOutDate: "2027-06-03" })
      .expect(201);
    const id = res.body.reservation.id;

    await agent.post(`/api/v1/reservations/${id}/check-in`).expect(200);
    const out = await agent.post(`/api/v1/reservations/${id}/check-out`).expect(200);

    expect(out.body.reservation.room.housekeepingStatus).toBe("DIRTY");
  });

  it("creates a new guest from typed details when booking someone not yet registered", async () => {
    const { agent, room } = await setup();

    const res = await agent
      .post("/api/v1/reservations")
      .send({
        newGuest: { fullName: "Ngozi Eze", email: "ngozi@example.com", phone: "08012345678" },
        roomId: room.id,
        checkInDate: "2027-02-01",
        checkOutDate: "2027-02-03",
      })
      .expect(201);

    expect(res.body.reservation.guest).toMatchObject({
      fullName: "Ngozi Eze",
      email: "ngozi@example.com",
      phone: "08012345678",
    });
  });

  it("reuses an existing guest when the typed email already exists", async () => {
    const { agent, room } = await setup();
    const existing = await agent
      .post("/api/v1/guests")
      .send({ fullName: "Ada Obi", email: "ada@example.com" })
      .expect(201);
    const guest = existing.body.guest;

    const res = await agent
      .post("/api/v1/reservations")
      .send({
        newGuest: { fullName: "Someone Else", email: "ADA@example.com", phone: "0800" },
        roomId: room.id,
        checkInDate: "2027-02-01",
        checkOutDate: "2027-02-03",
      })
      .expect(201);

    expect(res.body.reservation.guest.id).toBe(guest.id);
  });

  it("does not create a guest when the booking fails", async () => {
    const { agent, room, guest } = await setup();
    const dates = { roomId: room.id, checkInDate: "2027-03-01", checkOutDate: "2027-03-04" };
    await agent.post("/api/v1/reservations").send({ guestId: guest.id, ...dates }).expect(201);

    await agent
      .post("/api/v1/reservations")
      .send({ newGuest: { fullName: "Late Comer", phone: "0801" }, ...dates })
      .expect(409);

    const guests = await agent.get("/api/v1/guests?search=Late").expect(200);
    expect(guests.body.guests).toHaveLength(0);
  });

  it("deletes a reservation along with its payments and invoice", async () => {
    const { agent, room, guest } = await setup();

    const res = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-07-01", checkOutDate: "2027-07-03" })
      .expect(201);
    const id = res.body.reservation.id;
    const folioId = res.body.reservation.folio.id;

    await agent
      .post(`/api/v1/billing/folios/${folioId}/payments`)
      .send({ amount: 200, method: "CASH" })
      .expect(201);
    await agent.post(`/api/v1/billing/folios/${folioId}/invoice`).expect(201);

    await agent.delete(`/api/v1/reservations/${id}`).expect(204);

    await agent.get(`/api/v1/reservations/${id}`).expect(404);
    const payments = await agent.get("/api/v1/billing/payments").expect(200);
    expect(payments.body.payments).toHaveLength(0);
  });

  it("only lets admins delete reservations", async () => {
    const { agent, room, guest } = await setup();
    const res = await agent
      .post("/api/v1/reservations")
      .send({ guestId: guest.id, roomId: room.id, checkInDate: "2027-08-01", checkOutDate: "2027-08-03" })
      .expect(201);

    const frontDesk = await createUser({ email: "desk@test.local", role: "FRONT_DESK" });
    const deskAgent = await loginAgent(frontDesk.email);
    await deskAgent.delete(`/api/v1/reservations/${res.body.reservation.id}`).expect(403);
  });

  it("requires either an existing guest or new guest details", async () => {
    const { agent, room } = await setup();
    await agent
      .post("/api/v1/reservations")
      .send({ roomId: room.id, checkInDate: "2027-02-01", checkOutDate: "2027-02-03" })
      .expect(400);
  });
});
