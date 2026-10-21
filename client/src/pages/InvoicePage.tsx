import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getInvoice } from "../api/billing";
import { formatDate, formatMoney } from "../lib/format";

export function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoiceQuery = useQuery({ queryKey: ["invoice", id], queryFn: () => getInvoice(id!), enabled: !!id });

  if (invoiceQuery.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!invoiceQuery.data) return <p className="text-sm text-red-600">Invoice not found.</p>;

  const invoice = invoiceQuery.data;

  return (
    <div className="mx-auto max-w-lg space-y-4 print:max-w-none">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:underline print:hidden">
        ← Back
      </button>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Invoice</h1>
            <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
          </div>
          <p className="text-sm text-slate-500">{formatDate(invoice.issuedAt)}</p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Subtotal</dt>
            <dd className="text-slate-900">{formatMoney(invoice.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Tax</dt>
            <dd className="text-slate-900">{formatMoney(invoice.taxTotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
            <dt className="text-slate-900">Total</dt>
            <dd className="text-slate-900">{formatMoney(invoice.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Amount paid</dt>
            <dd className="text-slate-900">{formatMoney(invoice.amountPaid)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
            <dt className="text-slate-900">Balance due</dt>
            <dd className={Number(invoice.balanceDue) > 0 ? "text-red-600" : "text-green-600"}>
              {formatMoney(invoice.balanceDue)}
            </dd>
          </div>
        </dl>

        <button
          onClick={() => window.print()}
          className="mt-6 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 print:hidden"
        >
          Print
        </button>
      </div>
    </div>
  );
}
