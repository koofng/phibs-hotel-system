import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { addLineItem, addPayment, generateInvoice, getFolio } from "../api/billing";
import { getErrorMessage } from "../api/client";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  deleteReservation,
  getReservation,
} from "../api/reservations";
import { useAuth } from "../auth/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate, formatMoney, formatStayDate } from "../lib/format";

const lineItemSchema = z.object({
  type: z.enum(["ROOM_CHARGE", "SERVICE", "TAX", "DISCOUNT"]),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().default(1),
});
type LineItemForm = z.infer<typeof lineItemSchema>;

const paymentSchema = z.object({
  method: z.enum(["CASH", "CARD", "TRANSFER"]),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [error, setError] = useState<string | null>(null);

  const reservationQuery = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id!),
    enabled: !!id,
  });

  const folioId = reservationQuery.data?.folio?.id;
  const folioQuery = useQuery({
    queryKey: ["folio", folioId],
    queryFn: () => getFolio(folioId!),
    enabled: !!folioId,
  });

  const lineItemForm = useForm<LineItemForm>({
    resolver: zodResolver(lineItemSchema),
    defaultValues: { type: "SERVICE", quantity: 1 },
  });
  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "CASH" },
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    queryClient.invalidateQueries({ queryKey: ["folio", folioId] });
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["occupancy"] });
  }

  const checkInMutation = useMutation({
    mutationFn: () => checkInReservation(id!),
    onSuccess: invalidateAll,
    onError: (err) => setError(getErrorMessage(err)),
  });
  const checkOutMutation = useMutation({
    mutationFn: () => checkOutReservation(id!),
    onSuccess: invalidateAll,
    onError: (err) => setError(getErrorMessage(err)),
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelReservation(id!),
    onSuccess: invalidateAll,
    onError: (err) => setError(getErrorMessage(err)),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteReservation(id!),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["reservation", id] });
      queryClient.removeQueries({ queryKey: ["folio", folioId] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["occupancy"] });
      navigate("/reservations");
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function handleDelete() {
    const paymentCount = folioQuery.data?.payments.length ?? 0;
    const warning =
      paymentCount > 0
        ? `This will permanently delete the reservation and its ${paymentCount} payment${paymentCount === 1 ? "" : "s"}. This cannot be undone.`
        : "This will permanently delete the reservation. This cannot be undone.";
    if (window.confirm(warning)) deleteMutation.mutate();
  }

  const addLineItemMutation = useMutation({
    mutationFn: (values: LineItemForm) => addLineItem(folioId!, values),
    onSuccess: () => {
      invalidateAll();
      lineItemForm.reset({ type: "SERVICE", description: "", amount: undefined, quantity: 1 });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });
  const addPaymentMutation = useMutation({
    // The amount is always the folio's outstanding balance; staff only pick the method.
    mutationFn: (values: PaymentForm) =>
      addPayment(folioId!, { ...values, amount: Number(folioQuery.data!.totals.balanceDue) }),
    onSuccess: () => {
      invalidateAll();
      paymentForm.reset({ method: "CASH" });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });
  const invoiceMutation = useMutation({
    mutationFn: () => generateInvoice(folioId!),
    onSuccess: invalidateAll,
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (reservationQuery.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!reservationQuery.data) return <p className="text-sm text-red-600">Reservation not found.</p>;

  const reservation = reservationQuery.data;
  const folio = folioQuery.data;
  const balanceDue = folio ? Number(folio.totals.balanceDue) : 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/reservations")} className="text-sm text-slate-500 hover:underline">
        ← Back to reservations
      </button>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold break-words text-slate-900">{reservation.guest.fullName}</h1>
            <p className="text-sm text-slate-500">
              Room {reservation.room?.roomNumber ?? "Unassigned"} · {reservation.room?.roomType.name}
            </p>
            <p className="text-sm text-slate-500">
              {formatStayDate(reservation.checkInDate)} → {formatStayDate(reservation.checkOutDate)} · {reservation.numGuests} guest(s)
            </p>
            {reservation.source === "ONLINE" && (
              <p className="mt-1 text-xs text-slate-500">
                Online booking
                {reservation.preferredPaymentMethod && ` · prefers ${reservation.preferredPaymentMethod}`}
              </p>
            )}
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {reservation.status === "BOOKED" && (
            <>
              <button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Check in
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          {reservation.status === "CHECKED_IN" && (
            <button
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Check out
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 sm:ml-auto"
            >
              Delete reservation
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {folio && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Folio</h2>
            <StatusBadge status={folio.status} />
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1">Description</th>
                  <th className="py-1">Type</th>
                  <th className="py-1">Qty</th>
                  <th className="py-1">Amount</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {folio.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 pr-2">{item.description}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{item.type}</td>
                    <td className="py-1.5 pr-2">{item.quantity}</td>
                    <td className="py-1.5 whitespace-nowrap">{formatMoney(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="mb-4 space-y-1 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="text-right text-slate-900">{formatMoney(folio.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tax ({folio.totals.taxRate * 100}%)</dt>
              <dd className="text-right text-slate-900">{formatMoney(folio.totals.taxTotal)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-1 font-semibold">
              <dt className="text-slate-900">Total</dt>
              <dd className="text-right text-slate-900">{formatMoney(folio.totals.total)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Paid</dt>
              <dd className="text-right text-slate-900">{formatMoney(folio.totals.amountPaid)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt className="text-slate-900">Balance due</dt>
              <dd className={`text-right ${balanceDue > 0 ? "text-red-600" : "text-green-600"}`}>{formatMoney(balanceDue)}</dd>
            </div>
          </dl>

          {folio.status === "OPEN" && (
            <form
              onSubmit={lineItemForm.handleSubmit((v) => addLineItemMutation.mutate(v))}
              className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 sm:flex sm:flex-wrap sm:items-end"
            >
              <select {...lineItemForm.register("type")} className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1">
                <option value="SERVICE">Service</option>
                <option value="ROOM_CHARGE">Room charge</option>
                <option value="TAX">Tax</option>
                <option value="DISCOUNT">Discount</option>
              </select>
              <input
                placeholder="Description"
                {...lineItemForm.register("description")}
                className="col-span-2 min-w-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1"
              />
              <input
                placeholder="Amount"
                type="number"
                step="0.01"
                {...lineItemForm.register("amount")}
                className="min-w-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:w-24"
              />
              <input
                placeholder="Qty"
                type="number"
                {...lineItemForm.register("quantity")}
                className="min-w-0 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:w-16"
              />
              <button type="submit" className="col-span-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white sm:col-span-1 sm:py-1.5">
                Add charge
              </button>
            </form>
          )}

          <h3 className="mb-2 text-sm font-semibold text-slate-700">Payments</h3>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {folio.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{formatMoney(p.amount)}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{p.method}</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap text-slate-400">{formatDate(p.paidAt)}</td>
                    <td className="py-1.5 text-right">
                      <Link to={`/payments/${p.id}/receipt`} className="text-slate-700 hover:underline">
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
                {folio.payments.length === 0 && (
                  <tr>
                    <td className="py-1.5 text-slate-400">No payments recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {folio.status === "OPEN" && balanceDue > 0 && (
            <form
              onSubmit={paymentForm.handleSubmit((v) => addPaymentMutation.mutate(v))}
              className="mb-4 flex flex-wrap items-end gap-2 rounded-md bg-slate-50 p-3"
            >
              <div className="mr-2">
                <p className="text-xs text-slate-500">Amount</p>
                <p className="text-sm font-semibold text-slate-900">{formatMoney(balanceDue)}</p>
              </div>
              <select {...paymentForm.register("method")} className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:flex-none">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="TRANSFER">Transfer</option>
              </select>
              <button
                type="submit"
                disabled={addPaymentMutation.isPending}
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto sm:py-1.5"
              >
                Record payment
              </button>
            </form>
          )}

          {folio.status === "OPEN" ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => invoiceMutation.mutate()}
                disabled={invoiceMutation.isPending || balanceDue > 0}
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
              >
                Generate invoice
              </button>
              {balanceDue > 0 && (
                <p className="text-sm text-slate-500">Record the payment before generating the invoice.</p>
              )}
            </div>
          ) : folio.invoice ? (
            <Link to={`/invoices/${folio.invoice.id}`} className="text-sm font-medium text-slate-900 underline">
              View invoice {folio.invoice.invoiceNumber} →
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
