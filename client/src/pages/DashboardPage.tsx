import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getArrivalsDepartures, getOccupancy } from "../api/dashboard";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate } from "../lib/format";

export function DashboardPage() {
  const occupancyQuery = useQuery({ queryKey: ["occupancy"], queryFn: () => getOccupancy() });
  const arrivalsQuery = useQuery({ queryKey: ["arrivals-departures"], queryFn: () => getArrivalsDepartures() });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Today's occupancy and activity.</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Today's arrivals & departures</h2>
        {arrivalsQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {arrivalsQuery.data && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Arrivals ({arrivalsQuery.data.arrivals.length})
              </h3>
              {arrivalsQuery.data.arrivals.length === 0 && (
                <p className="text-sm text-slate-400">No arrivals today.</p>
              )}
              <ul className="space-y-2">
                {arrivalsQuery.data.arrivals.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <Link to={`/reservations/${r.id}`} className="text-slate-700 hover:underline">
                      {r.guest.fullName} — Room {r.room?.roomNumber ?? "—"}
                    </Link>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Departures ({arrivalsQuery.data.departures.length})
              </h3>
              {arrivalsQuery.data.departures.length === 0 && (
                <p className="text-sm text-slate-400">No departures today.</p>
              )}
              <ul className="space-y-2">
                {arrivalsQuery.data.departures.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <Link to={`/reservations/${r.id}`} className="text-slate-700 hover:underline">
                      {r.guest.fullName} — Room {r.room?.roomNumber ?? "—"}
                    </Link>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Room occupancy — {formatDate(new Date())}</h2>
        {occupancyQuery.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
        {occupancyQuery.data && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {occupancyQuery.data.map((room) => (
              <div key={room.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{room.roomNumber}</span>
                  <StatusBadge status={room.housekeepingStatus} />
                </div>
                <p className="text-xs text-slate-500">{room.roomType}</p>
                {room.reservation ? (
                  <div className="mt-2 text-xs">
                    <p className="truncate text-slate-700">{room.reservation.guestName}</p>
                    <StatusBadge status={room.reservation.status} />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Vacant</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
