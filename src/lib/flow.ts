import { dayKey } from './dates'
import { minutesBySubject } from './goals'
import { recordStaminaRound } from './stamina'
import { computeStreak } from './streak'
import { elapsedSec, nextRound, timerEndMs } from './timer'
import type { AppData, ID, Session, Timer, TimerKind } from './types'

export type RewardEvent =
  | { type: 'session'; minutes: number; completed: boolean }
  | { type: 'staminaUp' | 'staminaDown'; lengthMin: number }
  | { type: 'sittingDone'; rounds: number }
  | { type: 'dailyGoal'; subjectId: ID }
  | { type: 'streak'; days: number }

export const MILESTONES = [3, 7, 14, 30, 50, 100]
const MIN_LOGGED_SEC = 60
const STALE_REWARD_MS = 12 * 3_600_000

const iso = (ms: number) => new Date(ms).toISOString()

function focusTimer(subjectId: ID, kind: TimerKind, minutes: number, round: number, nowMs: number): Timer {
  return { phase: 'focus', subjectId, startedAt: iso(nowMs), plannedSec: minutes * 60, round, pausedAt: null, pausedSec: 0, kind, parked: [] }
}

function breakTimer(d: AppData, subjectId: ID, round: number, kind: TimerKind, nowMs: number): Timer {
  const long = round >= d.settings.roundsPerSitting
  const minutes = long ? d.settings.longBreakMin : d.settings.breakMin
  return { ...focusTimer(subjectId, kind, minutes, round, nowMs), phase: long ? 'longBreak' : 'break' }
}

export function startFocus(d: AppData, subjectId: ID, kind: TimerKind, minutes: number, nowMs: number): AppData {
  const round = nextRound(d.timer, nowMs, d.settings.roundsPerSitting)
  return { ...d, timer: focusTimer(subjectId, kind, minutes, round, nowMs) }
}

/** "Keep going": swap the break that just started for a short focus on the same subject and round. */
export function extendFocus(d: AppData, minutes: number, nowMs: number): AppData {
  const t = d.timer
  if (!t || t.phase === 'focus') return d
  return { ...d, timer: focusTimer(t.subjectId, 'quick', minutes, t.round, nowMs) }
}

export function startBreak(d: AppData, subjectId: ID, round: number, nowMs: number): AppData {
  return { ...d, timer: breakTimer(d, subjectId, round, 'stamina', nowMs) }
}

export function completeFocus(
  d: AppData,
  nowMs: number,
  completed: boolean,
): { data: AppData; session: Session | null; events: RewardEvent[] } {
  const t = d.timer
  if (!t || t.phase !== 'focus') return { data: d, session: null, events: [] }

  const today = dayKey(new Date(nowMs))
  const durationSec = completed ? t.plannedSec : elapsedSec(t, nowMs)
  const events: RewardEvent[] = []
  let next: AppData = { ...d }

  const session: Session | null =
    durationSec >= MIN_LOGGED_SEC
      ? { id: crypto.randomUUID(), subjectId: t.subjectId, startedAt: t.startedAt, durationSec, plannedSec: t.plannedSec, completed, note: '', parked: t.parked }
      : null

  if (session) {
    events.push({ type: 'session', minutes: Math.round(durationSec / 60), completed })
    const subject = d.subjects.find((s) => s.id === t.subjectId)
    const day = dayKey(new Date(session.startedAt))
    const before = minutesBySubject(d.sessions, day, day)[t.subjectId] ?? 0
    if (subject && subject.dailyGoalMin > 0 && before < subject.dailyGoalMin && before + durationSec / 60 >= subject.dailyGoalMin) {
      events.push({ type: 'dailyGoal', subjectId: subject.id })
    }
    next.sessions = [...d.sessions, session]
    const { days } = computeStreak(next.sessions, today, d.settings.weekStart)
    if (MILESTONES.includes(days) && !d.seen.milestones.includes(days)) {
      events.push({ type: 'streak', days })
      next.seen = { milestones: [...d.seen.milestones, days] }
    }
  }

  if (t.kind === 'stamina') {
    const r = recordStaminaRound(d.stamina, completed, d.settings.staminaGoalMin, today)
    next.stamina = r.stamina
    if (r.event) events.push({ type: r.event === 'up' ? 'staminaUp' : 'staminaDown', lengthMin: r.stamina.lengthMin })
  }

  if (completed) {
    next.timer = breakTimer(d, t.subjectId, t.round, t.kind, nowMs)
    if (next.timer.phase === 'longBreak' && t.kind !== 'quick') events.push({ type: 'sittingDone', rounds: t.round })
  } else {
    next.timer = null
  }

  return { data: next, session, events }
}

/** On app load: a focus round that ran out while the app was closed is logged once, at its planned length. */
export function resumeOnLoad(d: AppData, nowMs: number): { data: AppData; events: RewardEvent[] } {
  const t = d.timer
  if (!t || t.phase !== 'focus' || t.pausedAt || nowMs < timerEndMs(t)) return { data: d, events: [] }
  const endMs = timerEndMs(t)
  const r = completeFocus(d, endMs, true)
  const stale = nowMs - endMs > STALE_REWARD_MS
  return { data: r.data, events: stale ? r.events.filter((e) => e.type === 'session') : r.events }
}
