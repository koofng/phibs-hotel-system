import type { PaymentReceipt } from "../types";
import { formatDateTime, formatStayDate } from "./format";
import { HOTEL } from "./hotel";

// jsPDF's built-in fonts have no glyph for ₦, so the PDF spells out the ISO code.
function pdfMoney(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "-" : ""}NGN ${formatted}`;
}

export async function downloadReceiptPdf({ receiptNumber, payment, summary }: PaymentReceipt) {
  // Loaded on demand so jsPDF stays out of the main bundle.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const { reservation, lineItems } = payment.folio;
  const left = 56;
  const right = doc.internal.pageSize.getWidth() - 56;
  let y = 64;

  const row = (label: string, value: string, opts: { bold?: boolean } = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setTextColor(opts.bold ? 15 : 100, opts.bold ? 23 : 116, opts.bold ? 42 : 139);
    doc.text(label, left, y);
    doc.setTextColor(15, 23, 42);
    doc.text(value, right, y, { align: "right" });
    y += 18;
  };
  const rule = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y - 12, right, y - 12);
    y += 4;
  };

  const center = (left + right) / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(HOTEL.name, center, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  y += 16;
  doc.text(HOTEL.address, center, y, { align: "center" });
  y += 14;
  doc.text(HOTEL.email, center, y, { align: "center" });
  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, right, y);
  y += 32;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Payment receipt", left, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(formatDateTime(payment.paidAt), right, y, { align: "right" });
  y += 16;
  doc.text(receiptNumber, left, y);
  y += 36;

  doc.setFillColor(248, 250, 252);
  doc.rect(left, y - 20, right - left, 64, "F");
  doc.setFontSize(9);
  doc.text("AMOUNT PAID", (left + right) / 2, y - 2, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(pdfMoney(payment.amount), (left + right) / 2, y + 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`via ${payment.method}`, (left + right) / 2, y + 36, { align: "center" });
  y += 76;

  doc.setFontSize(10);
  row("Guest", reservation.guest.fullName);
  row("Room type", reservation.room?.roomType.name ?? "-");
  row("Room rate", `${pdfMoney(reservation.ratePerNight)} / night`);
  row("Stay",`${formatStayDate(reservation.checkInDate)} - ${formatStayDate(reservation.checkOutDate)}`);
  row("Received by", payment.receivedBy.fullName);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text("Charges", left, y);
  y += 20;
  doc.setFontSize(10);
  for (const li of lineItems) {
    const label = li.quantity > 1 ? `${li.description} x ${li.quantity}` : li.description;
    const amount = Number(li.amount) * li.quantity;
    row(label, pdfMoney(li.type === "DISCOUNT" ? -amount : amount));
  }
  if (lineItems.length === 0) row("No charges recorded.", "");
  y += 10;

  row("Subtotal", pdfMoney(summary.subtotal));
  row("Tax", pdfMoney(summary.taxTotal));
  rule();
  row("Total", pdfMoney(summary.total), { bold: true });
  row("Paid to date (incl. this payment)", pdfMoney(summary.paidToDate));
  rule();
  row("Balance remaining", pdfMoney(summary.balanceAfterPayment), { bold: true });

  // Signature section
  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, right, y);
  y += 28;
  const sigTop = y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("DIGITALLY SIGNED", left, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  for (const line of [
    `Signed by ${payment.receivedBy.fullName}`,
    `For ${HOTEL.name}`,
    formatDateTime(payment.paidAt),
  ]) {
    y += 13;
    doc.text(line, left, y);
  }

  const sigCenter = right - 90;
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(payment.receivedBy.fullName, sigCenter, sigTop + 16, { align: "center" });
  doc.setDrawColor(148, 163, 184);
  doc.line(sigCenter - 90, sigTop + 24, sigCenter + 90, sigTop + 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Authorised signature", sigCenter, sigTop + 37, { align: "center" });

  y += 32;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This receipt was generated electronically and is valid without a handwritten signature.",
    center,
    y,
    { align: "center" },
  );

  doc.save(`${receiptNumber}.pdf`);
}
