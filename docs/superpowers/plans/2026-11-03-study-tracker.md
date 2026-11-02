# Study Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-first study tracker. It gets an ADHD student started with one tap and grows their focus sessions from 25 to 50 minutes.

**Architecture:**
- All behaviour lives in pure, unit-tested functions in `src/lib/`.
- A single Zustand store, persisted to one localStorage key, calls those functions and holds the state.
- Screens in `src/screens/` read the store and render. Shared visual pieces live in `src/components/`.
- Routing uses the URL hash.

**Tech Stack:**
- React 19, Vite, TypeScript and Tailwind CSS v4 (`@tailwindcss/vite`)
- zustand, lucide-react, vite-plugin-pwa
- vitest for unit tests
- The motion library is chosen in `docs/design/motion.md`.

**Spec:** `docs/superpowers/specs/2026-11-03-study-tracker-design.md`

**Design inputs (produced before Task 9):**
- `docs/design/direction.md`: art direction, from design-taste-frontend
- `docs/design/system.md`: tokens, type, spacing and states, from ui-ux-pro-max
- `docs/design/motion.md`: durations, easings and reward moments, from emil-design-eng

Tasks 1–8 don't depend on these. Tasks 9–17 do.

## Global Constraints

- localStorage uses a single key, `study-tracker`, holding the whole `AppData` with `version: 1`.
- Default `weekStart` is `6` (Saturday). Weeks run from `weekStart` to the day before it.
- Stamina starts at 25 min with a goal of 50. The step is `max(2, round(len × 0.1))`, applied after 3 completed rounds. The length steps back after 3 early stops in a row above the floor.
- A sitting is `roundsPerSitting` rounds (default 3, range 1–6). Breaks are 5 min and the long break is 15 min. A sitting lapses 15 min after a break ends.
- A session is logged when its focus time is 60 seconds or more.
- An exam counts as "soon" when it is 14 days away or less. Suggested daily hours are rounded **up** to 0.25.
- Streak milestones: 3, 7, 14, 30, 50, 100.
- Copy is kind and never shames. Never use "failed", "missed", "lost", "broke" or "behind" in UI copy.
- Timers and stats use tabular figures (`font-variant-numeric: tabular-nums`).
- Charts are hand-built SVG, with no chart library. No other runtime dependencies beyond those listed in Tech Stack.
- Every animation respects `prefers-reduced-motion`. Text meets WCAG AA contrast in both themes.
- The layout is laptop-first and must work at 375px wide: sidebar at ≥ 768px, bottom tab bar below that.
- Dates are stored as ISO strings for instants and `YYYY-MM-DD` local keys for days. Days are always computed in local time.

## Review Focus

1. **Reloading or reopening after a focus timer ended while the app was away.** The session should be logged once, at its planned length, never twice. Covered by the `resumeOnLoad` tests (Task 5).
2. **Zero goals or empty data.** Rings, percentages and suggestions show 0 or an invitation, never `NaN` or `Infinity`. Covered by `progress` (Task 2), `examPlan` with 0 remaining (Task 6) and `bestWindow([])` (Task 6).
3. **A session started late at night, or on the day a Saturday week starts.** It counts on the local day it started, and goes in the week that contains that day. Covered by Tasks 1 and 2.
4. **An imported file from a newer version, with dangling subject references or negative durations.** It is rejected with a plain reason and current data stays untouched. Covered by the `parseBackup` tests (Task 7).
5. **An exam dated today or in the past.** It shows "Exam day" or moves to Done, with no negative days or division by zero. Covered by the `examPlan` tests (Task 6).

---

## File Structure

```
src/lib/types.ts        data types + defaultData()
src/lib/dates.ts        local day keys, week math
src/lib/goals.ts        minutes per subject in a range, progress ratio
src/lib/nextUp.ts       pick the suggested subject
src/lib/streak.ts       streak + rest days
src/lib/stamina.ts      stamina step-up / step-back
src/lib/timer.ts        elapsed/remaining/next round from timestamps
src/lib/flow.ts         startFocus / completeFocus / startBreak / resumeOnLoad (pure state transitions + reward events)
src/lib/exams.ts        exam plan
src/lib/stats.ts        heatmap, week bars, per subject, best window, totals
src/lib/backup.ts       export + validated import
src/lib/safeStorage.ts  storage adapter that survives corrupt data and full quota
src/store.ts            zustand store (persist) exposing state + actions
src/app/App.tsx         shell: nav, routes, theme, notices, reward layer
src/app/useRoute.ts     hash route hook
src/components/*        Ring, Button, Dialog, Field, SubjectIcon, SubjectPicker, EmptyState, Toast, Heatmap, WeekBars, Rewards
src/focus/*             useTabTitle, useWelcomeBack, alerts (chime + notification)
src/screens/*           Today, Focus, Subjects, Log, Exams, Stats, Settings
src/styles/index.css    Tailwind + tokens from docs/design/system.md
```

Each `src/lib/x.ts` has its tests in `src/lib/x.test.ts`.

---

### Task 1: Scaffold, types, dates

**Files:**
- Create: the project scaffold (`package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/main.tsx`)
- Create: `src/lib/types.ts`, `src/lib/dates.ts`, `src/lib/dates.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
type ID = string
interface Subject { id: ID; name: string; color: string; icon: string; dailyGoalMin: number; weeklyGoalMin: number; archived: boolean; createdAt: string }
interface Session { id: ID; subjectId: ID; startedAt: string; durationSec: number; plannedSec: number; completed: boolean; note: string; parked: string[] }
interface Exam { id: ID; subjectId: ID; title: string; date: string; hoursNeeded: number; createdAt: string }
interface Settings { name: string; breakMin: number; longBreakMin: number; roundsPerSitting: number; staminaGoalMin: number; weekStart: number; theme: 'system' | 'light' | 'dark'; chime: boolean }
interface Stamina { lengthMin: number; floorMin: number; completedAtLength: number; earlyStopsInRow: number; history: { date: string; lengthMin: number }[] }
type TimerKind = 'stamina' | 'quick' | 'custom'
interface Timer { phase: 'focus' | 'break' | 'longBreak'; subjectId: ID; startedAt: string; plannedSec: number; round: number; pausedAt: string | null; pausedSec: number; kind: TimerKind; parked: string[] }
interface AppData { version: 1; subjects: Subject[]; sessions: Session[]; exams: Exam[]; settings: Settings; stamina: Stamina; timer: Timer | null; seen: { milestones: number[] } }
function defaultData(): AppData   // settings: name '', breakMin 5, longBreakMin 15, roundsPerSitting 3, staminaGoalMin 50, weekStart 6, theme 'system', chime true; stamina: lengthMin 25, floorMin 25, rest 0/[]
// dates.ts
function dayKey(d: Date): string                         // local YYYY-MM-DD
function addDays(key: string, n: number): string
function daysBetween(fromKey: string, toKey: string): number  // calendar days, DST-safe
function weekStartKey(key: string, weekStart: number): string
```

`Timer.parked` holds thoughts parked during a focus round until the session is logged.

- [ ] **Step 1: Scaffold.** Run `npm create vite@latest app-tmp -- --template react-ts`, then move its contents into the repo root without touching `docs/`, and delete `app-tmp`. Install `tailwindcss @tailwindcss/vite vitest`, then `zustand lucide-react`. Add the scripts `"test": "vitest run"` and `"typecheck": "tsc -b"`. Add `node_modules`, `dist` and `dev-dist` to `.gitignore`.
- [ ] **Step 2: Write failing tests** in `dates.test.ts`:

```ts
test('weekStartKey with Saturday start', () => {
  expect(weekStartKey('2026-11-03', 6)).toBe('2026-10-31') // Tue
  expect(weekStartKey('2026-10-31', 6)).toBe('2026-10-31') // Sat
  expect(weekStartKey('2026-11-06', 6)).toBe('2026-10-31') // Fri
  expect(weekStartKey('2026-11-07', 6)).toBe('2026-11-07')
})
test('daysBetween is calendar days, DST-safe', () => {
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  expect(daysBetween('2026-11-03', '2026-11-03')).toBe(0)
  expect(daysBetween('2026-11-03', '2026-11-01')).toBe(-2)
})
test('dayKey is local, addDays crosses months', () => {
  expect(dayKey(new Date('2026-11-02T23:50:00'))).toBe('2026-11-02')
  expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
})
```

- [ ] **Step 3:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 4:** Implement `dates.ts` (date math through `Date.UTC(y, m, d)` on key parts) and `types.ts`.
- [ ] **Step 5:** Run `npm test && npm run typecheck`. Expected: PASS.
- [ ] **Step 6:** Commit: `feat: scaffold app, data types, date helpers`.

### Task 2: Goals and next-up

**Files:** Create `src/lib/goals.ts`, `src/lib/nextUp.ts` and tests.

**Interfaces:**
- Consumes: Task 1 types and dates.
- Produces:

```ts
function sessionDay(s: Session): string                    // dayKey(new Date(s.startedAt))
function minutesBySubject(sessions: Session[], fromKey: string, toKey: string): Record<ID, number> // inclusive, by start day
function progress(doneMin: number, goalMin: number): number // goal <= 0 → 0; may exceed 1
function pickNextUp(subjects: Subject[], sessions: Session[], exams: Exam[], todayKey: string, weekStart: number): Subject | null
```

- [ ] **Step 1: Write failing tests.** Use the helper `mk(subjectId, startedAt, min)` to build a Session.
  - `minutesBySubject([mk('a','2026-11-02T23:50:00',30), mk('a','2026-11-03T09:00:00',25)], '2026-11-03', '2026-11-03')` equals `{ a: 25 }`.
  - `progress(30, 0)` is `0`. `progress(90, 60)` is `1.5`.
  - `pickNextUp`, with today `2026-11-03`:
    - (a) Subject B with an exam on `2026-11-10` beats subject A with a bigger weekly gap.
    - (b) With two exams, on `2026-11-12` and `2026-11-08`, the subject of the 11-08 exam wins.
    - (c) An exam on `2026-11-20` (17 days away) is ignored. The larger weekly remaining wins: A has goal 300 and 60 done; B has goal 120 and 0 done. A wins.
    - (d) On a tie, the subject never studied wins over one studied yesterday.
    - (e) Archived subjects are ignored.
    - (f) No active subjects returns `null`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. Weekly remaining is `max(0, weeklyGoalMin − done this week)`, where "this week" is from `weekStartKey(today)` to today.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: goal math and next-up suggestion`.

### Task 3: Streak

**Files:** Create `src/lib/streak.ts` and its test.

**Interfaces:**
- Produces: `computeStreak(sessions: Session[], todayKey: string, weekStart: number): { days: number; restDays: string[]; studiedToday: boolean }`

**Algorithm:**
- Start at today if today has study, otherwise at yesterday.
- Walk backwards:
  - A studied day adds 1.
  - An unstudied day becomes a rest day if its week (from `weekStartKey`) hasn't used one yet. Otherwise, stop.
- Stop before the earliest session day.
- Drop rest days that are older than the oldest studied day counted.

- [ ] **Step 1: Write failing tests.** Today is `2026-11-03`, `weekStart` is 6, and each study day is one 25-min session:
  - Studied 10-31 through 11-03: `{ days: 4, restDays: [], studiedToday: true }`.
  - Studied 11-01 and 11-02, nothing today: `{ days: 2, studiedToday: false }`.
  - Studied 10-31, 11-02 and 11-03: `{ days: 3, restDays: ['2026-11-01'] }`.
  - Studied 10-27, 10-28, 10-30, 10-31, 11-02 and 11-03: `{ days: 6, restDays: ['2026-11-01', '2026-10-29'] }`.
  - Studied 10-31 and 11-03 (two gaps in one week): `{ days: 1, restDays: [] }`.
  - Studied 10-31 and 11-01, with 11-02 empty and nothing today: `{ days: 2, restDays: ['2026-11-02'], studiedToday: false }`.
  - No sessions: `{ days: 0, restDays: [], studiedToday: false }`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the algorithm above.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: streak with weekly rest day`.

### Task 4: Stamina and timer math

**Files:** Create `src/lib/stamina.ts`, `src/lib/timer.ts` and tests.

**Interfaces:**
- Produces:

```ts
function stepUp(len: number, goal: number): number          // min(goal, len + max(2, round(len*0.1)))
function previousLevel(len: number, floor: number, goal: number): number // walk stepUp from floor; last level < len, else floor
function recordStaminaRound(s: Stamina, completed: boolean, goalMin: number, todayKey: string): { stamina: Stamina; event: 'up' | 'down' | null }
function elapsedSec(t: Timer, nowMs: number): number         // excludes pausedSec and any current pause; clamped to [0, plannedSec]
function remainingSec(t: Timer, nowMs: number): number
function timerEndMs(t: Timer): number                        // startedAt + plannedSec + pausedSec (ignores current pause)
function nextRound(t: Timer | null, nowMs: number, roundsPerSitting: number): number
```

- [ ] **Step 1: Write failing tests.**
  - Chaining `stepUp` from 25 with goal 50 gives `[28, 31, 34, 37, 41, 45, 50]`. `stepUp(50, 50)` is `50`.
  - `recordStaminaRound`:
    - Two completions at 25 leave the length at 25 with `completedAtLength: 2`.
    - A third completion gives length 28, `completedAtLength: 0`, `event: 'up'`, and a history entry `{ date: today, lengthMin: 28 }`.
    - At 50 with goal 50, three completions give `event: null` and the length stays 50.
    - Three early stops at 31 give 28 and `event: 'down'`.
    - Three early stops at 25 (the floor) give 25 and `event: null`.
    - A completion resets `earlyStopsInRow` to 0.
  - `previousLevel(31, 25, 50)` is 28. `previousLevel(25, 25, 50)` is 25.
  - `elapsedSec`: a timer started at 0 with `pausedSec` 60, read at 600 s, gives 540. A current pause started at 300 s, read at 600 s, gives 300 − 60 = 240. The result is clamped to `plannedSec`.
  - `nextRound`:
    - A break that ended 10 min ago gives `round + 1`.
    - A break that ended 16 min ago gives 1.
    - A `longBreak` gives 1. `null` gives 1.
    - When `round + 1 > roundsPerSitting`, it gives 1.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: stamina progression and timestamp timer math`.

### Task 5: Session flow (state transitions and reward events)

**Files:** Create `src/lib/flow.ts` and its test.

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces:

```ts
type RewardEvent =
  | { type: 'session'; minutes: number; completed: boolean }
  | { type: 'staminaUp' | 'staminaDown'; lengthMin: number }
  | { type: 'sittingDone'; rounds: number }
  | { type: 'dailyGoal'; subjectId: ID }
  | { type: 'streak'; days: number }
function startFocus(d: AppData, subjectId: ID, kind: TimerKind, minutes: number, nowMs: number): AppData // round = nextRound(d.timer, ...)
function completeFocus(d: AppData, nowMs: number, completed: boolean): { data: AppData; session: Session | null; events: RewardEvent[] }
function startBreak(d: AppData, round: number, nowMs: number): AppData   // after an early stop; longBreak if round === roundsPerSitting
function extendFocus(d: AppData, minutes: number, nowMs: number): AppData // "Keep going": replaces the current break with a 'quick' focus, same subject + same round; no-op if timer isn't a break
function resumeOnLoad(d: AppData, nowMs: number): { data: AppData; events: RewardEvent[] }
```

**`completeFocus` rules:**
- Log a session if `elapsedSec >= 60`. A completed session's duration is `plannedSec`. `parked` moves from the timer into the session.
- A `stamina` round runs `recordStaminaRound`.
- Completed: the timer becomes `break`, or `longBreak` when `round === roundsPerSitting`. The break keeps the same `round`. Emit `sittingDone` only for a last-round timer whose kind isn't `quick`, so an extension never celebrates twice.
- Early stop: the timer becomes `null`.
- Emit `dailyGoal` when this session takes the subject's minutes today from below `dailyGoalMin` (> 0) to at or above it.
- Emit `streak` when `computeStreak(...).days` is a milestone not yet in `seen.milestones`, then add it there.

- [ ] **Step 1: Write failing tests.**
  - A stamina round of 25 min, completed, logs a session with `durationSec: 1500` and `completed: true`. The timer is `break` with round 1, and the events include `{ type: 'session', minutes: 25, completed: true }`.
  - Stopping at 40 s logs no session and sets the timer to `null`.
  - Stopping at 14 min logs 840 s with `completed: false`, and `stamina.earlyStopsInRow` becomes 1.
  - Round 3 of 3, completed, gives a `longBreak` timer and `{ type: 'sittingDone', rounds: 3 }`. Then `extendFocus(…, 10)` gives a `quick` focus with round 3, and completing it gives a `longBreak` with no second `sittingDone`.
  - `extendFocus` on round 1's break gives a focus on the same subject with round 1, and the next `nextRound` after its break is 2.
  - A third completion emits `staminaUp` with 28.
  - Daily goal 60 with 45 min already today: a 25-min session emits `dailyGoal`. A second session afterwards doesn't.
  - Six prior study days plus today's first session emits `{ type: 'streak', days: 7 }` and `seen.milestones` includes 7. A second session the same day emits no streak event.
  - Parked thoughts `['email prof']` end up in `session.parked`.
  - `resumeOnLoad` with a focus timer that ended 2 hours ago logs one completed session at `plannedSec`, keeping the original `startedAt`. Calling it again on the result logs nothing new.
  - `resumeOnLoad` with a timer still running changes nothing.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. `resumeOnLoad` calls `completeFocus(d, timerEndMs(t), true)` when a focus timer has ended, and drops reward events older than 12 h except `session`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: focus/break flow with reward events`.

### Task 6: Exams and stats

**Files:** Create `src/lib/exams.ts`, `src/lib/stats.ts` and tests.

**Interfaces:**
- Produces:

```ts
function examPlan(e: Exam, sessions: Session[], todayKey: string): { daysLeft: number; hoursDone: number; hoursRemaining: number; dailyHours: number | null; state: 'upcoming' | 'today' | 'past' }
function heatmap(sessions: Session[], todayKey: string, weekStart: number): { key: string; minutes: number | null }[][] // 53 columns × 7 rows, row 0 = weekStart day, future = null
function weekBars(sessions: Session[], todayKey: string, weekStart: number): { key: string; minutes: number }[] // 7
function perSubject(sessions: Session[], fromKey: string, toKey: string): { subjectId: ID; minutes: number }[] // desc
function bestWindow(sessions: Session[]): { startHour: number; minutes: number } | null // best 2-hour window, minutes spread over the hours they cover
function totalMinutes(sessions: Session[]): number
```

- [ ] **Step 1: Write failing tests.**
  - `examPlan`:
    - Exam on `2026-11-13` with 20 h needed and `createdAt: 2026-10-20`. There are 5 h on that subject after `createdAt` and 3 h before it. Gives `{ daysLeft: 10, hoursDone: 5, hoursRemaining: 15, dailyHours: 1.5, state: 'upcoming' }`.
    - 1 h remaining over 3 days gives `dailyHours: 0.5`.
    - 0 h remaining gives `dailyHours: 0`.
    - An exam today gives `state: 'today'` and `dailyHours: null`.
    - Yesterday gives `state: 'past'`.
  - `heatmap`: 53 columns of 7. The first day of every column is a Saturday. The last column contains `2026-11-03`. Days after today are `null`.
  - `weekBars`: 7 entries starting `2026-10-31`.
  - `bestWindow`: three sessions at 20:00–20:50 and one at 08:00–08:25 give `startHour: 20`. `bestWindow([])` is `null`.
  - `totalMinutes`: sums `durationSec / 60`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement. `hoursDone` counts that subject's sessions with `startedAt >= createdAt`. `dailyHours` is `ceil(remaining / daysLeft × 4) / 4`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: exam plan and stats aggregations`.

### Task 7: Backup export and validated import

**Files:** Create `src/lib/backup.ts` and its test.

**Interfaces:**
- Produces:

```ts
function toBackup(d: AppData, now: Date): string  // JSON: { app: 'study-tracker', version: 1, exportedAt, data }
function backupFileName(now: Date): string        // 'study-backup-YYYY-MM-DD.json'
function parseBackup(text: string): { ok: true; data: AppData; counts: { subjects: number; sessions: number; exams: number } } | { ok: false; reason: string }
```

**Validation rules:**
- Every field has the right type.
- Numbers are finite and ≥ 0. `roundsPerSitting` is within 1–6 and `weekStart` within 0–6.
- Dates parse correctly.
- `session.subjectId` and `exam.subjectId` exist in `subjects`.
- `timer` is always reset to `null` on import.

**Exact error copy:**
- "This file isn't valid JSON."
- "This doesn't look like a backup from this app."
- "This backup is from a newer version of the app."
- "Something in this file doesn't look right ({where}). Nothing was changed."

- [ ] **Step 1: Write failing tests.**
  - A round trip of a populated `AppData` returns ok with counts `{ subjects: 2, sessions: 3, exams: 1 }`, and the data equals the input except for `timer: null`.
  - Each error case returns its exact reason: `'{'`, `'{"foo":1}'`, `version: 2`, a session with an unknown `subjectId`, `durationSec: -5`, and an exam with `date: 'soon'`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement as hand-written type guards, with no schema library.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: JSON backup with validated import`.

### Task 8: Store and safe persistence

**Files:** Create `src/lib/safeStorage.ts` and its test, and `src/store.ts`.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces:

```ts
// safeStorage.ts
type Notice = 'corrupt' | 'full'
function createSafeStorage(backend: Pick<Storage, 'getItem' | 'setItem'>, onNotice: (n: Notice) => void): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
// getItem: if the value doesn't JSON.parse → copy raw to `${k}:corrupt` and call onNotice('corrupt'), return null
// setItem: on throw (quota) → onNotice('full'); never rethrow
// store.ts
const useApp: UseBoundStore<StoreApi<AppData & UiState & Actions>>
interface UiState { rewards: RewardEvent[]; notice: Notice | null; lastSessionId: ID | null }
interface Actions {
  addSubject(i: Pick<Subject, 'name' | 'color' | 'icon' | 'dailyGoalMin' | 'weeklyGoalMin'>): ID
  updateSubject(id: ID, p: Partial<Omit<Subject, 'id' | 'createdAt'>>): void   // archive/restore via { archived }
  addSession(i: Omit<Session, 'id'>): void; updateSession(id: ID, p: Partial<Omit<Session, 'id'>>): void; deleteSession(id: ID): void
  addExam(i: Omit<Exam, 'id' | 'createdAt'>): void; updateExam(id: ID, p: Partial<Omit<Exam, 'id' | 'createdAt'>>): void; deleteExam(id: ID): void
  updateSettings(p: Partial<Settings>): void   // clamps stamina.lengthMin to [floorMin, staminaGoalMin]
  startFocus(subjectId: ID, kind: TimerKind, minutes: number): void
  pause(): void; resume(): void; parkThought(text: string): void; extend(minutes: number): void
  endFocus(completed: boolean): void           // completeFocus; pushes events to rewards; sets lastSessionId
  startBreak(round: number): void; endTimer(): void
  replaceAll(d: AppData): void; shiftReward(): void; dismissNotice(): void
}
```

- [ ] **Step 1: Write failing tests** in `safeStorage.test.ts`, using a Map-backed fake backend:
  - A corrupt value returns `null`, the raw value is stored under `study-tracker:corrupt`, and the notice is `'corrupt'`.
  - A throwing `setItem` gives the notice `'full'` and doesn't throw.
  - A valid value passes through.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `safeStorage.ts`. Then implement `store.ts` with `persist` (`name: 'study-tracker'`, `version: 1`, `partialize` to persist `AppData` only). Run `resumeOnLoad` in `onRehydrateStorage`. IDs come from `crypto.randomUUID()`.
- [ ] **Step 4:** Run `npm test && npm run typecheck`. Expected: PASS.
- [ ] **Step 5:** Commit: `feat: persisted store with corrupt/quota safety`.

---

**Before Task 9:** `docs/design/direction.md`, `system.md` and `motion.md` must exist. They come from the art-direction, design-system and motion steps. UI tasks follow those files for every color, font, spacing, radius, shadow, duration and easing. Don't invent values.

**Verification for each UI task:**
- `npm run typecheck && npm test && npm run build` passes.
- The listed behaviours check out in `npm run dev`, in both themes, at 1280px and 375px.
- Then commit.

### Task 9: Tokens, shell and primitives

**Files:**
- `src/styles/index.css` (Tailwind v4 `@theme` from system.md, light and dark via `[data-theme]` plus `prefers-color-scheme`)
- `src/app/App.tsx`, `src/app/useRoute.ts`
- `src/components/{Button,Dialog,Field,Ring,SubjectIcon,EmptyState,Toast}.tsx`
- `src/lib/palette.ts`: `SUBJECT_COLORS` (keys and values from system.md) and `SUBJECT_ICONS` (about 16 lucide names)
- Fonts: self-hosted (`@fontsource*`) per direction.md

**Interfaces:**
- `useRoute(): [route: 'today' | 'focus' | 'subjects' | 'log' | 'exams' | 'stats' | 'settings', go: (r) => void]`. Uses `useSyncExternalStore` on `hashchange`. An unknown hash goes to `today`.
- `<Ring value={number} size={number} stroke={number} color={string} label={string} />`. Values above 1 draw a second lap. It has `role="img"` and an `aria-label` such as "45 of 60 minutes".
- `<Dialog>` wraps native `<dialog>`, with focus return and Esc to close.

**Behaviours:**
- Sidebar at ≥ 768px, bottom tab bar below, no nav on Focus.
- The theme follows settings, with `system` following the OS.
- The `notice` banner shows "We couldn't read your saved data, so we started fresh. Your old data is safe to download." with a download button for the `:corrupt` key. For a full store: "Storage is full. Export a backup to be safe."

### Task 10: Today screen

**Files:** `src/screens/Today.tsx`, `src/components/SubjectPicker.tsx`

**Behaviours:**
- Greeting by time of day and name: "Good morning, {name}", or "Good morning" when there's no name.
- The big button reads `Start · {subject} · {staminaMin} min · round {n} of {rounds}`. One click calls `startFocus(nextUp.id, 'stamina', stamina.lengthMin)` and goes to Focus.
- The subject chip opens `SubjectPicker`. A "Just 5 minutes" link calls `startFocus(id, 'quick', 5)`.
- When a timer is active, the button becomes "Back to focus · mm:ss left", or during a break "Break · mm:ss · Back to it".
- Also on the screen: today's overall ring plus per-subject mini rings, the streak (with rest days noted gently), the next exam with days left and daily hours, and the stamina indicator (`28 → 50 min`).
- With no subjects, the empty state invites the user to add a first subject, with an inline quick-add (name, color).

### Task 11: Focus screen and ADHD helpers

**Files:** `src/screens/Focus.tsx`, `src/focus/useTabTitle.ts`, `src/focus/useWelcomeBack.ts`, `src/focus/alerts.ts`

**Interfaces:**
- `alerts.ts`: `playChime(): void` (two-tone Web Audio, no asset), `notify(title: string, body: string): void` (only when `Notification.permission === 'granted'`), `requestNotify(): Promise<NotificationPermission>`.

**Behaviours:**
- Full screen with the timer in tabular figures, subject, round dots, Pause/Resume (Space), Stop (opens the end view), Park a thought (`P`, then Enter to save) and Esc back to Today (the timer keeps running).
- Re-render once per second. Schedule a one-shot `setTimeout` for `timerEndMs` to end focus or alert the break end. A one-shot timeout isn't throttled like a chained interval in background tabs.
- The tab title shows `18:42 · Calculus` during focus, `Break · 3:10` during a break, and the app name when idle.
- Welcome back: when the tab was hidden for 30 s or more during focus, show "Welcome back. {m} min left." for 4 s. Nothing is counted.
- End view: the reward, an optional note saved to `lastSessionId`, parked thoughts listed, "Keep going +10" (`extend(10)`, which wraps `extendFocus`), and during a break "Back to it" / "Skip break".
- After an early stop, "Take a break" calls `startBreak(round)` and "Done for now" calls `endTimer`.
- Break end: chime (if enabled) plus a notification: "Break's over" / "Round {n} of {rounds} · {subject} is ready when you are."

### Task 12: Subjects screen

**Files:** `src/screens/Subjects.tsx`, `src/components/SubjectForm.tsx`

**Behaviours:**
- A list with a color dot or icon, name, and today and this-week rings.
- Add and edit in a Dialog: name (required, 1–40 chars), color from `SUBJECT_COLORS`, icon from `SUBJECT_ICONS`, daily and weekly goals in minutes (0–600 and 0–4200, shown as hours/min).
- Archive and restore. Archived subjects are collapsed under "Archived". Subjects are never hard-deleted.

### Task 13: Log screen

**Files:** `src/screens/Log.tsx`, `src/components/SessionForm.tsx`

**Behaviours:**
- Sessions grouped by day, newest first: "Today", "Yesterday", then dates. Each day shows its total.
- Each row shows the subject, start time, duration, note and parked thoughts.
- Edit and delete (with an undo toast for 5 s).
- "Add a session" for study done away from the app: subject, date, start time, minutes and note, saved with `completed: true`.
- The empty state invites the user to start a first session.

### Task 14: Exams screen

**Files:** `src/screens/Exams.tsx`, `src/components/ExamForm.tsx`

**Behaviours:**
- Upcoming exams sorted by date. Each card shows the subject, title, a big days-left figure, a progress bar for `hoursDone / hoursNeeded` and "About {dailyHours} h a day gets you there".
- Exam-day copy comes from the spec. Past exams sit in a collapsed "Done" list.
- Add, edit and delete with a confirm.

### Task 15: Stats screen

**Files:** `src/screens/Stats.tsx`, `src/components/Heatmap.tsx`, `src/components/WeekBars.tsx`

**Behaviours:**
- Total hours.
- Year heatmap (5 intensity steps from tokens; each cell has a tooltip/`title` like "Tue 3 Nov · 1 h 15 m"; the container is horizontally scrollable on phone and scrolled to today).
- This-week bars.
- Per subject for the last 30 days (horizontal bars in subject colors).
- Best focus time: "You focus best around 8–10 pm".
- Stamina card: the current length, the goal and the step-up history.
- Every chart has a text alternative (`aria-label` or a visually hidden table).

### Task 16: Settings, backup UI and PWA

**Files:** `src/screens/Settings.tsx`, `vite.config.ts` (add `VitePWA`), `public/` icons

**Behaviours:**
- Fields: name, break and long break lengths, rounds per sitting (1–6), stamina goal (floor–90), week start, theme, chime toggle and a notifications button.
- Export downloads `backupFileName(now)`.
- Import uses a file input, then `parseBackup`. On success it shows the counts in a confirm Dialog ("Replace your current data with 12 subjects, 340 sessions, 3 exams?") and calls `replaceAll`. On failure it shows the reason.
- PWA: `registerType: 'autoUpdate'`, a manifest with the name and colors from direction.md, and 192/512/maskable icons. The app works offline after the first load.

### Task 17: Reward moments

**Files:** `src/components/Rewards.tsx`, mounted in `App.tsx`

**Behaviours:**
- Consume `rewards` one at a time (`shiftReward`). Each event plays the treatment defined in motion.md:
  - Session finish
  - Stamina step-up (and a gentle copy-only step-down)
  - Sitting done
  - Daily goal ring closing
  - Streak milestone
- Under `prefers-reduced-motion`, show a static, still-satisfying version (a color and copy change, no movement).
- Rewards are announced through an `aria-live="polite"` region.

---

## Self-review notes

- **Spec coverage:**
  - Core loop: Tasks 5, 10 and 11
  - Next-up: Tasks 2 and 10
  - Stamina: Tasks 4, 5, 10 and 15
  - Sittings: Tasks 4, 5 and 11
  - Logging: Tasks 5 and 13
  - Goals: Tasks 2, 10 and 12
  - Streaks: Tasks 3, 5 and 10
  - Exams: Tasks 6 and 14
  - ADHD helpers: Tasks 10 and 11
  - Screens: Tasks 9–16
  - Error handling: Tasks 7, 8, 9 and 16
  - PWA: Task 16
  - Rewards: Task 17
- **Not covered by unit tests on purpose:** UI behaviour. It is verified per task in the browser, and then by the Playwright screenshot pass in the testing step.
