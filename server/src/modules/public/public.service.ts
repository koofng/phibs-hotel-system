import type { PaymentMethod } from "@prisma/client";
import * as guestsService from "../guests/guests.service.js";
import * as reservationsService from "../reservations/reservations.service.js";
import * as roomsService from "../rooms/rooms.service.js";
import * as roomTypesService from "../room-types/room-types.service.js";

export function listRoomTypes() {
  return roomTypesService.listRoomTypes();
}

export function searchAvailability(checkIn: Date, checkOut: Date, roomTypeId?: string) {
  return roomsService.findAvailableRooms(checkIn, checkOut, roomTypeId);
}

export async function createPublicReservation(input: {
  fullName: string;
  email: string;
  phone?: string;
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numGuests: number;
  preferredPaymentMethod?: PaymentMethod;
}) {
  const guest = await guestsService.findOrCreateByEmail({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
  });

  return reservationsService.createReservation({
    guestId: guest.id,
    roomId: input.roomId,
    checkInDate: input.checkInDate,
    checkOutDate: input.checkOutDate,
    numGuests: input.numGuests,
    source: "ONLINE",
    preferredPaymentMethod: input.preferredPaymentMethod,
  });
}

export function getPublicReservation(id: string) {
  return reservationsService.getReservation(id);
}
