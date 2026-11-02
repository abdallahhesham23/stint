import { expect, test } from 'vitest'
import { minutesBySubject, progress } from './goals'
import { mk } from './testkit'

test('minutesBySubject counts sessions by local start day, inclusive', () => {
  const sessions = [mk('a', '2026-11-02T23:50:00', 30), mk('a', '2026-11-03T09:00:00', 25)]
  expect(minutesBySubject(sessions, '2026-11-03', '2026-11-03')).toEqual({ a: 25 })
  expect(minutesBySubject(sessions, '2026-11-02', '2026-11-03')).toEqual({ a: 55 })
})

test('progress is 0 for a zero goal and may exceed 1', () => {
  expect(progress(30, 0)).toBe(0)
  expect(progress(90, 60)).toBe(1.5)
})
