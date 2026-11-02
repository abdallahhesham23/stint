import { expect, test } from 'vitest'
import { clock, dayLabel, duration, greeting, hourRange } from './format'

test('clock shows mm:ss, and h:mm:ss past an hour', () => {
  expect(clock(1500)).toBe('25:00')
  expect(clock(59)).toBe('00:59')
  expect(clock(3725)).toBe('1:02:05')
  expect(clock(-3)).toBe('00:00')
})

test('duration reads like a person would say it', () => {
  expect(duration(0)).toBe('0 min')
  expect(duration(25)).toBe('25 min')
  expect(duration(60)).toBe('1 h')
  expect(duration(75.4)).toBe('1 h 15 min')
  expect(duration(59.6)).toBe('1 h')
  expect(duration(1.75 * 60)).toBe('1 h 45 min')
})

test('greeting follows the time of day', () => {
  expect(greeting(8)).toBe('Good morning')
  expect(greeting(14)).toBe('Good afternoon')
  expect(greeting(19)).toBe('Good evening')
  expect(greeting(2)).toBe('Hello')
})

test('dayLabel says Today and Yesterday, then a short date', () => {
  expect(dayLabel('2026-11-03', '2026-11-03')).toBe('Today')
  expect(dayLabel('2026-11-02', '2026-11-03')).toBe('Yesterday')
  expect(dayLabel('2026-10-27', '2026-11-03')).toBe('Tue 27 Oct')
})

test('hourRange names a two-hour window', () => {
  expect(hourRange(20)).toBe('8–10 pm')
  expect(hourRange(11)).toBe('11 am–1 pm')
  expect(hourRange(23)).toBe('11 pm–1 am')
  expect(hourRange(0)).toBe('12–2 am')
})
