import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getPublicReservation } from "../api/public";
import { formatMoney, formatStayDate } from "../lib/format";

export function PublicConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const reservationQuery = useQuery({
    queryKey: ["public-reservation", id],
    queryFn: () => getPublicReservation(id!),
    enabled: !!id,
  });

  if (reservationQuery.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!reservationQuery.data) return <p className="text-sm text-red-600">Booking not found.</p>;

  const reservation = reservationQuery.data;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-lg font-semibold text-green-800">Booking confirmed!</p>
        <p className="text-sm text-green-700">Save this page or your booking reference for check-in.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Booking reference</dt>
            <dd className="font-mono text-xs text-slate-900">{reservation.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Guest</dt>
            <dd className="text-slate-900">{reservation.guest.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Room</dt>
            <dd className="text-slate-900">
              {reservation.room?.roomNumber} · {reservation.room?.roomType.name}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Dates</dt>
            <dd className="text-slate-900">
              {formatStayDate(reservation.checkInDate)} → {formatStayDate(reservation.checkOutDate)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Rate</dt>
            <dd className="text-slate-900">{formatMoney(reservation.ratePerNight)} / night</dd>
          </div>
          {reservation.preferredPaymentMethod && (
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-500">Payment</dt>
              <dd className="text-slate-900">Pay at property — {reservation.preferredPaymentMethod}</dd>
            </div>
          )}
        </dl>
      </div>

      <Link to="/book" className="block text-center text-sm text-slate-500 hover:underline">
        ← Make another booking
      </Link>
    </div>
  );
}
