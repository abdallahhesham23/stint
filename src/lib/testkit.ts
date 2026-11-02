// Test-only builders. Not imported by app code.
import type { Exam, Session, Subject } from './types'

export function mk(subjectId: string, startedAt: string, min: number, extra: Partial<Session> = {}): Session {
  return {
    id: `${subjectId}-${startedAt}`,
    subjectId,
    startedAt: new Date(startedAt).toISOString(),
    durationSec: min * 60,
    plannedSec: min * 60,
    completed: true,
    note: '',
    parked: [],
    ...extra,
  }
}

export function subj(id: string, extra: Partial<Subject> = {}): Subject {
  return {
    id,
    name: id,
    color: 'ocean',
    icon: 'book-open',
    dailyGoalMin: 0,
    weeklyGoalMin: 0,
    archived: false,
    createdAt: '2026-09-01T08:00:00.000Z',
    ...extra,
  }
}

export function exam(subjectId: string, date: string, extra: Partial<Exam> = {}): Exam {
  return {
    id: `exam-${subjectId}-${date}`,
    subjectId,
    title: 'Midterm',
    date,
    hoursNeeded: 20,
    createdAt: '2026-10-20T08:00:00.000Z',
    ...extra,
  }
}
