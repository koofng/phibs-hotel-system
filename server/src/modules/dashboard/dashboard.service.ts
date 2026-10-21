import { prisma } from "../../lib/prisma.js";

export async function getOccupancy(date: Date) {
  const rooms = await prisma.room.findMany({
    include: {
      roomType: true,
      reservations: {
        where: {
          status: { in: ["BOOKED", "CHECKED_IN"] },
          checkInDate: { lte: date },
          checkOutDate: { gt: date },
        },
        include: { guest: true },
        take: 1,
      },
    },
    orderBy: { roomNumber: "asc" },
  });

  return rooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    floor: room.floor,
    roomType: room.roomType.name,
    housekeepingStatus: room.housekeepingStatus,
    reservation: room.reservations[0]
      ? {
          id: room.reservations[0].id,
          status: room.reservations[0].status,
          guestName: room.reservations[0].guest.fullName,
        }
      : null,
  }));
}

export async function getArrivalsAndDepartures(date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [arrivals, departures] = await Promise.all([
    prisma.reservation.findMany({
      where: { checkInDate: { gte: dayStart, lt: dayEnd }, status: "BOOKED" },
      include: { guest: true, room: true },
    }),
    prisma.reservation.findMany({
      where: { checkOutDate: { gte: dayStart, lt: dayEnd }, status: "CHECKED_IN" },
      include: { guest: true, room: true },
    }),
  ]);

  return { arrivals, departures };
}
