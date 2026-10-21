import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { getErrorMessage } from "../api/client";
import { createPublicReservation, findPublicAvailableRooms } from "../api/public";
import { formatMoney, toDateInputValue } from "../lib/format";
import type { Room } from "../types";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const guestSchema = z.object({
  fullName: z.string().min(1, "Required"),
  email: z.string().email(),
  phone: z.string().optional(),
  numGuests: z.coerce.number().int().positive().default(1),
  preferredPaymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
});
type GuestForm = z.infer<typeof guestSchema>;

export function PublicBookingPage() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(toDateInputValue(new Date()));
  const [checkOut, setCheckOut] = useState(toDateInputValue(addDays(new Date(), 1)));
  const [searched, setSearched] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availabilityQuery = useQuery({
    queryKey: ["public-availability", checkIn, checkOut],
    queryFn: () => findPublicAvailableRooms(checkIn, checkOut),
    enabled: searched,
  });

  const form = useForm<GuestForm>({
    resolver: zodResolver(guestSchema),
    defaultValues: { numGuests: 1, preferredPaymentMethod: "CASH" },
  });

  const bookMutation = useMutation({
    mutationFn: (values: GuestForm) =>
      createPublicReservation({
        ...values,
        roomId: selectedRoom!.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      }),
    onSuccess: (reservation) => navigate(`/book/confirmation/${reservation.id}`),
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Book your stay</h1>
        <p className="text-sm text-slate-500">Pick your dates, choose a room, and confirm — no account needed.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Check-in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setSearched(false);
                setSelectedRoom(null);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Check-out</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setSearched(false);
                setSelectedRoom(null);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => setSearched(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Check availability
          </button>
        </div>

        {searched && availabilityQuery.isLoading && <p className="mt-4 text-sm text-slate-500">Searching…</p>}
        {searched && availabilityQuery.data && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {availabilityQuery.data.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`rounded-lg border p-3 text-left transition ${
                  selectedRoom?.id === room.id
                    ? "border-slate-900 ring-1 ring-slate-900"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <p className="font-medium text-slate-900">{room.roomType.name}</p>
                <p className="text-sm text-slate-500">
                  Room {room.roomNumber} · {formatMoney(room.roomType.basePrice)} / night
                </p>
              </button>
            ))}
            {availabilityQuery.data.length === 0 && (
              <p className="text-sm text-slate-400">No rooms available for these dates. Try different dates.</p>
            )}
          </div>
        )}
      </div>

      {selectedRoom && (
        <form
          onSubmit={form.handleSubmit((v) => {
            setError(null);
            bookMutation.mutate(v);
          })}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-sm font-medium text-slate-700">
            Your details — Room {selectedRoom.roomNumber} ({selectedRoom.roomType.name})
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Full name</label>
              <input {...form.register("fullName")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {form.formState.errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <input {...form.register("email")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Phone (optional)</label>
              <input {...form.register("phone")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600"># Guests</label>
              <input
                type="number"
                min={1}
                {...form.register("numGuests")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Preferred payment method</label>
              <select
                {...form.register("preferredPaymentMethod")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Bank transfer</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">You'll pay at the property — this just lets staff know what to expect.</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={bookMutation.isPending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {bookMutation.isPending ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      )}
    </div>
  );
}
