import { nextResetAt } from "./day.js";

export const DEFAULT_LIMITS = Object.freeze({ global: 45, visit: 5, resetHour: 5 });
const RANGES = Object.freeze({ global: [1, 600], visit: [1, 120], resetHour: [0, 23] });

export function cleanLimits(value) {
  return Object.fromEntries(Object.entries(RANGES).map(([key, [min, max]]) => {
    const n = Number(value?.[key]);
    return [key, Number.isInteger(n) && n >= min && n <= max ? n : DEFAULT_LIMITS[key]];
  }));
}
export function normalizeLimitSettings(value) {
  const pending = value?.pending && Number.isFinite(value?.pendingFrom) ? cleanLimits(value.pending) : null;
  return {
    schemaVersion: 1,
    configured: value?.configured === true,
    lang: value?.lang === "he" ? "he" : "en",
    active: cleanLimits(value?.active),
    pending,
    pendingFrom: pending ? value.pendingFrom : null
  };
}
// Activate a pending change once its reset time has passed.
export function settle(settings, now) {
  if (!settings.pending || now < settings.pendingFrom) return settings;
  return { ...settings, active: settings.pending, pending: null, pendingFrom: null };
}
// First setup applies at once. Every later change waits for the next reset (D50).
export function requestChange(settings, values, now) {
  const next = cleanLimits(values);
  if (!settings.configured) return { ...settings, configured: true, active: next, pending: null, pendingFrom: null };
  return { ...settings, pending: next, pendingFrom: nextResetAt(now, settings.active.resetHour) };
}
