export type Role = "ADMIN" | "FRONT_DESK";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  maxOccupancy: number;
  amenities: string[];
  createdAt: string;
}

export type HousekeepingStatus = "CLEAN" | "DIRTY" | "INSPECTED" | "OUT_OF_SERVICE";

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType: RoomType;
  floor: number;
  housekeepingStatus: HousekeepingStatus;
  isActive: boolean;
  createdAt: string;
}

export interface Guest {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  idDocumentNumber: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

export type ReservationStatus = "BOOKED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
export type ReservationSource = "STAFF" | "ONLINE";

export interface Reservation {
  id: string;
  guestId: string;
  guest: Guest;
  roomId: string | null;
  room: Room | null;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  numGuests: number;
  ratePerNight: string;
  source: ReservationSource;
  preferredPaymentMethod: PaymentMethod | null;
  createdById: string | null;
  createdAt: string;
  folio: Folio | null;
}

export type LineItemType = "ROOM_CHARGE" | "SERVICE" | "TAX" | "DISCOUNT";

export interface FolioLineItem {
  id: string;
  folioId: string;
  type: LineItemType;
  description: string;
  amount: string;
  quantity: number;
  createdAt: string;
}

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";

export interface Payment {
  id: string;
  folioId: string;
  amount: string;
  method: PaymentMethod;
  paidAt: string;
  receivedById: string;
}

export interface Invoice {
  id: string;
  folioId: string;
  invoiceNumber: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  issuedAt: string;
  issuedById: string;
}

export interface Folio {
  id: string;
  reservationId: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  lineItems: FolioLineItem[];
  payments: Payment[];
  invoice: Invoice | null;
  reservation?: Reservation;
  totals: {
    taxRate: number;
    subtotal: string;
    taxTotal: string;
    total: string;
    amountPaid: string;
    balanceDue: string;
  };
}

export interface PaymentRecord {
  id: string;
  folioId: string;
  amount: string;
  method: PaymentMethod;
  paidAt: string;
  receivedById: string;
  receivedBy: { id: string; fullName: string };
  folio: {
    id: string;
    lineItems: FolioLineItem[];
    reservation: {
      id: string;
      guest: Guest;
      room: Room | null;
    };
  };
}

export interface PaymentReceipt {
  receiptNumber: string;
  payment: Payment & {
    receivedBy: { id: string; fullName: string };
    folio: {
      id: string;
      status: "OPEN" | "CLOSED";
      lineItems: FolioLineItem[];
      payments: Payment[];
      reservation: {
        id: string;
        checkInDate: string;
        checkOutDate: string;
        ratePerNight: string;
        guest: Guest;
        room: Room | null;
      };
    };
  };
  summary: {
    subtotal: string;
    taxTotal: string;
    total: string;
    paidToDate: string;
    balanceAfterPayment: string;
  };
}

export interface OccupancyRoom {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  housekeepingStatus: HousekeepingStatus;
  reservation: { id: string; status: ReservationStatus; guestName: string } | null;
}
