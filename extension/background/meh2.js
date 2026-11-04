import { dayKey } from "../meh2/day.js";
import { DEFAULT_LIMITS, normalizeLimitSettings, settle, requestChange } from "../meh2/limits.js";
import { PURPOSES, usageFor, charge, remainingSeconds, overrunReason } from "../meh2/banks.js";
import { frictionLevel } from "../meh2/friction.js";
import { GRACE_MS, isPinned, gapAfter } from "../meh2/nudges.js";

import { activePauses, pause, resume } from "../meh2/paused.js";

const SETTINGS = "meh2Settings", USAGE = "meh2Usage", VISITS = "meh2Visits", PAUSED = "meh2Paused";
export const IDLE_MS = 120e3;
const MAX_TICK_MS = 10e3;

async function load(now) {
  const stored = await chrome.storage.local.get([SETTINGS, USAGE]);
  const settings = settle(normalizeLimitSettings(stored[SETTINGS]), now);
  const limits = settings.active;
  return { settings, limits, usage: usageFor(stored[USAGE], dayKey(now, limits.resetHour)) };
}
const visits = async () => (await chrome.storage.session.get(VISITS))[VISITS] || {};
const saveVisits = value => chrome.storage.session.set({ [VISITS]: value });

function status(usage, limits, visit, extra = {}) {
  const reason = overrunReason(usage, limits, visit);
  return {
    ok: true, mode: "visit", overrun: Boolean(reason), pinned: Boolean(reason) && isPinned(visit.shown || 0),
    popup: false, reason, purpose: visit.purpose,
    limitMin: reason === "visit" ? limits.visit : limits.global,
    visitMin: Math.floor(visit.activeSeconds / 60), shown: visit.shown || 0,
    popupInMs: reason && Number.isFinite(visit.popupIn) ? visit.popupIn : null,
    // Until the visit or the day runs out, so the page can check in exactly then.
    overrunInMs: reason ? null : Math.max(0, Math.min(limits.visit * 60 - visit.activeSeconds, limits.global * 60 - usage.global)) * 1000,
    // Negative once over: the timers count the overtime up.
    visitLeftSec: Math.round(limits.visit * 60 - visit.activeSeconds),
    todayLeftSec: Math.round(limits.global * 60 - usage.global), ...extra
  };
}

// Content-script messages. The caller has already checked the tab is eligible.
export async function handleTab(message, tabId, platformId, now = Date.now()) {
  const result = await tabResult(message, tabId, platformId, now);
  const { settings } = await load(now);
  return { ...result, lang: settings.lang };
}
async function tabResult(message, tabId, platformId, now) {
  if (message.type === "MEH2_CLOSE_TAB") {
    await forgetTab(tabId);
    await chrome.tabs.remove(tabId);
    return { ok: true, mode: "closed" };
  }
  const { limits, usage } = await load(now);
  const all = await visits();
  let visit = all[tabId];
  if (visit && (visit.platformId !== platformId || now - visit.lastSeen >= IDLE_MS)) visit = null;

  if (message.type === "MEH2_ENTER") {
    if (!visit) {
      delete all[tabId]; await saveVisits(all);
      return { ok: true, mode: "ask", level: frictionLevel(usage, limits, "pleasure"), limits };
    }
    // A reload or reopen in the same visit: 5 seconds of grace, then the popup.
    visit.lastSeen = now;
    if (overrunReason(usage, limits, visit)) { visit.popupIn = GRACE_MS; visit.wasOver = true; }
    all[tabId] = visit; await saveVisits(all);
    return status(usage, limits, visit);
  }
  if (message.type === "MEH2_START") {
    if (!PURPOSES.includes(message.purpose)) return { ok: false, error: "Unknown purpose." };
    visit = { platformId, purpose: message.purpose, activeSeconds: 0, lastSeen: now, popupIn: null, wasOver: false, shown: 0 };
    if (overrunReason(usage, limits, visit)) { visit.popupIn = GRACE_MS; visit.wasOver = true; }
    all[tabId] = visit; await saveVisits(all);
    // Minutes until the first reminder: the visit limit or what is left of today, whichever is sooner.
    const untilNudgeMin = Math.floor(Math.min(limits.visit * 60, remainingSeconds(usage, limits)) / 60);
    return status(usage, limits, visit, { untilNudgeMin });
  }
  if (message.type === "MEH2_END") {
    delete all[tabId]; await saveVisits(all);
    return { ok: true, mode: "ended" };
  }
  // A reminder was closed: the wait for the next one starts now.
  if (message.type === "MEH2_DISMISSED") {
    if (!visit || !visit.shown) return { ok: true, mode: "visit", popupInMs: null };
    visit.popupIn = gapAfter(visit.shown);
    visit.popupFrom = now;
    all[tabId] = visit; await saveVisits(all);
    return status(usage, limits, visit);
  }
  if (message.type !== "MEH2_TICK") return { ok: false, error: "Unknown message." };
  if (!visit) {
    delete all[tabId]; await saveVisits(all);
    return { ok: true, mode: "ask", level: frictionLevel(usage, limits, "pleasure"), limits };
  }
  // The first tick after the tab comes back to the front counts nothing: time away is not used.
  const elapsedMs = message.fresh === true ? 0 : Math.max(0, Math.min(now - visit.lastSeen, MAX_TICK_MS));
  const seconds = elapsedMs / 1000;
  let next = usage;
  if (message.active === true) {
    next = charge(usage, visit.purpose, seconds);
    visit.activeSeconds += seconds;
  }
  visit.lastSeen = now;
  const over = overrunReason(next, limits, visit);
  // The escalation restarts with every visit (see nudges.js for the rhythm). The wait is
  // kept as time left and only shrinks on ticks, which run while the tab is in front.
  // usage.popups only counts today's reminders.
  visit.shown ??= 0;
  if (!over) { visit.popupIn = null; visit.wasOver = false; }
  else if (!visit.wasOver) { visit.wasOver = true; visit.popupIn = 0; }
  // Self-repair: a reminder is awaited but the page shows none (it never got drawn).
  else if (visit.shown && visit.popupIn === null && message.popupOpen === false) { visit.popupIn = gapAfter(visit.shown); visit.popupFrom = now; }
  else if (Number.isFinite(visit.popupIn)) visit.popupIn = Math.max(0, visit.popupIn - Math.min(elapsedMs, now - (visit.popupFrom ?? 0)));
  let popup = false;
  if (over && Number.isFinite(visit.popupIn) && visit.popupIn <= 300) {
    popup = true;
    visit.shown += 1;
    next = { ...next, popups: next.popups + 1 };
    visit.popupIn = null; // the next wait starts when this one is closed
  }
  all[tabId] = visit;
  await Promise.all([saveVisits(all), chrome.storage.local.set({ [USAGE]: next })]);
  return status(next, limits, visit, { popup });
}

export async function forgetTab(tabId) {
  const all = await visits();
  if (!(tabId in all)) return;
  delete all[tabId]; await saveVisits(all);
}

function panelModel(settings, limits, usage) {
  return {
    ok: true, settings,
    remaining: { global: Math.floor(remainingSeconds(usage, limits) / 60) }
  };
}
export const pausedSites = async (now = Date.now()) => activePauses((await chrome.storage.local.get(PAUSED))[PAUSED], now);

// Side-panel messages.
export async function handlePanel(message, now = Date.now()) {
  const { settings, limits, usage } = await load(now);
  if (message.type === "MEH2_GET") return panelModel(settings, limits, usage);
  if (message.type === "MEH2_PAUSE" || message.type === "MEH2_RESUME") {
    const paused = await pausedSites(now);
    const next = message.type === "MEH2_PAUSE" ? pause(paused, message.id, now, limits.resetHour) : resume(paused, message.id);
    await chrome.storage.local.set({ [PAUSED]: next });
    return { ok: true };
  }
  // The panel's live timer: time left today, and in the visit on the panel's tab, if any.
  if (message.type === "MEH2_TIME") {
    const visit = (await visits())[message.tabId];
    const live = visit && now - visit.lastSeen < IDLE_MS;
    return {
      ok: true, todayLeftSec: Math.round(limits.global * 60 - usage.global),
      visitLeftSec: live ? Math.round(limits.visit * 60 - visit.activeSeconds) : null
    };
  }
  // Language is a display choice, not a limit, so it applies at once.
  if (message.type === "MEH2_SET_LANG") {
    const next = { ...settings, lang: message.lang === "he" ? "he" : "en" };
    await chrome.storage.local.set({ [SETTINGS]: next });
    return panelModel(next, limits, usage);
  }
  if (message.type === "MEH2_SET_LIMITS" || message.type === "MEH2_DEFAULTS") {
    const values = message.type === "MEH2_DEFAULTS" ? DEFAULT_LIMITS : message.values;
    const next = requestChange(settings, values, now);
    await chrome.storage.local.set({ [SETTINGS]: next });
    return panelModel(next, next.active, usage);
  }
  return { ok: false, error: "Unknown message." };
}
