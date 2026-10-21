const COLORS: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CHECKED_IN: "bg-green-100 text-green-700",
  CHECKED_OUT: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  CLEAN: "bg-green-100 text-green-700",
  DIRTY: "bg-amber-100 text-amber-700",
  INSPECTED: "bg-blue-100 text-blue-700",
  OUT_OF_SERVICE: "bg-red-100 text-red-700",
  OPEN: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
