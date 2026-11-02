import { expect, test } from 'vitest'
import { addDays, dayKey, daysBetween, weekStartKey } from './dates'

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
