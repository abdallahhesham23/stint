import { expect, test } from 'vitest'
import { backupFileName, parseBackup, toBackup } from './backup'
import { exam, mk, subj } from './testkit'
import { defaultData, type AppData } from './types'

const now = new Date('2026-11-03T18:00:00')
const populated = (): AppData => ({
  ...defaultData(),
  subjects: [subj('calc'), subj('chem', { archived: true })],
  sessions: [mk('calc', '2026-11-01T10:00:00', 25), mk('calc', '2026-11-02T10:00:00', 28, { parked: ['email prof'] }), mk('chem', '2026-11-02T12:00:00', 14, { completed: false })],
  exams: [exam('calc', '2026-11-13')],
  timer: { phase: 'focus', subjectId: 'calc', startedAt: now.toISOString(), plannedSec: 1500, round: 1, pausedAt: null, pausedSec: 0, kind: 'stamina', parked: [] },
})
const wrap = (data: unknown, extra: object = {}) => JSON.stringify({ app: 'study-tracker', version: 1, exportedAt: now.toISOString(), data, ...extra })
const broken = "Something in this file doesn't look right"

test('a backup round-trips, with the running timer cleared', () => {
  const r = parseBackup(toBackup(populated(), now))
  expect(r).toEqual({ ok: true, data: { ...populated(), timer: null }, counts: { subjects: 2, sessions: 3, exams: 1 } })
})

test('file name uses the local date', () => {
  expect(backupFileName(now)).toBe('study-backup-2026-11-03.json')
})

test('rejects text that is not JSON', () => {
  expect(parseBackup('{')).toEqual({ ok: false, reason: "This file isn't valid JSON." })
})

test('rejects JSON from somewhere else', () => {
  expect(parseBackup('{"foo":1}')).toEqual({ ok: false, reason: "This doesn't look like a backup from this app." })
})

test('rejects a backup from a newer version', () => {
  expect(parseBackup(wrap(populated(), { version: 2 }))).toEqual({ ok: false, reason: 'This backup is from a newer version of the app.' })
})

test('rejects a session pointing at a subject that is not in the file', () => {
  const d = populated()
  d.sessions[1].subjectId = 'ghost'
  const r = parseBackup(wrap(d))
  expect(r.ok).toBe(false)
  expect(!r.ok && r.reason).toBe(`${broken} (session 2). Nothing was changed.`)
})

test('rejects negative durations and bad exam dates', () => {
  const neg = populated()
  neg.sessions[0].durationSec = -5
  expect(parseBackup(wrap(neg))).toEqual({ ok: false, reason: `${broken} (session 1). Nothing was changed.` })
  const bad = populated()
  bad.exams[0].date = 'soon'
  expect(parseBackup(wrap(bad))).toEqual({ ok: false, reason: `${broken} (exam 1). Nothing was changed.` })
})
