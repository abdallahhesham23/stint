import type { Stamina } from './types'

const ROUNDS_PER_LEVEL = 3

export function stepUp(len: number, goal: number): number {
  return Math.min(goal, len + Math.max(2, Math.round(len * 0.1)))
}

export function previousLevel(len: number, floor: number, goal: number): number {
  let prev = floor
  for (let level = floor; level < len; ) {
    prev = level
    const next = stepUp(level, goal)
    if (next === level) break
    level = next
  }
  return prev
}

/** The ladder of lengths from floor to goal, for the stamina indicator. */
export function ladder(floor: number, goal: number): number[] {
  const out = [floor]
  while (out[out.length - 1] < goal) out.push(stepUp(out[out.length - 1], goal))
  return out
}

export function recordStaminaRound(
  s: Stamina,
  completed: boolean,
  goalMin: number,
  todayKey: string,
): { stamina: Stamina; event: 'up' | 'down' | null } {
  if (completed) {
    const done = Math.min(ROUNDS_PER_LEVEL, s.completedAtLength + 1)
    if (done < ROUNDS_PER_LEVEL || s.lengthMin >= goalMin) {
      return { stamina: { ...s, completedAtLength: done, earlyStopsInRow: 0 }, event: null }
    }
    const lengthMin = stepUp(s.lengthMin, goalMin)
    return {
      stamina: { ...s, lengthMin, completedAtLength: 0, earlyStopsInRow: 0, history: [...s.history, { date: todayKey, lengthMin }] },
      event: 'up',
    }
  }
  const stops = Math.min(ROUNDS_PER_LEVEL, s.earlyStopsInRow + 1)
  if (stops < ROUNDS_PER_LEVEL || s.lengthMin <= s.floorMin) {
    return { stamina: { ...s, earlyStopsInRow: stops }, event: null }
  }
  const lengthMin = previousLevel(s.lengthMin, s.floorMin, goalMin)
  return {
    stamina: { ...s, lengthMin, completedAtLength: 0, earlyStopsInRow: 0, history: [...s.history, { date: todayKey, lengthMin }] },
    event: 'down',
  }
}
