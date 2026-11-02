import { addDays, weekStartKey } from './dates'
import { minutesBySubject, sessionDay } from './goals'
import type { ID, Session } from './types'

function minutesByDay(sessions: Session[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const s of sessions) out.set(sessionDay(s), (out.get(sessionDay(s)) ?? 0) + s.durationSec / 60)
  return out
}

/** 53 week columns, row 0 = the week's first day; days after today are null. */
export function heatmap(sessions: Session[], todayKey: string, weekStart: number): { key: string; minutes: number | null }[][] {
  const byDay = minutesByDay(sessions)
  const start = addDays(weekStartKey(todayKey, weekStart), -52 * 7)
  return Array.from({ length: 53 }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      const key = addDays(start, c * 7 + r)
      return { key, minutes: key > todayKey ? null : (byDay.get(key) ?? 0) }
    }),
  )
}

export function weekBars(sessions: Session[], todayKey: string, weekStart: number): { key: string; minutes: number }[] {
  const byDay = minutesByDay(sessions)
  const start = weekStartKey(todayKey, weekStart)
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(start, i)
    return { key, minutes: byDay.get(key) ?? 0 }
  })
}

export function perSubject(sessions: Session[], fromKey: string, toKey: string): { subjectId: ID; minutes: number }[] {
  return Object.entries(minutesBySubject(sessions, fromKey, toKey))
    .map(([subjectId, minutes]) => ({ subjectId, minutes }))
    .toSorted((a, b) => b.minutes - a.minutes)
}

/** The two consecutive hours of the day holding the most study minutes, spread over the hours each session covers. */
export function bestWindow(sessions: Session[]): { startHour: number; minutes: number } | null {
  const hours = new Array<number>(24).fill(0)
  for (const s of sessions) {
    const start = Date.parse(s.startedAt)
    for (let m = 0; m < Math.round(s.durationSec / 60); m++) hours[new Date(start + m * 60_000).getHours()]++
  }
  let best: { startHour: number; minutes: number } | null = null
  for (let h = 0; h < 24; h++) {
    const minutes = hours[h] + hours[(h + 1) % 24]
    // Ties go to the window that starts on the busier hour, so "8–10 pm" beats "7–9 pm" for 8 pm sessions.
    if (minutes > 0 && (!best || minutes > best.minutes || (minutes === best.minutes && hours[h] > hours[best.startHour]))) {
      best = { startHour: h, minutes }
    }
  }
  return best
}

export function totalMinutes(sessions: Session[]): number {
  return sessions.reduce((sum, s) => sum + s.durationSec / 60, 0)
}
