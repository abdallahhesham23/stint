import { expect, test } from 'vitest'
import { completeFocus, extendFocus, resumeOnLoad, startBreak, startFocus } from './flow'
import { ladder } from './stamina'
import { nextRound } from './timer'
import { mk, subj } from './testkit'
import { defaultData, type AppData } from './types'

const T0 = Date.parse('2026-11-03T18:00:00')
const min = (m: number) => m * 60_000
const base = (extra: Partial<AppData> = {}): AppData => ({
  ...defaultData(),
  subjects: [subj('calc', { dailyGoalMin: 60 })],
  ...extra,
})
const go = (d: AppData, kind: 'stamina' | 'quick' = 'stamina', m = 25) => startFocus(d, 'calc', kind, m, T0)

test('ladder lists every rung from floor to goal', () => {
  expect(ladder(25, 50)).toEqual([25, 28, 31, 34, 37, 41, 45, 50])
})

test('a completed stamina round logs its planned length and starts a break', () => {
  const r = completeFocus(go(base()), T0 + min(25), true)
  expect(r.session).toMatchObject({ subjectId: 'calc', durationSec: 1500, plannedSec: 1500, completed: true })
  expect(r.data.sessions).toHaveLength(1)
  expect(r.data.timer).toMatchObject({ phase: 'break', round: 1, plannedSec: 300 })
  expect(r.events).toContainEqual({ type: 'session', minutes: 25, completed: true })
})

test('stopping under a minute logs nothing and clears the timer', () => {
  const r = completeFocus(go(base()), T0 + 40_000, false)
  expect(r.session).toBeNull()
  expect(r.data.timer).toBeNull()
})

test('stopping early still logs the time and counts an early stop', () => {
  const r = completeFocus(go(base()), T0 + min(14), false)
  expect(r.session).toMatchObject({ durationSec: 840, completed: false })
  expect(r.data.stamina.earlyStopsInRow).toBe(1)
})

test('the last round of a sitting ends in a long break, and an extension never celebrates twice', () => {
  const afterRound2 = base({
    timer: { ...go(base()).timer!, phase: 'break', round: 2, startedAt: new Date(T0 - min(6)).toISOString(), plannedSec: 300 },
  })
  const third = go(afterRound2)
  expect(third.timer?.round).toBe(3)
  const done = completeFocus(third, T0 + min(25), true)
  expect(done.data.timer).toMatchObject({ phase: 'longBreak', plannedSec: 900 })
  expect(done.events).toContainEqual({ type: 'sittingDone', rounds: 3 })

  const extended = extendFocus(done.data, 10, T0 + min(26))
  expect(extended.timer).toMatchObject({ phase: 'focus', kind: 'quick', round: 3, plannedSec: 600 })
  const again = completeFocus(extended, T0 + min(36), true)
  expect(again.data.timer?.phase).toBe('longBreak')
  expect(again.events.some((e) => e.type === 'sittingDone')).toBe(false)
})

test('extending round 1 keeps the round, and the sitting continues at round 2', () => {
  const brk = completeFocus(go(base()), T0 + min(25), true).data
  const ext = extendFocus(brk, 10, T0 + min(26))
  expect(ext.timer).toMatchObject({ phase: 'focus', subjectId: 'calc', round: 1 })
  const brk2 = completeFocus(ext, T0 + min(36), true).data
  expect(nextRound(brk2.timer, T0 + min(41), 3)).toBe(2)
})

test('the third completed round steps stamina up', () => {
  const d = base({ stamina: { ...defaultData().stamina, completedAtLength: 2 } })
  expect(completeFocus(go(d), T0 + min(25), true).events).toContainEqual({ type: 'staminaUp', lengthMin: 28 })
})

test('crossing the daily goal emits dailyGoal once', () => {
  const d = base({ sessions: [mk('calc', '2026-11-03T10:00:00', 45)] })
  const first = completeFocus(go(d), T0 + min(25), true)
  expect(first.events).toContainEqual({ type: 'dailyGoal', subjectId: 'calc' })
  const second = completeFocus(startFocus(first.data, 'calc', 'stamina', 25, T0 + min(40)), T0 + min(65), true)
  expect(second.events.some((e) => e.type === 'dailyGoal')).toBe(false)
})

test('a streak milestone fires once and is remembered', () => {
  const prior = ['10-28', '10-29', '10-30', '10-31', '11-01', '11-02'].map((d) => mk('calc', `2026-${d}T10:00:00`, 25))
  const first = completeFocus(go(base({ sessions: prior })), T0 + min(25), true)
  expect(first.events).toContainEqual({ type: 'streak', days: 7 })
  expect(first.data.seen.milestones).toContain(7)
  const second = completeFocus(startFocus(first.data, 'calc', 'stamina', 25, T0 + min(40)), T0 + min(65), true)
  expect(second.events.some((e) => e.type === 'streak')).toBe(false)
})

test('parked thoughts travel into the session', () => {
  const d = go(base())
  d.timer!.parked = ['email prof']
  expect(completeFocus(d, T0 + min(25), true).session?.parked).toEqual(['email prof'])
})

test('startBreak after an early stop uses the long break on the last round', () => {
  expect(startBreak(base(), 'calc', 1, T0).timer).toMatchObject({ phase: 'break', subjectId: 'calc', round: 1 })
  expect(startBreak(base(), 'calc', 3, T0).timer).toMatchObject({ phase: 'longBreak', plannedSec: 900 })
})

test('resumeOnLoad logs a focus round that ended while away exactly once', () => {
  const d = go(base())
  const r = resumeOnLoad(d, T0 + min(145))
  expect(r.data.sessions).toHaveLength(1)
  expect(r.data.sessions[0]).toMatchObject({ durationSec: 1500, completed: true, startedAt: d.timer!.startedAt })
  expect(resumeOnLoad(r.data, T0 + min(150)).data.sessions).toHaveLength(1)
})

test('resumeOnLoad leaves a running timer alone', () => {
  const d = go(base())
  expect(resumeOnLoad(d, T0 + min(10)).data).toBe(d)
})
