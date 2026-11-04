import { nextResetAt } from "./day.js";

// Meh 2 turned off per site until the next reset (D58). Gray stays on.
export function activePauses(value, now) {
  return Object.fromEntries(Object.entries(value || {}).filter(([, until]) => Number.isFinite(until) && until > now));
}
export function pause(paused, id, now, resetHour) {
  return { ...paused, [id]: nextResetAt(now, resetHour) };
}
export function resume(paused, id) {
  const { [id]: _, ...rest } = paused;
  return rest;
}
