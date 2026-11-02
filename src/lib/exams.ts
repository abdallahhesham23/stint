import { daysBetween } from './dates'
import type { Exam, Session } from './types'

export interface ExamPlan {
  daysLeft: number
  hoursDone: number
  hoursRemaining: number
  dailyHours: number | null
  state: 'upcoming' | 'today' | 'past'
}

export function examPlan(e: Exam, sessions: Session[], todayKey: string): ExamPlan {
  const daysLeft = daysBetween(todayKey, e.date)
  const createdMs = Date.parse(e.createdAt)
  let seconds = 0
  for (const s of sessions) if (s.subjectId === e.subjectId && Date.parse(s.startedAt) >= createdMs) seconds += s.durationSec
  const hoursDone = seconds / 3600
  const hoursRemaining = Math.max(0, e.hoursNeeded - hoursDone)
  const state = daysLeft < 0 ? 'past' : daysLeft === 0 ? 'today' : 'upcoming'
  // Rounded up to the quarter hour; the epsilon keeps float noise (3.0000001) from adding a quarter.
  const dailyHours = state === 'upcoming' ? Math.ceil((hoursRemaining / daysLeft) * 4 - 1e-9) / 4 : null
  return { daysLeft, hoursDone, hoursRemaining, dailyHours, state }
}
