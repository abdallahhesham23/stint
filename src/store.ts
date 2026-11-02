import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { completeFocus, extendFocus, resumeOnLoad, startBreak, startFocus, type RewardEvent } from './lib/flow'
import { createSafeStorage, type Notice } from './lib/safeStorage'
import { defaultData, type AppData, type Exam, type ID, type Session, type Settings, type Subject, type TimerKind } from './lib/types'

export const STORAGE_KEY = 'study-tracker'

interface UiState {
  rewards: RewardEvent[]
  notice: Notice | null
  lastSessionId: ID | null
}

interface Actions {
  addSubject(i: Pick<Subject, 'name' | 'color' | 'icon' | 'dailyGoalMin' | 'weeklyGoalMin'>): ID
  updateSubject(id: ID, p: Partial<Omit<Subject, 'id' | 'createdAt'>>): void
  addSession(i: Omit<Session, 'id'>): void
  updateSession(id: ID, p: Partial<Omit<Session, 'id'>>): void
  deleteSession(id: ID): void
  addExam(i: Omit<Exam, 'id' | 'createdAt'>): void
  updateExam(id: ID, p: Partial<Omit<Exam, 'id' | 'createdAt'>>): void
  deleteExam(id: ID): void
  updateSettings(p: Partial<Settings>): void
  startFocus(subjectId: ID, kind: TimerKind, minutes: number): void
  pause(): void
  resume(): void
  parkThought(text: string): void
  extend(minutes: number): void
  endFocus(completed: boolean): void
  startBreak(subjectId: ID, round: number): void
  endTimer(): void
  resumeOnLoad(): void
  replaceAll(d: AppData): void
  shiftReward(): void
  dismissNotice(): void
}

export type AppState = AppData & UiState & Actions

const iso = (ms: number) => new Date(ms).toISOString()
const uuid = () => crypto.randomUUID()

export function dataOf(s: AppData): AppData {
  const { version, subjects, sessions, exams, settings, stamina, timer, seen } = s
  return { version, subjects, sessions, exams, settings, stamina, timer, seen }
}

// Notices can fire while the store is still being created (sync hydration), so they are applied a tick later.
const notify = (notice: Notice) => queueMicrotask(() => useApp.setState({ notice }))

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...defaultData(),
      rewards: [],
      notice: null,
      lastSessionId: null,

      addSubject(i) {
        const id = uuid()
        set((s) => ({ subjects: [...s.subjects, { ...i, id, archived: false, createdAt: iso(Date.now()) }] }))
        return id
      },
      updateSubject: (id, p) => set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      addSession: (i) => set((s) => ({ sessions: [...s.sessions, { ...i, id: uuid() }] })),
      updateSession: (id, p) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),
      addExam: (i) => set((s) => ({ exams: [...s.exams, { ...i, id: uuid(), createdAt: iso(Date.now()) }] })),
      updateExam: (id, p) => set((s) => ({ exams: s.exams.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      deleteExam: (id) => set((s) => ({ exams: s.exams.filter((x) => x.id !== id) })),

      updateSettings: (p) =>
        set((s) => {
          const settings = { ...s.settings, ...p }
          const lengthMin = Math.max(s.stamina.floorMin, Math.min(s.stamina.lengthMin, settings.staminaGoalMin))
          return { settings, stamina: { ...s.stamina, lengthMin } }
        }),

      startFocus: (subjectId, kind, minutes) => set((s) => startFocus(dataOf(s), subjectId, kind, minutes, Date.now())),
      pause: () => set((s) => (s.timer && !s.timer.pausedAt ? { timer: { ...s.timer, pausedAt: iso(Date.now()) } } : {})),
      resume: () =>
        set((s) => {
          const t = s.timer
          if (!t?.pausedAt) return {}
          const pausedSec = t.pausedSec + Math.round((Date.now() - Date.parse(t.pausedAt)) / 1000)
          return { timer: { ...t, pausedAt: null, pausedSec } }
        }),
      parkThought: (text) => set((s) => (s.timer ? { timer: { ...s.timer, parked: [...s.timer.parked, text] } } : {})),
      extend: (minutes) => set((s) => extendFocus(dataOf(s), minutes, Date.now())),
      endFocus: (completed) =>
        set((s) => {
          const r = completeFocus(dataOf(s), Date.now(), completed)
          return { ...r.data, rewards: [...s.rewards, ...r.events], lastSessionId: r.session?.id ?? null }
        }),
      startBreak: (subjectId, round) => set((s) => startBreak(dataOf(s), subjectId, round, Date.now())),
      endTimer: () => set({ timer: null }),
      resumeOnLoad: () =>
        set((s) => {
          const d = dataOf(s)
          const r = resumeOnLoad(d, Date.now())
          return r.data === d ? {} : { ...r.data, rewards: [...s.rewards, ...r.events] }
        }),
      replaceAll: (d) => set({ ...dataOf(d), timer: null }),
      shiftReward: () => set((s) => ({ rewards: s.rewards.slice(1) })),
      dismissNotice: () => set({ notice: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => createSafeStorage(localStorage, notify)),
      partialize: (s) => dataOf(s),
      // Older or partial saves get today's defaults for anything they lack.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>
        return { ...current, ...p, settings: { ...current.settings, ...p.settings }, stamina: { ...current.stamina, ...p.stamina } }
      },
    },
  ),
)
