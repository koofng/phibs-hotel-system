import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../setup.js";
import { app, createRoom, createRoomType } from "../helpers.js";
import request from "supertest";

describe("public booking", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setup() {
    const roomType = await createRoomType({ basePrice: 120 });
    const room = await createRoom(roomType.id);
    return { room };
  }

  it("creates a reservation with a new guest, marked as an ONLINE booking", async () => {
    const { room } = await setup();

    const res = await request(app)
      .post("/api/v1/public/reservations")
      .send({
        fullName: "Public Guest",
        email: "public.guest@example.com",
        phone: "555-0001",
        roomId: room.id,
        checkInDate: "2027-08-01",
        checkOutDate: "2027-08-03",
        numGuests: 1,
        preferredPaymentMethod: "CASH",
      })
      .expect(201);

    expect(res.body.reservation.source).toBe("ONLINE");
    expect(res.body.reservation.preferredPaymentMethod).toBe("CASH");
    expect(res.body.reservation.createdById).toBeNull();
    expect(res.body.reservation.guest.email).toBe("public.guest@example.com");
    expect(res.body.reservation.folio.status).toBe("OPEN");
  });

  it("reuses an existing guest profile when the email matches", async () => {
    const { room } = await setup();
    const room2 = (await createRoom((await createRoomType()).id));

    const first = await request(app)
      .post("/api/v1/public/reservations")
      .send({
        fullName: "Repeat Guest",
        email: "repeat@example.com",
        roomId: room.id,
        checkInDate: "2027-09-01",
        checkOutDate: "2027-09-02",
      })
      .expect(201);

    const second = await request(app)
      .post("/api/v1/public/reservations")
      .send({
        fullName: "Repeat Guest",
        email: "REPEAT@example.com",
        roomId: room2.id,
        checkInDate: "2027-09-10",
        checkOutDate: "2027-09-12",
      })
      .expect(201);

    expect(second.body.reservation.guestId).toBe(first.body.reservation.guestId);
  });

  it("rejects a public booking that overlaps an existing reservation", async () => {
    const { room } = await setup();

    await request(app)
      .post("/api/v1/public/reservations")
      .send({
        fullName: "First Guest",
        email: "first@example.com",
        roomId: room.id,
        checkInDate: "2027-10-01",
        checkOutDate: "2027-10-05",
      })
      .expect(201);

    await request(app)
      .post("/api/v1/public/reservations")
      .send({
        fullName: "Second Guest",
        email: "second@example.com",
        roomId: room.id,
        checkInDate: "2027-10-03",
        checkOutDate: "2027-10-06",
      })
      .expect(409);
  });

  it("lists available rooms and room types without authentication", async () => {
    await setup();
    await request(app).get("/api/v1/public/room-types").expect(200);
    await request(app)
      .get("/api/v1/public/rooms/availability?checkIn=2027-11-01&checkOut=2027-11-03")
      .expect(200);
  });
});
