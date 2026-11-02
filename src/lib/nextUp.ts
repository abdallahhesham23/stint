import { daysBetween, weekStartKey } from './dates'
import { minutesBySubject } from './goals'
import type { Exam, Session, Subject } from './types'

const SOON_DAYS = 14

/** The subject the big Start button suggests: nearest exam within 14 days, else largest weekly gap, else least recently studied. */
export function pickNextUp(
  subjects: Subject[],
  sessions: Session[],
  exams: Exam[],
  todayKey: string,
  weekStart: number,
): Subject | null {
  const active = subjects.filter((s) => !s.archived)
  if (!active.length) return null
  const byId = new Map(active.map((s) => [s.id, s]))

  let soonest: { subject: Subject; days: number } | null = null
  for (const e of exams) {
    const subject = byId.get(e.subjectId)
    const days = daysBetween(todayKey, e.date)
    if (!subject || days < 0 || days > SOON_DAYS) continue
    if (!soonest || days < soonest.days) soonest = { subject, days }
  }
  if (soonest) return soonest.subject

  const week = minutesBySubject(sessions, weekStartKey(todayKey, weekStart), todayKey)
  const lastStudied = new Map<string, string>()
  for (const s of sessions) if ((lastStudied.get(s.subjectId) ?? '') < s.startedAt) lastStudied.set(s.subjectId, s.startedAt)

  const remaining = (s: Subject) => Math.max(0, s.weeklyGoalMin - (week[s.id] ?? 0))
  return active.toSorted(
    (a, b) => remaining(b) - remaining(a) || (lastStudied.get(a.id) ?? '').localeCompare(lastStudied.get(b.id) ?? ''),
  )[0]
}
