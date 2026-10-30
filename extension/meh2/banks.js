// One daily total for every visit (D52). Work or pleasure changes only the entry form.
export const PURPOSES = Object.freeze(["work", "pleasure"]);

export const freshUsage = day => ({ day, global: 0, popups: 0 });
const count = n => Number.isFinite(n) && n > 0 ? n : 0;
export function usageFor(stored, day) {
  if (stored?.day !== day) return freshUsage(day);
  return { day, global: count(stored.global), popups: count(stored.popups) };
}
// Usage is kept in seconds.
export function charge(usage, purpose, seconds) {
  return { ...usage, global: usage.global + count(seconds) };
}
export const remainingSeconds = (usage, limits) => Math.max(0, limits.global * 60 - usage.global);
export function overrunReason(usage, limits, visit) {
  if (usage.global >= limits.global * 60) return "bank";
  if (visit.activeSeconds >= limits.visit * 60) return "visit";
  return null;
}
