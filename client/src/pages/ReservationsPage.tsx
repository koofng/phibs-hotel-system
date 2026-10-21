import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../api/client";
import { listGuests } from "../api/guests";
import { createReservation } from "../api/reservations";
import { findAvailableRooms } from "../api/rooms";
import { StatusBadge } from "../components/StatusBadge";
import { formatMoney, formatStayDate, toDateInputValue } from "../lib/format";
import { listReservations } from "../api/reservations";
import type { Room } from "../types";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function ReservationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState(toDateInputValue(new Date()));
  const [checkOut, setCheckOut] = useState(toDateInputValue(addDays(new Date(), 1)));
  const [searched, setSearched] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestId, setGuestId] = useState("");
  const [guestMode, setGuestMode] = useState<"existing" | "new">("existing");
  const [newGuest, setNewGuest] = useState({ fullName: "", email: "", phone: "" });
  const [numGuests, setNumGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const reservationsQuery = useQuery({ queryKey: ["reservations"], queryFn: () => listReservations() });

  const availabilityQuery = useQuery({
    queryKey: ["availability", checkIn, checkOut],
    queryFn: () => findAvailableRooms(checkIn, checkOut),
    enabled: searched,
  });

  const guestsQuery = useQuery({
    queryKey: ["guests", guestSearch],
    queryFn: () => listGuests(guestSearch || undefined),
    enabled: !!selectedRoom,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createReservation({
        ...(guestMode === "existing"
          ? { guestId }
          : {
              newGuest: {
                fullName: newGuest.fullName.trim(),
                email: newGuest.email.trim() || undefined,
                phone: newGuest.phone.trim(),
              },
            }),
        roomId: selectedRoom!.id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numGuests,
      }),
    onSuccess: (reservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      navigate(`/reservations/${reservation.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const guestReady =
    guestMode === "existing" ? !!guestId : !!newGuest.fullName.trim() && !!newGuest.phone.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reservations</h1>
        <p className="text-sm text-slate-500">Search availability to book a new stay, or browse existing reservations.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-900">New reservation</h2>
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
            Search availability
          </button>
        </div>

        {searched && availabilityQuery.isLoading && <p className="mt-4 text-sm text-slate-500">Searching…</p>}
        {searched && availabilityQuery.data && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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
                <p className="font-medium text-slate-900">
                  Room {room.roomNumber} · {room.roomType.name}
                </p>
                <p className="text-sm text-slate-500">{formatMoney(room.roomType.basePrice)} / night</p>
              </button>
            ))}
            {availabilityQuery.data.length === 0 && (
              <p className="text-sm text-slate-400">No rooms available for these dates.</p>
            )}
          </div>
        )}

        {selectedRoom && (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">
              Booking Room {selectedRoom.roomNumber} ({selectedRoom.roomType.name})
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="mb-2 flex items-center gap-1 text-xs">
                  {(["existing", "new"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGuestMode(mode)}
                      className={`rounded-md px-2.5 py-1 font-medium ${
                        guestMode === mode ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {mode === "existing" ? "Existing guest" : "New guest"}
                    </button>
                  ))}
                </div>

                {guestMode === "existing" ? (
                  <>
                    <input
                      placeholder="Search guests…"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      className="mb-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <select
                      value={guestId}
                      onChange={(e) => setGuestId(e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select a guest</option>
                      {guestsQuery.data?.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.fullName} {g.email ? `(${g.email})` : ""}
                        </option>
                      ))}
                    </select>
                    {guestSearch && guestsQuery.data?.length === 0 && (
                      <p className="mt-1 text-xs text-slate-500">
                        No guest found.{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setNewGuest((g) => ({ ...g, fullName: guestSearch }));
                            setGuestMode("new");
                          }}
                          className="font-medium text-slate-900 underline"
                        >
                          Add “{guestSearch}” as a new guest
                        </button>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <input
                      placeholder="Full name *"
                      value={newGuest.fullName}
                      onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Email"
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      placeholder="Phone number *"
                      type="tel"
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600"># Guests</label>
                <input
                  type="number"
                  min={1}
                  value={numGuests}
                  onChange={(e) => setNumGuests(Number(e.target.value))}
                  className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                disabled={!guestReady || createMutation.isPending}
                onClick={() => {
                  setError(null);
                  createMutation.mutate();
                }}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createMutation.isPending ? "Booking…" : "Confirm booking"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">All reservations</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Guest</th>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Dates</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservationsQuery.data?.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/reservations/${r.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900">{r.guest.fullName}</td>
                  <td className="px-4 py-2">{r.room?.roomNumber ?? "Unassigned"}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatStayDate(r.checkInDate)} → {formatStayDate(r.checkOutDate)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
