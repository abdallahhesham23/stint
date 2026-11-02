import { dayKey } from './dates'
import type { AppData } from './types'

const APP = 'study-tracker'
const VERSION = 1

export function toBackup(d: AppData, now: Date): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: now.toISOString(), data: d }, null, 2)
}

export function backupFileName(now: Date): string {
  return `study-backup-${dayKey(now)}.json`
}

type Parsed = { ok: true; data: AppData; counts: { subjects: number; sessions: number; exams: number } } | { ok: false; reason: string }

// A trust boundary: every field of an imported file is checked before it can replace the user's data.
const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown) => typeof v === 'string'
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0
const int = (v: unknown, lo: number, hi: number) => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi
const instant = (v: unknown) => str(v) && !Number.isNaN(Date.parse(v as string))
const day = (v: unknown) => str(v) && /^\d{4}-\d{2}-\d{2}$/.test(v as string) && instant(v)
const strings = (v: unknown) => Array.isArray(v) && v.every(str)

export function parseBackup(text: string): Parsed {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return { ok: false, reason: "This file isn't valid JSON." }
  }
  if (!obj(file) || file.app !== APP || !obj(file.data) || typeof file.version !== 'number') {
    return { ok: false, reason: "This doesn't look like a backup from this app." }
  }
  if (file.version > VERSION) return { ok: false, reason: 'This backup is from a newer version of the app.' }

  const d = file.data
  const fail = (where: string): Parsed => ({ ok: false, reason: `Something in this file doesn't look right (${where}). Nothing was changed.` })
  if (!Array.isArray(d.subjects) || !Array.isArray(d.sessions) || !Array.isArray(d.exams)) return fail('lists')

  const ids = new Set<string>()
  for (const [i, s] of d.subjects.entries()) {
    const ok = obj(s) && str(s.id) && str(s.name) && str(s.color) && str(s.icon) && num(s.dailyGoalMin) && num(s.weeklyGoalMin) && typeof s.archived === 'boolean' && instant(s.createdAt)
    if (!ok) return fail(`subject ${i + 1}`)
    ids.add(s.id as string)
  }
  for (const [i, s] of d.sessions.entries()) {
    const ok = obj(s) && str(s.id) && ids.has(s.subjectId as string) && instant(s.startedAt) && num(s.durationSec) && num(s.plannedSec) && typeof s.completed === 'boolean' && str(s.note) && strings(s.parked)
    if (!ok) return fail(`session ${i + 1}`)
  }
  for (const [i, e] of d.exams.entries()) {
    const ok = obj(e) && str(e.id) && ids.has(e.subjectId as string) && str(e.title) && day(e.date) && num(e.hoursNeeded) && instant(e.createdAt)
    if (!ok) return fail(`exam ${i + 1}`)
  }

  const s = d.settings
  const settingsOk = obj(s) && str(s.name) && num(s.breakMin) && num(s.longBreakMin) && int(s.roundsPerSitting, 1, 6) && num(s.staminaGoalMin) && int(s.weekStart, 0, 6) && ['system', 'light', 'dark'].includes(s.theme as string) && typeof s.chime === 'boolean'
  if (!settingsOk) return fail('settings')

  const st = d.stamina
  const staminaOk = obj(st) && num(st.lengthMin) && num(st.floorMin) && num(st.completedAtLength) && num(st.earlyStopsInRow) && Array.isArray(st.history) && st.history.every((h) => obj(h) && day(h.date) && num(h.lengthMin))
  if (!staminaOk) return fail('focus stamina')

  if (!obj(d.seen) || !Array.isArray(d.seen.milestones) || !d.seen.milestones.every((m) => num(m))) return fail('milestones')

  const data = { ...(d as unknown as AppData), version: VERSION, timer: null } as AppData
  return { ok: true, data, counts: { subjects: d.subjects.length, sessions: d.sessions.length, exams: d.exams.length } }
}
