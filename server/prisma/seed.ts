import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hotel.local" },
    update: {},
    create: {
      email: "admin@hotel.local",
      passwordHash: adminPasswordHash,
      fullName: "Ada Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "frontdesk@hotel.local" },
    update: {},
    create: {
      email: "frontdesk@hotel.local",
      passwordHash: staffPasswordHash,
      fullName: "Fred Frontdesk",
      role: "FRONT_DESK",
    },
  });

  const amenities = ["wifi", "tv", "minibar", "balcony", "pool", "Driver"];
  const roomTypeDefs = [
    { name: "Phibs Cozy Single", basePrice: "65000.00", maxOccupancy: 2, amenities },
    { name: "Phibs Prestige Suite", basePrice: "75000.00", maxOccupancy: 2, amenities },
    { name: "Phibs Diamond Suite", basePrice: "85000.00", maxOccupancy: 2, amenities },
    { name: "Phibs Platinum Suite", basePrice: "100000.00", maxOccupancy: 2, amenities },
  ];

  const roomTypes = [];
  for (const def of roomTypeDefs) {
    const existing = await prisma.roomType.findFirst({ where: { name: def.name } });
    roomTypes.push(existing ?? (await prisma.roomType.create({ data: def })));
  }

  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    let roomNumber = 101;
    for (let floor = 1; floor <= 3; floor++) {
      for (let i = 0; i < 5; i++) {
        const roomType = roomTypes[(floor + i) % roomTypes.length];
        await prisma.room.create({
          data: {
            roomNumber: String(roomNumber),
            roomTypeId: roomType.id,
            floor,
            housekeepingStatus: "CLEAN",
          },
        });
        roomNumber++;
      }
      roomNumber = floor === 1 ? 201 : 301;
    }
  }

  const guestDefs = [
    { fullName: "Grace Guestman", email: "grace@example.com", phone: "555-0101" },
    { fullName: "Hank Holliday", email: "hank@example.com", phone: "555-0102" },
    { fullName: "Ivy Inn", email: "ivy@example.com", phone: "555-0103" },
  ];

  const guests = [];
  for (const def of guestDefs) {
    const existing = await prisma.guest.findFirst({ where: { email: def.email } });
    guests.push(existing ?? (await prisma.guest.create({ data: def })));
  }

  const reservationCount = await prisma.reservation.count();
  if (reservationCount === 0) {
    const rooms = await prisma.room.findMany({ include: { roomType: true }, take: 2 });
    const now = new Date();

    if (rooms[0]) {
      const checkIn = new Date(now);
      checkIn.setDate(checkIn.getDate() - 1);
      const checkOut = new Date(now);
      checkOut.setDate(checkOut.getDate() + 2);

      await prisma.reservation.create({
        data: {
          guestId: guests[0].id,
          roomId: rooms[0].id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          status: "CHECKED_IN",
          ratePerNight: rooms[0].roomType.basePrice,
          createdById: admin.id,
          folio: { create: { status: "OPEN" } },
        },
      });
    }

    if (rooms[1]) {
      const checkIn = new Date(now);
      checkIn.setDate(checkIn.getDate() + 3);
      const checkOut = new Date(now);
      checkOut.setDate(checkOut.getDate() + 5);

      await prisma.reservation.create({
        data: {
          guestId: guests[1].id,
          roomId: rooms[1].id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          status: "BOOKED",
          ratePerNight: rooms[1].roomType.basePrice,
          createdById: admin.id,
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log("  Admin login:      admin@hotel.local / admin123");
  console.log("  Front desk login: frontdesk@hotel.local / staff123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
