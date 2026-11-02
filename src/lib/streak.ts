import { addDays, dayKey, weekStartKey } from './dates'
import type { Session } from './types'

export interface Streak {
  days: number
  restDays: string[]
  studiedToday: boolean
}

/** Consecutive study days back from today. One empty day per week is forgiven as a rest day; today never breaks it. */
export function computeStreak(sessions: Session[], todayKey: string, weekStart: number): Streak {
  const studied = new Set(sessions.map((s) => dayKey(new Date(s.startedAt))))
  const studiedToday = studied.has(todayKey)
  if (!studied.size) return { days: 0, restDays: [], studiedToday }

  const earliest = [...studied].reduce((a, b) => (a < b ? a : b))
  const usedWeeks = new Set<string>()
  const restDays: string[] = []
  let days = 0
  let oldestCounted = ''

  for (let d = studiedToday ? todayKey : addDays(todayKey, -1); d >= earliest; d = addDays(d, -1)) {
    if (studied.has(d)) {
      days++
      oldestCounted = d
      continue
    }
    const week = weekStartKey(d, weekStart)
    if (usedWeeks.has(week)) break
    usedWeeks.add(week)
    restDays.push(d)
  }

  return { days, restDays: restDays.filter((r) => oldestCounted && r > oldestCounted), studiedToday }
}
