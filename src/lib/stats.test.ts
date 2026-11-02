import { expect, test } from 'vitest'
import { weekday } from './dates'
import { bestWindow, heatmap, perSubject, totalMinutes, weekBars } from './stats'
import { mk } from './testkit'

const today = '2026-11-03'

test('heatmap is 53 week columns starting on Saturday, ending with this week', () => {
  const grid = heatmap([mk('a', '2026-11-02T10:00:00', 40)], today, 6)
  expect(grid).toHaveLength(53)
  expect(grid.every((col) => col.length === 7 && weekday(col[0].key) === 6)).toBe(true)
  const last = grid[52]
  expect(last.map((c) => c.key)).toContain(today)
  expect(last.find((c) => c.key === '2026-11-02')?.minutes).toBe(40)
  expect(last.find((c) => c.key === today)?.minutes).toBe(0)
  expect(last.find((c) => c.key === '2026-11-04')?.minutes).toBeNull()
})

test('weekBars covers this week from Saturday', () => {
  const bars = weekBars([mk('a', '2026-11-01T10:00:00', 25)], today, 6)
  expect(bars.map((b) => b.key)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'])
  expect(bars[1].minutes).toBe(25)
})

test('perSubject sorts by minutes in range', () => {
  const s = [mk('a', '2026-11-01T10:00:00', 25), mk('b', '2026-11-01T11:00:00', 50), mk('a', '2026-09-01T10:00:00', 500)]
  expect(perSubject(s, '2026-10-05', today)).toEqual([
    { subjectId: 'b', minutes: 50 },
    { subjectId: 'a', minutes: 25 },
  ])
})

test('bestWindow finds the strongest two hours', () => {
  const s = ['10-30', '10-31', '11-01'].map((d) => mk('a', `2026-${d}T20:00:00`, 50)).concat(mk('a', '2026-11-02T08:00:00', 25))
  expect(bestWindow(s)).toEqual({ startHour: 20, minutes: 150 })
  expect(bestWindow([])).toBeNull()
})

test('totalMinutes sums durations', () => {
  expect(totalMinutes([mk('a', '2026-11-01T10:00:00', 25), mk('b', '2026-11-01T11:00:00', 50)])).toBe(75)
})
