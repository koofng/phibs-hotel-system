export function formatMoney(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return n.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Check-in/check-out dates are calendar days stored as midnight UTC. Format them
// in UTC so they show the same day everywhere; local time would shift them by a
// day for anyone west of UTC.
export function formatStayDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

// The local calendar day as YYYY-MM-DD, for date inputs.
export function toDateInputValue(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
