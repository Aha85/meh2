(() => {
  // After the extension reloads or updates, an open tab can still run the old copy of this
  // script, cut off from the extension. The newest copy takes over and shuts the old one down.
  globalThis.__meh2Controller?.teardown?.();
  let dead = false;
  globalThis.__meh2Controller = { teardown: () => { dead = true; stop(); host?.remove(); } };
  const TICK_MS = 5000, IDLE_MS = 120e3, WAIT_MS = 60e3, BANNER_SNOOZE_MS = 60e3;
  // English by default; Hebrew when chosen in the side panel.
  const STRINGS = {
    en: {
      dir: "ltr", purposes: [["work", "Work"], ["pleasure", "Pleasure"]],
      plan: l => `Your plan: ${l.global} min a day in total. Visits up to ${l.visit} min.`,
      title: "What are you here for?", sentence: "In one sentence, what are you doing here?",
      extra: ["What will you do right after this?", "How many minutes should it take?", "What happens if you skip it now?"],
      enter: "Go in", closeTab: "Close this tab", note: "What you write is erased when you go in. Nothing is saved or sent.",
      errPurpose: "Pick what you're here for.", errEmpty: "Write a short answer in each box.",
      waitTitle: "Take a breath", waitText: "A one-minute wait before you go in. It only moves while this tab is open in front of you.",
      started: n => n === 1 ? "OK, you have 1 minute until I start bugging you." : `OK, you have ${n} minutes until I start bugging you.`, close: "Close",
      timerLabel: "Time left. Drag it, or focus it and use the arrow keys to move it.", timerVisit: "This visit", timerShrink: "Shrink timer", timerGrow: "Show full timer",
      today: "Today",
      notYet: "Not yet", banner: "The time you set is over.", hide: "Hide for a minute",
      visit: "The time you set for this visit is over.",
      global: "The time you set for today is over.",
      nudges: [
        "Isn't all this time here a shame?",
        "You could have been making money instead of just scrolling.",
        "Come on, still haven't found it? Close this, rethink, then come back.",
        "What are we actually looking for here?",
        "One more post won't change your day.",
        "Who is this scrolling for?",
        "Still here.",
        "What would you be doing right now if this tab were closed?"
      ]
    },
    he: {
      dir: "rtl", purposes: [["work", "עבודה"], ["pleasure", "בילוי"]],
      plan: l => `התוכנית שלך: ${l.global} דקות ביום בסך הכל. ביקור עד ${l.visit} דקות.`,
      title: "לשם מה הכניסה?", sentence: "במשפט אחד, מה עושים כאן?",
      extra: ["מה הדבר הבא אחרי זה?", "כמה דקות זה אמור לקחת?", "מה יקרה אם לא נכנסים עכשיו?"],
      enter: "כניסה", closeTab: "לסגור את הטאב", note: "הטקסט נמחק בכניסה. שום דבר לא נשמר או נשלח.",
      errPurpose: "צריך לבחור סיבה.", errEmpty: "צריך לכתוב תשובה קצרה בכל שדה.",
      waitTitle: "רגע, נושמים", waitText: "דקה של המתנה לפני הכניסה. היא מתקדמת רק כשהטאב הזה פתוח.",
      started: n => n === 1 ? "אוקיי, יש דקה אחת עד שאתחיל להציק." : `אוקיי, יש ${n} דקות עד שאתחיל להציק.`, close: "סגירה",
      timerLabel: "זמן שנשאר. אפשר לגרור, או להתמקד ולהזיז עם החצים.", timerVisit: "הביקור הזה", timerShrink: "הקטנת הטיימר", timerGrow: "הצגת הטיימר המלא",
      today: "היום",
      notYet: "עוד רגע", banner: "הזמן שנקבע עבר.", hide: "להסתיר לדקה",
      visit: "הזמן שנקבע לביקור נגמר.",
      global: "הזמן שנקבע להיום נגמר.",
      nudges: [
        "לא חבל על כל הזמן הזה פה?",
        "אפשר היה בינתיים לעשות כסף במקום לגלול סתם.",
        "נו, באמת לא נמצא מה שחיפשתם? לסגור, לחשוב מחדש ואז לחזור.",
        "מה בעצם אנחנו מחפשים כאן?",
        "עוד פוסט אחד לא ישנה את היום.",
        "בשביל מי הגלילה הזאת?",
        "עדיין פה.",
        "מה היית עושה עכשיו אם הטאב הזה היה סגור?"
      ]
    }
  };
  let lang = "en";
  const T = () => STRINGS[lang];
  let plan = null;
  const setLang = result => {
    if (result?.lang === "he" || result?.lang === "en") lang = result.lang;
    if (result?.limits) plan = result.limits;
  };
  const CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: "Segoe UI", system-ui, sans-serif; }
.note { color: #202020; background: #ffe14a; border: 2.5px solid #202020;
  border-radius: 18px 26px 16px 24px / 24px 16px 26px 18px; box-shadow: 6px 7px 0 #202020; line-height: 1.55; font-size: 16px; }
dialog.note { width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 40px); overflow: auto; padding: 26px 28px 24px; rotate: -1.2deg; }
dialog::backdrop { background: #e9e9e6; }
.head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.face { width: 54px; height: 54px; flex: none; overflow: visible; }
.face path { fill: #fff; stroke: #202020; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.face path.mouth { fill: none; }
.face circle { fill: #202020; }
h2 { font-size: 28px; font-weight: 700; letter-spacing: -.5px; line-height: 1.15; margin: 0; }
p { margin: 0 0 14px; }
fieldset { border: 0; padding: 0; margin: 0 0 20px; display: flex; gap: 10px; flex-wrap: wrap; }
legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.choice { position: relative; display: inline-flex; align-items: center; padding: 10px 20px; font-size: 18px; font-weight: 600;
  background: #fff; border: 2px solid #202020; border-radius: 22px 18px 24px 16px; cursor: pointer; }
.choice input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.choice:has(input:checked) { background: #202020; color: #ffe14a; }
.choice:has(input:focus-visible) { outline: 3px solid #202020; outline-offset: 3px; }
label.q { display: block; font-weight: 600; margin: 0 0 6px; }
textarea { display: block; width: 100%; font: inherit; color: #202020; padding: 10px 12px; background: #fff; border: 2px solid #202020;
  border-radius: 10px 14px 9px 13px; margin-bottom: 12px; resize: vertical; min-height: 44px; }
textarea[data-extra] { min-height: 40px; }
dialog.note { scrollbar-width: thin; scrollbar-color: #202020 transparent; }
.plan { font-size: 14px; margin: -8px 0 16px; }
.small { font-size: 13px; color: #4a4a2a; margin: 0 0 4px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
button { font: inherit; font-weight: 600; padding: 10px 18px; border: 2px solid #202020; border-radius: 12px 16px 11px 15px;
  background: #fff; color: #202020; cursor: pointer; }
button.primary { background: #202020; color: #fff; }
button.quiet { background: transparent; border-color: transparent; text-decoration: underline; text-underline-offset: 3px; padding-inline: 6px; }
button:active { translate: 1px 1px; }
:focus-visible { outline: 3px solid #202020; outline-offset: 3px; }
.error { color: #8a0000; font-weight: 600; min-height: 1.55em; margin: 0 0 6px; }
.breathe { animation: breathe 5s ease-in-out infinite; transform-origin: center; }
@keyframes breathe { 0%, 100% { scale: 1; } 50% { scale: 1.12; } }
.waiting .head { flex-direction: column; text-align: center; gap: 18px; margin-bottom: 14px; }
.waiting .face { width: 96px; height: 96px; }
.waiting p, .waiting .actions { text-align: center; justify-content: center; }
@media (prefers-reduced-motion: reduce) { .breathe { animation: none; } dialog.note { rotate: none; } }
[popover].note { position: fixed; inset: auto auto 20px 20px; margin: 0; padding: 18px 20px; width: min(360px, calc(100vw - 40px)); rotate: 1.5deg; }
[popover].note .head { margin-bottom: 10px; }
[popover].note .face { width: 40px; height: 40px; }
[popover].note h2 { font-size: 20px; }
[popover].nudge { inset: 0; margin: auto; height: fit-content; width: min(540px, calc(100vw - 32px)); padding: 30px 32px 26px; rotate: -1deg; font-size: 19px; box-shadow: 9px 10px 0 #202020; }
[popover].nudge::backdrop { background: #3a3a38; } /* solid: the page can't be read behind it */
[popover].nudge .face { width: 72px; height: 72px; }
[popover].nudge h2 { font-size: 32px; }
[popover].nudge .actions { margin-top: 18px; }
[popover].nudge button { padding: 12px 22px; font-size: 18px; }
[popover].pinned { inset: 0 50% auto auto; translate: 50% 0; rotate: none; width: auto; max-width: calc(100vw - 32px); padding: 8px 10px 8px 16px;
  display: flex; gap: 14px; align-items: center; border-top: 0; border-radius: 0 0 16px 18px; box-shadow: 0 4px 0 #202020; font-size: 15px; }
[popover].pinned p { margin: 0; font-weight: 600; }
[popover].timer { position: fixed; inset: 16px 16px auto auto; margin: 0; padding: 8px 12px; padding-inline-end: 32px; min-width: 180px; background: #202020; color: #fff; border: 2px solid #202020; border-radius: 12px 14px 11px 13px; box-shadow: 3px 4px 0 #ffe14a; font-size: 13px; line-height: 1.4; cursor: grab; user-select: none; touch-action: none; }
[popover].timer:active { cursor: grabbing; }
[popover].timer.over { box-shadow: 3px 4px 0 #fff, 3px 4px 0 2px #202020; }
.t-row { display: flex; justify-content: space-between; gap: 16px; }
.t-val { font-weight: 700; font-variant-numeric: tabular-nums; color: #ffe14a; }
button.t-hide { position: absolute; inset-block-start: 3px; inset-inline-end: 3px; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #fff; font-size: 16px; line-height: 1; }
.timer.mini { min-width: 0; padding-block: 4px; }
.timer.mini .t-row + .t-row, .timer.mini .t-lab { display: none; }
.timer:focus-visible, button.t-hide:focus-visible { outline: 3px solid #ffe14a; outline-offset: 2px; }
[popover].started { display: flex; gap: 14px; align-items: center; padding: 12px 14px 12px 18px; }
[popover].started p { margin: 0; font-weight: 600; }
[popover].started button { padding: 5px 12px; font-size: 14px; flex: none; }
[popover].pinned button { padding: 5px 12px; font-size: 14px; }
`;
  let host = null, shadow = null, dialog = null, popover = null;
  // Sites like Facebook run keyboard shortcuts from page-wide listeners. Inside a closed
  // shadow root they cannot tell the user is typing, so they swallow letters (K, J, L...).
  // Registered at document_start, before any page script, this listener sees our keys first
  // and stops them from reaching the page. Typing itself (the default action) still happens.
  for (const type of ["keydown", "keypress", "keyup", "beforeinput", "input"]) {
    window.addEventListener(type, event => {
      if (dead || !host || !event.composedPath().includes(host)) return;
      event.stopImmediatePropagation();
      if (type === "keydown") ownKeydown(event);
    }, true);
  }
  // Our own keyboard handling, since the listener above stops the event before it reaches our elements.
  function ownKeydown(event) {
    const focused = shadow?.activeElement;
    if (event.key === "Escape" && popover && !popover.classList.contains("pinned") && !dialog) { dismiss(); return; }
    const step = event.shiftKey ? 40 : 10;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (d && timerEl && focused === timerEl) {
      event.preventDefault();
      const r = timerEl.getBoundingClientRect();
      placeTimer(r.left + d[0], r.top + d[1]);
    }
  }
  let state = "idle"; // idle | asking | waiting | visiting | ended | off
  let fresh = false, nextDelay = TICK_MS, tickTimer = 0, waitTimer = 0, lastActivity = Date.now(), returnFocus = null, bannerHiddenUntil = 0, enterBusy = false;

  const send = async message => {
    try { return await chrome.runtime.sendMessage(message); } catch { return null; }
  };
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value);
    }
    node.append(...children.filter(Boolean));
    return node;
  }
  // The MEH MODE face, drawn in SVG so no file is fetched.
  function face(extraClass = "") {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 80 80");
    svg.setAttribute("class", ("face " + extraClass).trim());
    svg.setAttribute("aria-hidden", "true");
    const add = (tag, attrs) => { const n = document.createElementNS(ns, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); svg.append(n); };
    add("path", { d: "M40 5C61 4 75 20 74 41C75 60 59 75 39 74C19 76 5 61 6 40C4 20 20 5 40 5Z" });
    add("circle", { cx: 28, cy: 33, r: 3.5 });
    add("circle", { cx: 52, cy: 33, r: 3.5 });
    add("path", { d: "M26 50H54", class: "mouth" });
    return svg;
  }
  const head = (id, text, faceClass) => el("div", { class: "head" }, face(faceClass), el("h2", { id, text }));
  function ensureHost() {
    if (!host) {
      host = document.createElement("meh2-root");
      shadow = host.attachShadow({ mode: "closed" });
      shadow.append(el("style", { text: CSS }));
    }
    if (!host.isConnected) document.documentElement.append(host);
  }
  const closeTab = () => { void send({ type: "MEH2_CLOSE_TAB" }); };

  // Entry questionnaire, shown before the page (D47, D48).
  function ask(level) {
    removeTimer();
    clearTimeout(tickTimer); clearTimeout(waitTimer);
    hidePopover();
    state = "asking";
    ensureHost();
    dialog?.remove();
    const error = el("p", { class: "error", role: "alert" });
    const extra = el("div");
    const sentence = el("textarea", { id: "m2-sentence", rows: "2", maxlength: "300", "aria-describedby": "m2-note" });
    let purpose = null;
    const renderExtra = () => {
      extra.replaceChildren();
      const count = purpose === "pleasure" ? [0, 2, 3][level] : 0;
      T().extra.slice(0, count).forEach((text, i) => {
        extra.append(el("label", { class: "q", for: "m2-x" + i, text }), el("textarea", { id: "m2-x" + i, rows: "1", maxlength: "300", "data-extra": "" }));
      });
    };
    const choices = T().purposes.map(([value, label]) => el("label", { class: "choice" },
      el("input", { type: "radio", name: "purpose", value, onchange: () => { purpose = value; renderExtra(); } }), label));
    const form = el("form", { onsubmit: event => {
      event.preventDefault();
      if (!purpose) { error.textContent = T().errPurpose; return; }
      const fields = [sentence, ...extra.querySelectorAll("textarea")];
      const empty = fields.find(field => field.value.trim().length < 3);
      if (empty) { error.textContent = T().errEmpty; empty.focus(); return; }
      // Answers stay on this page and are discarded right away (D46).
      fields.forEach(field => { field.value = ""; });
      if (purpose === "pleasure" && level === 2) wait(purpose);
      else void start(purpose);
    } },
      head("m2-title", T().title),
      plan && el("p", { class: "plan", text: T().plan(plan) }),
      el("fieldset", {}, el("legend", { text: T().title }), ...choices),
      el("label", { class: "q", for: "m2-sentence", text: T().sentence }),
      sentence,
      extra,
      error,
      el("div", { class: "actions" },
        el("button", { type: "submit", class: "primary", text: T().enter }),
        el("button", { type: "button", class: "quiet", onclick: closeTab, text: T().closeTab })),
      el("p", { id: "m2-note", class: "small", style: "margin-top:14px", text: T().note })
    );
    dialog = el("dialog", { class: "note", lang, dir: T().dir, "aria-labelledby": "m2-title", oncancel: event => event.preventDefault() }, form);
    shadow.append(dialog);
    dialog.showModal();
    choices[0].querySelector("input").focus();
  }
  // One-minute wait at the heavy level. It advances only while this tab is visible and focused.
  function wait(purpose) {
    state = "waiting";
    let waited = 0, last = Date.now();
    dialog.classList.add("waiting");
    dialog.replaceChildren(
      head("m2-title", T().waitTitle, "breathe"),
      el("p", { role: "status", text: T().waitText }),
      el("div", { class: "actions" }, el("button", { type: "button", onclick: closeTab, text: T().closeTab }))
    );
    dialog.querySelector("button").focus();
    const step = () => {
      const now = Date.now();
      if (document.visibilityState === "visible" && document.hasFocus()) waited += Math.min(now - last, 1500);
      last = now;
      if (waited >= WAIT_MS) void start(purpose);
      else waitTimer = setTimeout(step, 1000);
    };
    waitTimer = setTimeout(step, 1000);
  }
  async function start(purpose) {
    const result = await send({ type: "MEH2_START", purpose });
    if (dead) return;
    if (!result?.ok) { stop(); return; }
    dialog?.close(); dialog?.remove(); dialog = null;
    visiting(result);
    if (!result.overrun && result.untilNudgeMin > 0) showStarted(result.untilNudgeMin);
  }
  function visiting(result) {
    state = "visiting";
    lastActivity = Date.now();
    handle(result);
    schedule();
  }
  function schedule() {
    clearTimeout(tickTimer);
    // Ask exactly when the next reminder is due, but at least every TICK_MS.
    if (state === "visiting" && !document.hidden) tickTimer = setTimeout(tick, Math.max(250, Math.min(TICK_MS, nextDelay)));
  }
  async function tick() {
    if (dead || state !== "visiting" || document.hidden) return;
    if (Date.now() - lastActivity >= IDLE_MS) { await endVisit(); return; }
    const result = await send({ type: "MEH2_TICK", active: true, fresh, popupOpen: nudgeOpen() });
    fresh = false;
    if (dead || state !== "visiting") return;
    handle(result);
    schedule();
  }
  // Next check-in: when the next reminder is due or the time runs out, at most TICK_MS away.
  const dueIn = result => Math.min(TICK_MS, ...[result?.popupInMs, result?.overrunInMs].filter(Number.isFinite).map(ms => ms + 50));
  function handle(result) {
    setLang(result);
    nextDelay = dueIn(result);
    if (!result?.ok) { stop(); return; }
    if (result.mode === "ask") { ask(result.level); return; }
    updateTimer(result);
    if (!result.overrun) { hidePopover(); return; }
    if (result.popup) showPopup(result);
    else if (result.pinned && !popover?.matches(":popover-open") && Date.now() >= bannerHiddenUntil) showBanner();
  }
  function message(v) {
    // The first reminder says why it came; later ones rotate through the lines.
    if ((v.shown || 0) <= 1) return v.reason === "visit" ? T().visit : T().global;
    return T().nudges[(v.shown - 2) % T().nudges.length];
  }
  function hidePopover() {
    if (!popover) return;
    const hadFocus = shadow.activeElement !== null;
    try { popover.hidePopover(); } catch {}
    popover.remove(); popover = null;
    if (hadFocus && returnFocus?.isConnected) returnFocus.focus();
  }
  function openPopover(node) {
    hidePopover();
    ensureHost();
    returnFocus = document.activeElement;
    popover = node;

    shadow.append(popover);
    popover.showPopover();
  }
  const nudgeOpen = () => Boolean(popover?.classList.contains("nudge"));
  function dismiss() {
    // Closing a reminder starts the wait for the next one (45, 30, 15, 10, then 5 seconds).
    if (popover?.classList.contains("nudge") && state === "visiting") {
      void send({ type: "MEH2_DISMISSED" }).then(result => {
        if (dead || state !== "visiting" || !result?.ok) return;
        nextDelay = dueIn(result);
        schedule();
      });
    }
    if (popover?.classList.contains("pinned")) bannerHiddenUntil = Date.now() + BANNER_SNOOZE_MS;
    hidePopover();
  }
  // Big, centered over a dimmed page so it interrupts (D57). Always closable with one click or Escape.
  function showPopup(v) {
    openPopover(el("div", { popover: "manual", class: "note nudge", role: "dialog", lang, dir: T().dir, "aria-labelledby": "m2-pop-title" },
      head("m2-pop-title", message(v)),
      el("div", { class: "actions" },
        el("button", { type: "button", class: "primary", onclick: closeTab, text: T().closeTab }),
        el("button", { type: "button", onclick: dismiss, text: T().notYet }))));
    // Focus the gentle choice so Enter never closes the tab by accident.
    popover.querySelectorAll("button")[1].focus();
  }
  // Floating timer (D51): this visit and today's time left for the chosen purpose.
  // Drag with the mouse, move with arrow keys when focused. It cannot be closed, only shrunk.
  let timerEl = null, timerVisit = null, timerToday = null, timerTick = 0, timerMini = false, timerPos = null;
  const timerLeft = { visit: 0, today: 0 };
  // Time left, or "+m:ss" over the limit.
  const clock = s => { const a = Math.abs(Math.round(s)); return `${s < 0 ? "+" : ""}${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`; };
  function updateTimer(result) {
    if (state !== "visiting" || !Number.isFinite(result.visitLeftSec)) return;
    Object.assign(timerLeft, { visit: result.visitLeftSec, today: result.todayLeftSec });
    if (!timerEl) buildTimer();
    renderTimer();
    clearTimeout(timerTick);
    timerTick = setTimeout(countDown, 1000);
  }
  function countDown() {
    if (!timerEl || state !== "visiting" || document.hidden) return;
    if (Date.now() - lastActivity < IDLE_MS) { timerLeft.visit -= 1; timerLeft.today -= 1; }
    renderTimer();
    timerTick = setTimeout(countDown, 1000);
  }
  function renderTimer() {
    timerVisit.textContent = clock(timerLeft.visit);
    timerToday.textContent = clock(timerLeft.today);
    timerEl.classList.toggle("over", timerLeft.visit < 0 || timerLeft.today < 0);
  }
  function placeTimer(x, y) {
    const r = timerEl.getBoundingClientRect();
    timerPos = { x: Math.min(Math.max(0, x), innerWidth - r.width), y: Math.min(Math.max(0, y), innerHeight - r.height) };
    Object.assign(timerEl.style, { left: timerPos.x + "px", top: timerPos.y + "px", right: "auto", bottom: "auto" });
  }
  function buildTimer() {
    ensureHost();
    timerVisit = el("span", { class: "t-val" });
    timerToday = el("span", { class: "t-val" });
    timerEl = el("div", { popover: "manual", class: "timer", lang, dir: T().dir, tabindex: "0", role: "group", "aria-label": T().timerLabel },
      el("div", { class: "t-row" }, el("span", { class: "t-lab", text: T().timerVisit }), timerVisit),
      el("div", { class: "t-row" }, el("span", { text: T().today }), timerToday),
      el("button", { type: "button", class: "t-hide", onclick: () => { timerMini = !timerMini; sizeTimer(); } }));
    sizeTimer();
    // A drag starts only after the pointer moves a few pixels. A plain click on the small timer opens it.
    timerEl.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      const r = timerEl.getBoundingClientRect(), x0 = event.clientX, y0 = event.clientY, dx = x0 - r.left, dy = y0 - r.top;
      let dragging = false;
      const move = e => {
        if (!dragging && Math.hypot(e.clientX - x0, e.clientY - y0) < 4) return;
        if (!dragging) { dragging = true; timerEl.setPointerCapture(e.pointerId); }
        placeTimer(e.clientX - dx, e.clientY - dy);
      };
      const up = e => {
        window.removeEventListener("pointermove", move, true);
        window.removeEventListener("pointerup", up, true);
        if (!dragging && timerMini && !e.composedPath().some(n => n.classList?.contains("t-hide"))) { timerMini = false; sizeTimer(); }
      };
      window.addEventListener("pointermove", move, true);
      window.addEventListener("pointerup", up, true);
    });
    shadow.append(timerEl);
    timerEl.showPopover();
    if (timerPos) placeTimer(timerPos.x, timerPos.y);
  }
  function sizeTimer() {
    const button = timerEl.querySelector(".t-hide");
    timerEl.classList.toggle("mini", timerMini);
    button.textContent = timerMini ? "+" : "–";
    button.setAttribute("aria-label", timerMini ? T().timerGrow : T().timerShrink);
    button.setAttribute("aria-expanded", String(!timerMini));
    button.title = button.getAttribute("aria-label");
    if (timerPos) placeTimer(timerPos.x, timerPos.y);
  }
  function removeTimer() {
    clearTimeout(timerTick);
    if (!timerEl) return;
    try { timerEl.hidePopover(); } catch {}
    timerEl.remove(); timerEl = null;
  }
  // Confirmation after "Go in". Closes itself after a few seconds; a reminder replaces it.
  let startedTimer = 0;
  function showStarted(minutes) {
    openPopover(el("div", { popover: "manual", class: "note started", role: "status", lang, dir: T().dir },
      el("p", { text: T().started(minutes) }),
      el("button", { type: "button", onclick: dismiss, text: T().close })));
    const shown = popover;
    clearTimeout(startedTimer);
    startedTimer = setTimeout(() => { if (popover === shown) hidePopover(); }, 6000);
  }
  function showBanner() {
    openPopover(el("div", { popover: "manual", class: "note pinned", role: "status", lang, dir: T().dir },
      el("p", { text: T().banner }),
      el("button", { type: "button", onclick: dismiss, text: T().hide })));
  }
  async function endVisit() {
    clearTimeout(tickTimer);
    removeTimer();
    state = "ended";
    hidePopover();
    await send({ type: "MEH2_END" });
  }
  function stop() {
    state = "off";
    removeTimer();
    clearTimeout(tickTimer); clearTimeout(waitTimer);
    hidePopover();
    if (dialog) { try { dialog.close(); } catch {} dialog.remove(); dialog = null; }
  }
  async function enter() {
    if (dead || enterBusy) return;
    enterBusy = true;
    try {
      const result = await send({ type: "MEH2_ENTER" });
      if (dead) return;
      if (!result?.ok) { stop(); return; }
      setLang(result);
      if (result.mode === "ask") ask(result.level);
      else visiting(result);
    } finally { enterBusy = false; }
  }
  const activity = () => {
    if (dead) return;
    lastActivity = Date.now();
    if (state === "ended") void enter();
  };
  for (const type of ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"]) {
    window.addEventListener(type, activity, { capture: true, passive: true });
  }
  // Escape closes the popup even when focus went back to the page.
  window.addEventListener("keydown", event => {
    if (!dead && event.key === "Escape" && popover && !popover.classList.contains("pinned")) dismiss();
  }, true);
  document.addEventListener("visibilitychange", () => {
    if (dead) return;
    if (document.hidden) {
      clearTimeout(tickTimer);
      // Save the seconds since the last check-in before leaving, then count nothing while away.
      if (state === "visiting" && Date.now() - lastActivity < IDLE_MS) {
        void send({ type: "MEH2_TICK", active: true, fresh, popupOpen: nudgeOpen() }).then(result => { if (!dead && state === "visiting" && result?.popup) showPopup(result); });
      }
      fresh = true;
      return;
    }
    if (state === "visiting") {
      if (Date.now() - lastActivity >= IDLE_MS) void endVisit().then(enter);
      else { nextDelay = 0; schedule(); } // check in right away, so the timer moves again at once
    }
  });
  window.addEventListener("pageshow", event => { if (!dead && event.persisted) void enter(); });
  // The site switch or a revoked grant turns MEH off for this tab.
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (dead || sender.id !== chrome.runtime.id || message?.type !== "MEH_CONFIG") return;
    if (state === "off") void enter();
    else void send({ type: "MEH2_PING" }).then(result => { if (!result?.ok) stop(); });
  });
  // Chrome may load a typed address ahead of time. The worker refuses a page that is still
  // prerendering, so wait until it is really shown.
  if (document.prerendering) document.addEventListener("prerenderingchange", () => void enter(), { once: true });
  else void enter();
})();
