import { dayKey } from './dates'
import type { ID, Session } from './types'

export function sessionDay(s: Session): string {
  return dayKey(new Date(s.startedAt))
}

/** Minutes per subject for sessions whose local start day is in [fromKey, toKey]. */
export function minutesBySubject(sessions: Session[], fromKey: string, toKey: string): Record<ID, number> {
  const out: Record<ID, number> = {}
  for (const s of sessions) {
    const day = sessionDay(s)
    if (day < fromKey || day > toKey) continue
    out[s.subjectId] = (out[s.subjectId] ?? 0) + s.durationSec / 60
  }
  return out
}

export function progress(doneMin: number, goalMin: number): number {
  return goalMin > 0 ? doneMin / goalMin : 0
}
