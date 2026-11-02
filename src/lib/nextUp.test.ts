import { expect, test } from 'vitest'
import { pickNextUp } from './nextUp'
import { exam, mk, subj } from './testkit'

const today = '2026-11-03'

test('a subject with an exam within 14 days beats a bigger weekly gap', () => {
  const subjects = [subj('A', { weeklyGoalMin: 600 }), subj('B', { weeklyGoalMin: 60 })]
  expect(pickNextUp(subjects, [], [exam('B', '2026-11-10')], today, 6)?.id).toBe('B')
})

test('the closest exam wins', () => {
  const subjects = [subj('A'), subj('B')]
  const exams = [exam('A', '2026-11-12'), exam('B', '2026-11-08')]
  expect(pickNextUp(subjects, [], exams, today, 6)?.id).toBe('B')
})

test('exams more than 14 days away are ignored; largest weekly remaining wins', () => {
  const subjects = [subj('A', { weeklyGoalMin: 300 }), subj('B', { weeklyGoalMin: 120 })]
  const sessions = [mk('A', '2026-11-02T10:00:00', 60)]
  const exams = [exam('B', '2026-11-20')]
  expect(pickNextUp(subjects, sessions, exams, today, 6)?.id).toBe('A')
})

test('ties go to the subject studied least recently, never-studied first', () => {
  const subjects = [subj('A'), subj('B')]
  const sessions = [mk('A', '2026-11-02T10:00:00', 25)]
  expect(pickNextUp(subjects, sessions, [], today, 6)?.id).toBe('B')
})

test('archived subjects are ignored, and none active gives null', () => {
  const subjects = [subj('A', { archived: true, weeklyGoalMin: 600 }), subj('B')]
  expect(pickNextUp(subjects, [], [exam('A', '2026-11-05')], today, 6)?.id).toBe('B')
  expect(pickNextUp([subj('A', { archived: true })], [], [], today, 6)).toBeNull()
})
