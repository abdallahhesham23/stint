import { expect, test } from 'vitest'
import { elapsedSec, nextRound, remainingSec, timerEndMs } from './timer'
import type { Timer } from './types'

const t = (extra: Partial<Timer> = {}): Timer => ({
  phase: 'focus',
  subjectId: 'a',
  startedAt: new Date(0).toISOString(),
  plannedSec: 1500,
  round: 1,
  pausedAt: null,
  pausedSec: 0,
  kind: 'stamina',
  parked: [],
  ...extra,
})
const s = (sec: number) => sec * 1000

test('elapsedSec excludes finished pauses and a pause in progress, clamped to plannedSec', () => {
  expect(elapsedSec(t({ pausedSec: 60 }), s(600))).toBe(540)
  expect(elapsedSec(t({ pausedSec: 60, pausedAt: new Date(s(300)).toISOString() }), s(600))).toBe(240)
  expect(elapsedSec(t(), s(5000))).toBe(1500)
  expect(remainingSec(t(), s(600))).toBe(900)
})

test('timerEndMs adds paused time', () => {
  expect(timerEndMs(t({ pausedSec: 60 }))).toBe(s(1560))
})

test('nextRound continues a sitting only within 15 minutes of a break ending', () => {
  const brk = t({ phase: 'break', plannedSec: 300, round: 1 }) // ends at 300 s
  expect(nextRound(brk, s(300 + 600), 3)).toBe(2)
  expect(nextRound(brk, s(300 + 960), 3)).toBe(1)
  expect(nextRound(t({ phase: 'longBreak', plannedSec: 900, round: 3 }), s(1000), 3)).toBe(1)
  expect(nextRound(null, s(0), 3)).toBe(1)
  expect(nextRound(t({ phase: 'break', plannedSec: 300, round: 3 }), s(400), 3)).toBe(1)
})
