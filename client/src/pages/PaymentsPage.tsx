import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { listPayments } from "../api/billing";
import { formatDate, formatMoney } from "../lib/format";
import type { PaymentMethod } from "../types";

const methods: PaymentMethod[] = ["CASH", "CARD", "TRANSFER"];

export function PaymentsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [method, setMethod] = useState<PaymentMethod | "">("");

  const paymentsQuery = useQuery({
    queryKey: ["payments", dateFrom, dateTo, method],
    queryFn: () =>
      listPayments({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        method: method || undefined,
      }),
  });

  const total = paymentsQuery.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">All payments recorded across every booking, with the charges they cover.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-auto"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-auto"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod | "")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">All methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 border-t border-slate-200 pt-3 sm:ml-auto sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-xs text-slate-500">Total ({paymentsQuery.data?.length ?? 0} payments)</p>
          <p className="text-lg font-semibold text-slate-900">{formatMoney(total)}</p>
        </div>
      </div>

      <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white lg:hidden">
        {paymentsQuery.data?.map((p) => (
          <li key={p.id} className="space-y-1 px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.folio.reservation.guest.fullName}</p>
                <p className="text-slate-500">
                  Room {p.folio.reservation.room?.roomNumber ?? "—"} · {formatDate(p.paidAt)}
                </p>
              </div>
              <p className="shrink-0 font-medium text-slate-900">{formatMoney(p.amount)}</p>
            </div>
            <p className="text-slate-500">{p.folio.lineItems.map((li) => li.description).join(", ") || "—"}</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {p.method} · received by {p.receivedBy.fullName}
              </p>
              <Link to={`/payments/${p.id}/receipt`} className="shrink-0 font-medium text-slate-700 hover:underline">
                Receipt
              </Link>
            </div>
          </li>
        ))}
        {paymentsQuery.data?.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-400">No payments found for this filter.</li>
        )}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white lg:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Guest</th>
              <th className="px-4 py-2">Room</th>
              <th className="px-4 py-2">Services / charges</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Received by</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paymentsQuery.data?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-slate-500">{formatDate(p.paidAt)}</td>
                <td className="px-4 py-2 font-medium text-slate-900">{p.folio.reservation.guest.fullName}</td>
                <td className="px-4 py-2">{p.folio.reservation.room?.roomNumber ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">
                  {p.folio.lineItems.map((li) => li.description).join(", ") || "—"}
                </td>
                <td className="px-4 py-2">{p.method}</td>
                <td className="px-4 py-2 text-slate-500">{p.receivedBy.fullName}</td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">{formatMoney(p.amount)}</td>
                <td className="px-4 py-2 text-right">
                  <Link to={`/payments/${p.id}/receipt`} className="text-sm font-medium text-slate-700 hover:underline">
                    Receipt
                  </Link>
                </td>
              </tr>
            ))}
            {paymentsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No payments found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
