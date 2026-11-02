# Design system: Stint · Reading room

From ui-ux-pro-max on 2026-11-03, applied to `direction.md`.

The tool's generic `--design-system` output was rejected on purpose: a blue Plus Jakarta SaaS look with a testimonial carousel. The direction the user chose wins. What was kept from the tool:

- the pre-delivery checklist
- the requirement for text beside charts and heatmaps
- 44px touch targets
- per-theme contrast checks
- stable press states

Every pair below was measured with `scratchpad/contrast.mjs` (WCAG 2.x).

## 1. Colour tokens

```css
:root {                      /* light: white ground, sage paper panels */
  --ground: #ffffff;         /* page */
  --surface: #f3f5f2;        /* tonal panel: sage paper */
  --raised: #ffffff;         /* the one inner card per screen; inputs */
  --active: #e7eae6;         /* nav pill, selected segment track, row hover */
  --border: #e1e5e0;         /* hairline where a panel meets white */
  --control: #7f847e;        /* input/checkbox edges: 3.82 on ground, 3.48 on surface */
  --track: #e1e5e0;          /* ring and ladder tracks */
  --text: #1f201d;           /* 16.4 on ground, 14.9 on surface */
  --muted: #5c5f5a;          /* 6.5 ground, 5.9 surface, 5.3 active */
  --accent: #1b6e66;         /* deep teal: 6.1 on ground, 5.5 on surface */
  --accent-hover: #155a53;
  --on-accent: #ffffff;      /* 6.1 on accent */
  --accent-wash: #e3efed;    /* the reward wash; rare */
  --positive: #2e7d32;       /* 4.7 on surface */
  --negative: #b42318;       /* 6.0 on surface, the failing fact only */
  --heat-0: #eef0ed; --heat-1: #cfe5e1; --heat-2: #9ccbc4; --heat-3: #5fa99f; --heat-4: #1b6e66;
  --scrim: rgb(15 17 16 / 0.42);
  --shadow-float: 0 12px 32px rgb(20 28 24 / 0.12), 0 2px 6px rgb(20 28 24 / 0.06);
}
:root[data-theme="dark"] {   /* designed for night study, not inverted */
  --ground: #0f1110;         /* green-black, never navy or slate */
  --surface: #181a19;
  --raised: #202322;
  --active: #272a29;
  --border: #2a2d2b;
  --control: #6c716d;        /* 3.81 ground, 3.52 surface */
  --track: #2c302e;
  --text: #eef0ec;           /* 16.5 ground, 15.3 surface, 13.8 raised */
  --muted: #a3a7a1;          /* 7.8 ground, 7.2 surface, 5.9 active */
  --accent: #5cc1b2;         /* teal lifted: 8.8 on ground */
  --accent-hover: #7bd0c3;
  --on-accent: #062b26;      /* 7.0 on accent */
  --accent-wash: #16302c;
  --positive: #7cc47f;
  --negative: #f0857a;
  --heat-0: #1e201f; --heat-1: #1d3d39; --heat-2: #23615a; --heat-3: #2f8f84; --heat-4: #5cc1b2;
  --scrim: rgb(0 0 0 / 0.6);
  --shadow-float: 0 16px 40px rgb(0 0 0 / 0.5);  /* plus a 1px --border edge on floating things */
}
```

The `system` theme follows `prefers-color-scheme`. An explicit `data-theme` overrides it.

### Accent budget
Teal appears only in these places:
- the one primary button on a screen
- today's main data: today's ring, the current-week bar, reached ladder rungs, the heatmap ramp
- the focus ring
- reward moments

Nothing else is teal: no links, no tabs, no nav.

### Subject colours
Subject colours are identity. They appear as dots, icons and the per-subject bars on Stats. Each passes 3:1 against both the ground and the panel, in both themes.

| key | light | dark |
|---|---|---|
| ocean | `#2f6fb0` | `#6ea5e0` |
| moss | `#4f8a3c` | `#8cc070` |
| amber | `#a86f14` | `#e0a84a` |
| rose | `#c04a6b` | `#e98aa3` |
| rust | `#b4552d` | `#e48a62` |
| slate | `#5b6b7a` | `#9fb0c0` |
| sand | `#8f7349` | `#c9ab7e` |
| charcoal | `#3d3f3a` | `#c8cac4` |

Stored as the key (`subject.color = 'ocean'`). The CSS variable is `--subj-ocean`.

### Added after the critique
- `--rung`: unreached ladder steps (`#c3c8c2` light, `#3e4341` dark), a step darker than `--track` so the scale reads.
- `--selected`: the selected segment (`#ffffff` light, `#3a3e3c` dark) on an `--active` track.
- Exam progress bars take the subject colour, not teal.

## 2. Type

| Role | Face | Size / line | Weight | Notes |
|---|---|---|---|---|
| Greeting (Today h1) | Instrument Serif | 48/52 desktop, 34/38 phone | 400 | tracking -0.01em; one line on desktop |
| Focus timer | Instrument Serif | clamp(112px, 22vw, 220px)/1 | 400 | tabular figures; the only display-size type in the app |
| Screen title (h1 elsewhere) | Instrument Sans | 24/30 | 500 | a noun: "Stats", "Log"; dialog titles too |
| Figure (KPI) | Instrument Sans | 32/36 | 400 | every figure is regular weight; unit as a 14px muted suffix |
| Lead line | Instrument Sans | 16/24 | 400 | the finding under the greeting; empty-state sentences |
| Section title | Instrument Sans | 14/20 | 600 | panel titles |
| Body, nav, cells | Instrument Sans | 14/20 | 400 | |
| Small, meta, axis | Instrument Sans | 12/16 | 400 | the floor; nothing under 12px except the 11px heatmap legend |

- **Sizes in use:** 12, 14, 16, 24, 32, 48 and the timer. That's six plus one.
- **Weights:** 400, 500 and 600. 600 is used for section titles only.
- **Numbers:** `tabular-nums` on every figure, timer, duration and table cell. The Focus timer uses `font-feature-settings: "tnum"` with fixed-width digits so the clock never jitters (verified in the browser at build time).
- **Copy:** sentence case everywhere. No tracked capitals and no monospace.
- **Fonts:** self-hosted through `@fontsource/instrument-sans` (variable) and `@fontsource/instrument-serif`, so the PWA works offline. Use `font-display: swap`.

## 3. Space, grid, radius

- **Spacing:** a 4px base, using 4, 8, 12, 16, 20, 24, 32, 48 and 72. One gap value: **16px** between panels, horizontally and vertically.
- **Panel padding:** 20px (16px on phone).
- **Page:**
  - The sidebar is 224px. The canvas is a centred column with max-width 1100px and 32px side padding (16px on phone).
  - The top offset is 72px on Today and 40px on other screens (24px on phone).
- **Grid:** 12 columns with a 16px gap. 12 × 77 + 11 × 16 = 1100. Narrower viewports use fluid `fr` columns, with the same lines and gap.
  - Today: rows of 8/4, then 4/4/4, then 8/4. Every internal edge sits on column line 4 or 8.
  - Stats: rows of 12 (heatmap), then 8/4 (week bars and figures), then 8/4 (per subject and best time with stamina).
- **Radius**, nested from outside in:
  - panel 22px
  - inner card 14px
  - input 12px
  - segmented track 999px
  - buttons and chips 999px
  - heatmap cell 3px
  - bars 4px at the top and square on the baseline
- **Depth:** depth comes from tone, not shadow. The layers are white ground, then sage panel, then white inner card (used once per screen). `--shadow-float` goes only on things that float: dialogs, the toast, the reward card and popovers.

## 4. Controls and states

| Control | Size | Rest | Hover | Press | Focus-visible | Disabled |
|---|---|---|---|---|---|---|
| Primary (Start studying) | 56px tall on Today and 48px elsewhere; full pill; 16/500 | `--accent` / `--on-accent` | `--accent-hover` | scale .97 | 2px `--accent` outline, 3px offset | avoided; if needed, `--active` bg with `--muted` text and a reason in text beside it |
| Secondary | 40px (44 on touch); pill; 14/500 | transparent, 1px `--control` edge | `--active` fill | scale .97 | as above | as above |
| Text action | 14/500 `--text`, underline on hover | | underline | opacity .7 | outline | |
| Icon button | 40×40 hit area (44 on touch), 18px lucide at 1.75 stroke, `--muted` | | `--active` disc | scale .94 | outline | |
| Input | 44px; radius 12; `--raised` fill; 1px `--control` edge; 15px text | | | | 2px `--accent` outline (replaces the border colour) | |
| Segmented | 36px; `--surface` track; selected pill is `--raised` with `--text`, others `--muted` | | `--text` | | outline | |
| Nav item (sidebar) | 34px pitch, 32px row; 16px icon; 14px label | `--muted` | `--text` | | outline | |
| Nav item (active) | same | `--active` pill (radius 10, inset 8px) and `--text` label | | | | |
| Bottom tab (phone) | 56px bar + safe-area inset; 5 items; 20px icon over a 12px label | `--muted` | | | outline | |
| Bottom tab (active) | same | `--text` label and icon, 3px `--text` dot under the icon | | | | |
| Toggle | 36×22; on = `--text` fill (not teal) | | | | outline | |

Press states use transform only, so layouts never shift. Every control keeps its focus ring. The ring is never removed without a replacement.

## 5. Components

- **Ring.** Stroke 6px on a 64px ring and 4px on a 32px mini ring, with round caps, filled in the subject colour or teal. A value over 100% draws a second lap at 60% opacity. The figure sits beside the ring, never only inside it: `45 /90 min`.
- **Stamina ladder.** Eight 6px-tall rungs with 4px gaps. Reached rungs are `--accent` and the rest are `--track`. Under them, "25" sits at the left and "50 min" at the right. Three 8px pips show completed rounds at the current rung. Its text alternative is "Focus stamina: 28 of 50 minutes, 2 of 3 rounds done at this length."
- **Heatmap.** 11px cells with 3px gaps and 3px radius, using `--heat-0..4` (0, under 30, under 60, under 120, and 120 min or more). Rows run Saturday to Friday, with day initials on rows 1, 3 and 5. A legend reads "Less ▢▢▢▢▢ More". Each cell has a `title` and an `aria-label` such as "Tue 3 Nov, 1 h 15 min". There is also a visually hidden monthly totals table.
- **Week bars.** Seven columns. Today's bar is teal and the other days are `--muted` at 35%. Bars have square bottoms on the baseline, three faint gridlines, round ticks in hours, and day initials underneath.
- **Panel.** `--surface` with radius 22 and padding 20. The title is 14/600. An optional right-aligned `View all` uses 14/500 `--text`.
- **Empty states** keep their panel and title and add one inviting sentence plus one action. Examples:
  - "Your first session will show up here." with the action "Start studying"
  - "Add the courses you're taking this term." with the action "Add a subject"
- **Toast.** Bottom-centre on phone and bottom-left of the canvas on desktop. `--raised` with `--shadow-float` and radius 14. One line plus an optional action ("Undo"). Lasts 5 seconds, or until it is dismissed.
- **Dialog.** A native `<dialog>` with a 480px max width, radius 22, `--raised` and `--shadow-float`, over the `--scrim`. The title is 20/500. Actions sit bottom-right with the primary last. Esc closes it and focus returns to the trigger.

## 6. Screens

- **Today:**
  - The greeting, with the finding line under it in `--muted`.
  - A start block spanning 8 columns. It's the biggest thing on the screen and sits on a white inner card, with an "Up next · round 1 of 3" label, "Calculus II · 28 min", the Start button, the subject chip and "Just 5 minutes".
  - The stamina ladder (4 columns).
  - Row 2: today's ring, the streak and the next exam (4/4/4).
  - Row 3: subjects today with mini rings (8 columns) and recent sessions (4 columns).
- **Focus:**
  - The full `--ground` with no chrome. The subject is shown with its colour dot at the top, and round dots sit under the timer.
  - Controls in one row at the bottom: Pause, Park a thought, Stop. Esc opens Today.
  - During a break the whole screen takes `--accent-wash`. It's the one place teal becomes a field, so a break reads differently from focus at a glance.
- **Subjects, Log, Exams, Stats, Settings:** a 24px noun title, an optional muted line, then panels on the grid. Settings uses the two-column pattern: a label column of about 400px beside a panel.

## 7. Voice

- The app is kind and short. It never uses "failed", "missed", "lost", "broke", "behind", "!" or "please".
- Stopping early: "14 minutes, and they count."
- Rest day: "Rest day. Your streak is safe."
- Step back: "Let's settle at 25 for a bit."
- Exam day: "Exam day. You've put in the work."

## 8. Pre-delivery checklist (ui-ux-pro-max, adapted for web)

- [ ] Body text 4.5:1 or more and non-text 3:1 or more in **both** themes, measured on the built pages
- [ ] Every control has a visible focus ring. Tab order follows visual order.
- [ ] Touch targets are at least 44px under `pointer: coarse` and at 375px
- [ ] Press feedback within 100ms, with transforms only (no layout shift)
- [ ] One icon set (lucide outline, 1.75 stroke), with no emoji
- [ ] Rings, ladder, heatmap and bars all have a text alternative
- [ ] Empty states include an action. Zeros print as 0.
- [ ] `prefers-reduced-motion` gives a still but complete version
- [ ] 375, 768, 1280 and 1440 widths, with no horizontal page scroll
