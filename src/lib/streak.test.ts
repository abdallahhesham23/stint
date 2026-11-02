import { expect, test } from 'vitest'
import { computeStreak } from './streak'
import { mk } from './testkit'

const today = '2026-11-03' // Tuesday; week starts Saturday 10-31
const days = (...keys: string[]) => keys.map((k) => mk('a', `${k}T10:00:00`, 25))

test('consecutive days including today', () => {
  expect(computeStreak(days('2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'), today, 6)).toEqual({
    days: 4,
    restDays: [],
    studiedToday: true,
  })
})

test('today in progress never breaks the streak', () => {
  expect(computeStreak(days('2026-11-01', '2026-11-02'), today, 6)).toMatchObject({ days: 2, studiedToday: false })
})

test('one gap in a week becomes a rest day', () => {
  expect(computeStreak(days('2026-10-31', '2026-11-02', '2026-11-03'), today, 6)).toMatchObject({
    days: 3,
    restDays: ['2026-11-01'],
  })
})

test('one rest day per week, across two weeks', () => {
  const s = days('2026-10-27', '2026-10-28', '2026-10-30', '2026-10-31', '2026-11-02', '2026-11-03')
  expect(computeStreak(s, today, 6)).toMatchObject({ days: 6, restDays: ['2026-11-01', '2026-10-29'] })
})

test('a second gap in the same week ends the streak and the unused rest day is dropped', () => {
  expect(computeStreak(days('2026-10-31', '2026-11-03'), today, 6)).toMatchObject({ days: 1, restDays: [] })
})

test('yesterday empty and today not yet studied: yesterday is a rest day', () => {
  expect(computeStreak(days('2026-10-31', '2026-11-01'), today, 6)).toEqual({
    days: 2,
    restDays: ['2026-11-02'],
    studiedToday: false,
  })
})

test('no sessions', () => {
  expect(computeStreak([], today, 6)).toEqual({ days: 0, restDays: [], studiedToday: false })
})
