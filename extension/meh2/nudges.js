// Reminder rhythm while over the limit (D55): the first comes at overrun. Each later one
// waits for the previous one to be closed, then 45, 30, 15 and 10 seconds, then every 5,
// counting only while the tab is in front. From the fifth reminder the strip stays pinned.
export const GAPS_MS = Object.freeze([45e3, 30e3, 15e3, 10e3]);
export const LAST_GAP_MS = 5e3;
export const GRACE_MS = 5000;
export const isPinned = shown => shown > GAPS_MS.length;
// Wait after the reminder number `shown` is closed.
export const gapAfter = shown => GAPS_MS[shown - 1] ?? LAST_GAP_MS;
