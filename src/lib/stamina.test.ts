import { expect, test } from 'vitest'
import { recordStaminaRound, stepUp } from './stamina'
import { defaultData, type Stamina } from './types'

const base = (): Stamina => defaultData().stamina
const today = '2026-11-03'
const run = (s: Stamina, results: boolean[]) => {
  let state = s
  let event: 'up' | null = null
  for (const done of results) ({ stamina: state, event } = recordStaminaRound(state, done, 50, today))
  return { stamina: state, event }
}

test('stepUp ladder from 25 to the goal of 50', () => {
  const ladder: number[] = []
  for (let len = 25; len < 50; ) ladder.push((len = stepUp(len, 50)))
  expect(ladder).toEqual([28, 31, 34, 37, 41, 45, 50])
  expect(stepUp(50, 50)).toBe(50)
})

test('three completed rounds step up and log history', () => {
  expect(run(base(), [true, true]).stamina).toMatchObject({ lengthMin: 25, completedAtLength: 2 })
  const { stamina, event } = run(base(), [true, true, true])
  expect(event).toBe('up')
  expect(stamina).toMatchObject({ lengthMin: 28, completedAtLength: 0, history: [{ date: today, lengthMin: 28 }] })
})

test('no step past the goal', () => {
  const { stamina, event } = run({ ...base(), lengthMin: 50 }, [true, true, true])
  expect(event).toBeNull()
  expect(stamina.lengthMin).toBe(50)
})

test('early stops never lower the length or erase progress at this length', () => {
  const r = run({ ...base(), lengthMin: 31, completedAtLength: 2 }, [false, false, false, false])
  expect(r.event).toBeNull()
  expect(r.stamina).toMatchObject({ lengthMin: 31, completedAtLength: 2 })
})

test('an early stop between completions still lets the third completion step up', () => {
  expect(run(base(), [true, false, true, true]).event).toBe('up')
})
