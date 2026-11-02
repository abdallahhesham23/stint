# Study tracker: design spec

Date: 2026-11-03 · Status: awaiting review

## Purpose

A study tracker for one university student with ADHD who uses it mostly on a laptop. Its job is to **get them studying and help them study longer**. Every other feature (stats, goals, streaks) supports that loop.

What the user told us:

- Natural focus window is about 30 minutes. They want the app to train that window up.
- Studying breaks down at four points: getting started, picking what to study, drifting mid-session, and coming back after a break.
- University courses with exams. Week starts on Saturday. Laptop first, phone second.

Assumptions (the user can correct these):

- A partial session still counts.
- Nothing in the app punishes or shames.
- The app should make the decision so the user doesn't have to.

Success means:

- From the home screen, one tap starts a session on the right subject.
- Over a few weeks, the typical session length grows.
- Ending a session feels good.

## Core loop

1. **Today** opens with one big button that is already filled in, for example `Start · Calculus · 28 min · round 1 of 3`.
2. One tap opens **Focus** (full screen) and starts the timer.
3. When the round ends: a reward moment, then the session is logged automatically. A break starts.
4. When the break ends: a chime and a system notification. **Back to it** starts the next round with the same subject.
5. After the last round of the sitting: a bigger celebration and a suggested long break.

## Behaviour rules

### Next-up suggestion (picks the subject)

Among active (non-archived) subjects:

1. A subject with an exam in the next 14 days wins. If several qualify, the closest exam wins.
2. Otherwise, the subject with the most weekly-goal minutes still to do this week.
3. Ties go to the subject studied least recently.

Tapping the subject chip on the button opens a picker. With no subjects at all, the button becomes "Add your first subject".

### Focus stamina (makes single sessions longer)

- `staminaMin` starts at 25. The goal comes from Settings (default 50). The floor is the starting value.
- A **stamina round** is a focus round started at `staminaMin`.
- A stamina round is **completed** when the timer reaches zero. Extending a round with "+10" still counts as completed.
- After **3 completed stamina rounds** at the current length, the length goes up by `max(2, round(len × 0.1))` minutes, capped at the goal. Example: 25 → 28 → 31 → 34 → 37 → 41 → 45 → 50. The step-up is a reward moment: "Next round: 28 min. Your focus is growing."
- After **3 early stops in a row** (a stamina round stopped before zero) at a length above the floor, the length steps back one level. The copy is kind: "Let's settle at 25 for a bit." The length never drops below the floor.
- Early stops still log their time. Rounds started from "Just 5 minutes" or a custom length don't affect stamina.

### Sittings (chain rounds)

- A sitting has `roundsPerSitting` rounds (default 3, range 1 to 6). Rounds alternate with short breaks (default 5 min). The focus screen shows round dots: ● ● ○.
- The last round ends with a sitting celebration and an offer of a long break (default 15 min).
- If the next round doesn't start within 15 minutes after a break ends, the sitting quietly closes. Finished rounds still count, and nothing tells the user they failed.

### Session logging

- Any focus time of **1 minute or more** is logged, whether the round finished or was stopped.
- A session stores: subject, start time, actual duration, planned duration, whether it finished, an optional note, and any parked thoughts.
- Paused time is not counted.
- The timer is computed from timestamps, not from ticks, so it stays accurate in background tabs. The running timer is saved so a reload doesn't lose it.

### Goals

- Each subject has a daily goal and a weekly goal, in minutes. The week runs from `weekStart` (default Saturday) to the day before it.
- Rings show minutes done ÷ goal. They can go past 100%; the overflow is drawn as a second lap.
- Today shows one overall ring (the sum across subjects) plus a small ring per subject.

### Streaks

- A day counts if it has at least 1 logged minute.
- Today never breaks a streak while it's still in progress.
- In each week, one day with no study is automatically a **rest day**: the most recent one, counting back from today. It bridges the streak but doesn't add to the count. A rest day that bridges nothing (no study before it) is not shown.
- Milestones at 3, 7, 14, 30, 50 and 100 days each trigger one subtle celebration, once.

### Exams

- An exam has a subject, a title, a date and an estimated number of hours needed.
- Days left = calendar days from today to the exam date.
- Hours remaining = max(0, hours needed − hours studied on that subject since the exam was added).
- Suggested daily hours = hours remaining ÷ days left, rounded to 0.25 h.
- On exam day the copy changes to "Exam day. You've put in the work."
- Past exams move to a "Done" list.

## ADHD helpers, mapped to the four sticking points

| Sticking point | Helper |
|---|---|
| Getting started | One-tap start from Today. A secondary "Just 5 minutes" option. At the end of a round, "Keep going +10". |
| Picking what to study | The next-up suggestion above. |
| Drifting | Full-screen focus mode. The tab title shows `18:42 · Calculus`. Returning to the tab shows a kind "welcome back, 12 min left" (distraction is never counted). A "park a thought" box (`P`) saves a distraction into the session. |
| Coming back after a break | The break counts down in the tab title. When it ends: a chime, a system notification (if allowed) and a one-tap **Back to it**. The break screen shows what's next. |

## Screens

- **Today** (home): greeting with the user's name and time of day, the big start button, today's ring, current streak, next exam, and a small stamina indicator.
- **Focus**: full screen. Large timer in tabular figures, subject, round dots, pause, stop, park-a-thought. On finish: reward, optional note, then the break screen.
- **Subjects**: list with color, icon and goal rings. Add, edit and archive (archived subjects can be restored). Color comes from a curated palette; the icon comes from a curated lucide set.
- **Log**: sessions grouped by day, showing subject, duration, note and parked thoughts. Sessions can be edited or deleted, and you can add a session you did away from the app.
- **Stats**:
  - Yearly heatmap (rows start on Saturday)
  - This-week bar chart
  - Time per subject for the last 30 days
  - Best focus time of day (peak 2-hour window)
  - Total hours
  - Stamina card: current length and goal, with a history of step-ups
- **Exams**: upcoming exams with days left and suggested daily hours. Add, edit and delete exams.
- **Settings**: name, break lengths, rounds per sitting, stamina goal, week start, theme (system, light, dark), chime on or off, notification permission, JSON export and import.

Navigation is a left sidebar on laptop and a bottom tab bar on phone (Focus has no navigation). Every empty state invites the user to start, never scolds.

The app's name is chosen together with the art direction in the next step.

## Data model (localStorage, one key, schema `version: 1`)

```ts
Subject  { id, name, color, icon, dailyGoalMin, weeklyGoalMin, archived, createdAt }
Session  { id, subjectId, startedAt, durationSec, plannedSec, completed, note, parked: string[] }
Exam     { id, subjectId, title, date /* YYYY-MM-DD */, hoursNeeded, createdAt }
Settings { name, breakMin, longBreakMin, roundsPerSitting, staminaGoalMin, weekStart /* 0-6, 6 = Sat */,
           theme, chime }
Stamina  { lengthMin, floorMin, completedAtLength, earlyStopsInRow, history: { date, lengthMin }[] }
Timer    { phase: 'focus' | 'break' | 'longBreak', subjectId, startedAt, plannedSec, round,
           pausedAt?, pausedSec, kind: 'stamina' | 'quick' | 'custom' } | null
Seen     { milestones: number[] }  // celebrations already shown
```

## Tech

- React, Vite, TypeScript and Tailwind CSS v4.
- Zustand, with `persist` to localStorage.
- Hash routing, so it works as a static PWA.
- lucide-react for icons.
- Hand-built SVG for rings, the heatmap and bars (no chart library).
- The motion library is chosen in the emil-design-eng step.
- vite-plugin-pwa for install and offline use.
- Logic (next-up, stamina, streaks, goals, exams, import validation) lives in pure functions under `src/lib/`, separate from the UI.

## Error handling

- **Corrupt or unreadable storage:** the raw value is copied to a backup key, the app starts fresh, and a calm notice offers to download the backup.
- **Storage full on save:** a toast suggests exporting. The app never silently drops data.
- **Import:** parse the file, then validate every record (types, references, dates). Show what will be imported ("12 subjects, 340 sessions, 3 exams"). Replace the current data only after the user confirms. Invalid files are rejected with a plain-language reason.
- **Notification permission denied:** fall back to the chime plus the tab title.

## Testing

- **Vitest unit tests** for each pure function:
  - Next-up ordering
  - Stamina step-up and step-back
  - Streak with rest days and a Saturday week start
  - Weekly goal window
  - Exam suggestion and exam day
  - Import validation, rejecting bad input
- **Playwright** for screenshots of every screen in light and dark mode at phone and laptop widths, used in the testing step.

## Out of scope

- Accounts and cloud sync
- Multiple users
- Sounds other than the chime
- Counting distraction time (it would read as guilt)
- Calendar integration
