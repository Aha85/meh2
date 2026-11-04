<p align="center"><img src="extension/assets/icon-128.png" width="96" alt="MEH MODE icon"></p>

<h1 align="center">MEH MODE</h1>
<p align="center"><b>Make social media bland.</b><br>A free Chrome extension that turns social media gray, asks why you came, and nags you when your time is up.</p>

<p align="center"><a href="https://github.com/Aha85/meh2/raw/main/download/meh-mode.zip"><b>⬇ Download MEH MODE</b></a></p>

![TikTok in grayscale with the MEH MODE side panel open](screenshots/1-grayscale.png)

## Why

You open LinkedIn to answer one message. Twenty minutes later you're still scrolling.

Feeds are built to be bright: red badges, colorful thumbnails, flashy promos. MEH MODE takes the color away on the sites you choose. Everything still works. You can still read, write, search and reply. It's just a little less interesting.

## What it does

- **Grayscale on the sites you pick.** Facebook, Instagram, LinkedIn, TikTok and X / Twitter. All start off. You choose.
- **Hold to peek in color.** Need to check a photo or a chart? Hold the button. Color lasts only while you hold it.
- **Questions at the door.** Each visit starts with what you're here for and one sentence about it. Past 50% and 80% of your daily time, there are more questions. Past 80% there is also a one-minute wait.
- **A daily limit and a visit limit.** You set both. Defaults: 45 minutes a day, 5 minutes a visit.
- **Nudges when time is up.** A popup jumps up, then keeps coming back more often. You can always close it. Nothing is blocked.
- **A visit ends after 2 minutes without input.** If you don't move the mouse, press a key or scroll for 2 minutes, MEH MODE decides you left. The timer disappears, and the next time you touch the page the entry question comes back. Watching a long video without touching the page counts as leaving. Those 2 minutes still count against your day, but nothing counts after the visit ends.
- **A live timer.** A small timer on the page shows what is left of this visit and of today. Drag it where you like, or shrink it. The panel shows the same numbers.
- **Turning the limits off takes a sentence.** To switch a site off, you write why. The questions, nudges and timer stop on that site until the next daily reset, then they come back by themselves. The gray stays: hold the button to peek in color.

![Holding the button shows color only while held](screenshots/2-hold-to-peek.png)

<img src="screenshots/3-turn-off-question.png" width="340" alt="Switching a site off opens a box under the site list asking why">

## The settings panel

Click the MEH MODE icon to open the panel.

<img src="screenshots/4-settings.png" width="340" alt="The MEH MODE settings panel: limits, language and site switches">

- **Daily total:** minutes a day across all your sites.
- **One visit:** minutes before the nudges start.
- **Day resets at:** the hour your daily time starts over.
- **On-page language:** English or Hebrew, for the questions and nudges.
- **Save limits:** your first save applies now. Later changes start at the next reset, so today's limits stay fixed.
- **Where to meh:** switch on the sites you want. Switching one off opens a box right below the list asking why. Write your answer and click **Turn off until reset**. The switch then reads "Off until 5:00" (or your reset hour). Switch it back on any time to bring the limits back. If you reload the page before you confirm, the box closes and the switch goes back to On.

![The question shown when you enter a site](screenshots/5-entry-question.png)

![The nudge shown when your time is over](screenshots/6-nudge.png)

## What it's based on

Short studies on grayscale phones motivated this experiment:

- In a one-week study, 84 Android users spent about 20 fewer minutes a day on their phones in grayscale. They unlocked their phones just as often. ([Dekker and Baumgartner, 2024](https://doi.org/10.1177/20501579231212062))
- A small feasibility trial with medical students reported about 28 fewer minutes a day, with some usability complaints. ([Hagerty et al., 2026](https://doi.org/10.3389/fdgth.2026.1816095))
- Adding a short moment of friction before opening an app reduced how often people opened it. ([Grüning et al., PNAS 2023](https://doi.org/10.1073/pnas.2213114120))

**Honest limits:** these studies looked at phones, not desktop social media, and at different kinds of friction. MEH MODE itself has not been tested in a study, and neither have its limits or nudges. It does not "reset your dopamine" or cure anything. It's a simple tool worth trying.

## What's new in v0.4.12

- Switching a site off now turns off its **limits** (questions, nudges, timer) until the next daily reset, instead of removing gray for one visit. Gray always stays; use **Hold to peek in color**.
- The "why" box now opens under the list of sites, and names the site you are turning off.
- The switch shows when the site comes back, for example "Off until 5:00".

To update from an older version: download the zip again, replace your old `extension` folder with the new one, then open `chrome://extensions` and click the reload icon on MEH MODE.

## Install (about 2 minutes)

MEH MODE is not in the Chrome Web Store yet, so you install it manually:

1. **[Download meh-mode.zip](https://github.com/Aha85/meh2/raw/main/download/meh-mode.zip)** and unzip it. Keep the folder somewhere permanent, like Documents.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and choose the unzipped **`extension`** folder (the one with `manifest.json` inside).
5. Click the puzzle icon in the toolbar and **pin** MEH MODE.
6. Open a social site, click the MEH MODE icon, and switch that site **On**. Approve Chrome's access request.
7. Set your limits in the panel and click **Save limits**, or keep the defaults.
8. Reload the site. The first question appears.

Tip: the panel opens on the side of the page. To move it right, go to Chrome **Settings → Appearance → Side panel → Show on right**.

Works in Chrome 120+ and other Chromium browsers on desktop.

## Privacy

- No account, no tracking, no analytics, no servers.
- Site access is used only to add or remove grayscale. Page content is never read, saved or sent.
- Your written answers are never saved or sent.
- Only your site choices, your limits and today's minutes used are stored, locally in your browser.
- What you type in the entry questions is erased when you go in.

## Remove

Go to `chrome://extensions` and click **Remove** on MEH MODE.

## About

Made by [Danny Shaket](https://www.dannyshaket.com/creations). Feedback and bug reports: [open an issue](https://github.com/Aha85/meh2/issues).

Released under the [MIT License](LICENSE).
