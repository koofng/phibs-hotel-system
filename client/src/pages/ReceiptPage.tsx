import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getPaymentReceipt } from "../api/billing";
import { formatDateTime, formatMoney, formatRoomChargeLabel, formatStayDate } from "../lib/format";
import { HOTEL } from "../lib/hotel";
import { downloadReceiptPdf } from "../lib/receiptPdf";

export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptQuery = useQuery({
    queryKey: ["receipt", id],
    queryFn: () => getPaymentReceipt(id!),
    enabled: !!id,
  });

  if (receiptQuery.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!receiptQuery.data) return <p className="text-sm text-red-600">Receipt not found.</p>;

  const { receiptNumber, payment, summary } = receiptQuery.data;
  const { reservation, lineItems } = payment.folio;
  const balance = Number(summary.balanceAfterPayment);

  return (
    <div className="mx-auto max-w-lg space-y-4 print:max-w-none">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:underline print:hidden">
        ← Back
      </button>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-6 border-b border-slate-200 pb-4 text-center">
          <p className="text-lg font-semibold text-slate-900">{HOTEL.name}</p>
          <p className="text-sm text-slate-500">{HOTEL.address}</p>
          <p className="text-sm text-slate-500">{HOTEL.email}</p>
        </div>

        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Payment receipt</h1>
            <p className="text-sm text-slate-500">{receiptNumber}</p>
          </div>
          <p className="text-sm text-slate-500 sm:text-right">{formatDateTime(payment.paidAt)}</p>
        </div>

        <div className="mb-6 rounded-md bg-slate-50 p-4 text-center">
          <p className="text-xs uppercase text-slate-500">Amount paid</p>
          <p className="text-2xl font-semibold text-slate-900">{formatMoney(payment.amount)}</p>
          <p className="text-sm text-slate-500">via {payment.method}</p>
        </div>

        <dl className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Guest</dt>
            <dd className="text-right text-slate-900">{reservation.guest.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Room type</dt>
            <dd className="text-right text-slate-900">{reservation.room?.roomType.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Room rate</dt>
            <dd className="text-right text-slate-900">{formatMoney(reservation.ratePerNight)} / night</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Stay</dt>
            <dd className="text-right text-slate-900">
              {formatStayDate(reservation.checkInDate)} – {formatStayDate(reservation.checkOutDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Received by</dt>
            <dd className="text-right text-slate-900">{payment.receivedBy.fullName}</dd>
          </div>
        </dl>

        <h2 className="mb-2 text-sm font-semibold text-slate-700">Charges</h2>
        <table className="mb-4 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {lineItems.map((li) => (
              <tr key={li.id}>
                <td className="py-1.5 text-slate-900">
                  {li.type === "ROOM_CHARGE" ? (
                    formatRoomChargeLabel(li.amount, li.quantity)
                  ) : (
                    <>
                      {li.description}
                      {li.quantity > 1 && <span className="text-slate-400"> × {li.quantity}</span>}
                    </>
                  )}
                </td>
                <td className="py-1.5 pl-4 text-right whitespace-nowrap text-slate-900">
                  {li.type === "DISCOUNT" ? "−" : ""}
                  {formatMoney(Number(li.amount) * li.quantity)}
                </td>
              </tr>
            ))}
            {lineItems.length === 0 && (
              <tr>
                <td className="py-1.5 text-slate-400">No charges recorded.</td>
              </tr>
            )}
          </tbody>
        </table>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="text-right text-slate-900">{formatMoney(summary.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Tax</dt>
            <dd className="text-right text-slate-900">{formatMoney(summary.taxTotal)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-semibold">
            <dt className="text-slate-900">Total</dt>
            <dd className="text-right text-slate-900">{formatMoney(summary.total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Paid to date (incl. this payment)</dt>
            <dd className="text-right text-slate-900">{formatMoney(summary.paidToDate)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-semibold">
            <dt className="text-slate-900">Balance remaining</dt>
            <dd className={`text-right ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatMoney(balance)}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col-reverse items-center gap-6 border-t sm:flex-row sm:items-end sm:justify-between sm:gap-4 border-slate-200 pt-6">
          <div className="text-center text-xs text-slate-500 sm:text-left">
            <p className="font-medium uppercase tracking-wide text-slate-700">Digitally signed</p>
            <p>Signed by {payment.receivedBy.fullName}</p>
            <p>For {HOTEL.name}</p>
            <p>{formatDateTime(payment.paidAt)}</p>
          </div>
          <div className="min-w-0 text-center">
            <p className="font-serif text-xl italic text-slate-900">{payment.receivedBy.fullName}</p>
            <div className="mt-1 w-48 max-w-full border-t border-slate-400" />
            <p className="mt-1 text-xs text-slate-500">Authorised signature</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          This receipt was generated electronically and is valid without a handwritten signature.
        </p>

        <div className="mt-6 flex gap-2 print:hidden">
          <button
            onClick={() => downloadReceiptPdf({ receiptNumber, payment, summary })}
            className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
