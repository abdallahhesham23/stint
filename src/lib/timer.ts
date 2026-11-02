import type { Timer } from './types'

const SITTING_GRACE_MS = 15 * 60_000

// Computed from timestamps, never from ticks, so background tabs and reloads stay exact.
export function elapsedSec(t: Timer, nowMs: number): number {
  const until = t.pausedAt ? Date.parse(t.pausedAt) : nowMs
  const raw = Math.floor((until - Date.parse(t.startedAt)) / 1000) - t.pausedSec
  return Math.max(0, Math.min(t.plannedSec, raw))
}

export function remainingSec(t: Timer, nowMs: number): number {
  return t.plannedSec - elapsedSec(t, nowMs)
}

export function timerEndMs(t: Timer): number {
  return Date.parse(t.startedAt) + (t.plannedSec + t.pausedSec) * 1000
}

/** The round the next focus starts at: the sitting continues only within 15 minutes of a short break ending. */
export function nextRound(t: Timer | null, nowMs: number, roundsPerSitting: number): number {
  if (!t || t.phase !== 'break' || nowMs > timerEndMs(t) + SITTING_GRACE_MS) return 1
  return t.round + 1 > roundsPerSitting ? 1 : t.round + 1
}
