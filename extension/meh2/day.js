const HOUR_MS = 3600e3;
const pad = n => String(n).padStart(2, "0");

// The "day" starts at the reset hour, not at midnight.
export function dayKey(now, resetHour) {
  const d = new Date(now - resetHour * HOUR_MS);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function nextResetAt(now, resetHour) {
  const d = new Date(now);
  d.setHours(resetHour, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}
