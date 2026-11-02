import { expect, test } from 'vitest'
import { examPlan } from './exams'
import { exam, mk } from './testkit'

const today = '2026-11-03'

test('plan counts only study since the exam was added and rounds daily hours up to 0.25', () => {
  const sessions = [mk('calc', '2026-10-25T10:00:00', 300), mk('calc', '2026-10-19T10:00:00', 180), mk('other', '2026-10-25T12:00:00', 600)]
  expect(examPlan(exam('calc', '2026-11-13'), sessions, today)).toEqual({
    daysLeft: 10,
    hoursDone: 5,
    hoursRemaining: 15,
    dailyHours: 1.5,
    state: 'upcoming',
  })
})

test('small remainders round up, and nothing left is zero', () => {
  expect(examPlan(exam('calc', '2026-11-06', { hoursNeeded: 1 }), [], today).dailyHours).toBe(0.5)
  const done = [mk('calc', '2026-10-25T10:00:00', 1500)]
  expect(examPlan(exam('calc', '2026-11-06'), done, today)).toMatchObject({ hoursRemaining: 0, dailyHours: 0 })
})

test('exam day and past exams have no daily suggestion', () => {
  expect(examPlan(exam('calc', today), [], today)).toMatchObject({ state: 'today', daysLeft: 0, dailyHours: null })
  expect(examPlan(exam('calc', '2026-11-02'), [], today)).toMatchObject({ state: 'past', dailyHours: null })
})
