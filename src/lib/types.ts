export type ID = string

export interface Subject {
  id: ID
  name: string
  color: string // key into SUBJECT_COLORS
  icon: string // key into SUBJECT_ICONS
  dailyGoalMin: number
  weeklyGoalMin: number
  archived: boolean
  createdAt: string
}

export interface Session {
  id: ID
  subjectId: ID
  startedAt: string // ISO instant
  durationSec: number
  plannedSec: number
  completed: boolean
  note: string
  parked: string[]
}

export interface Exam {
  id: ID
  subjectId: ID
  title: string
  date: string // YYYY-MM-DD
  hoursNeeded: number
  createdAt: string
}

export interface Settings {
  name: string
  breakMin: number
  longBreakMin: number
  roundsPerSitting: number
  staminaGoalMin: number
  weekStart: number // 0-6, 6 = Saturday
  theme: 'system' | 'light' | 'dark'
  chime: boolean
}

export interface Stamina {
  lengthMin: number
  floorMin: number
  completedAtLength: number
  earlyStopsInRow: number
  history: { date: string; lengthMin: number }[]
}

export type TimerKind = 'stamina' | 'quick' | 'custom'

export interface Timer {
  phase: 'focus' | 'break' | 'longBreak'
  subjectId: ID
  startedAt: string
  plannedSec: number
  round: number
  pausedAt: string | null
  pausedSec: number
  kind: TimerKind
  parked: string[]
}

export interface AppData {
  version: 1
  subjects: Subject[]
  sessions: Session[]
  exams: Exam[]
  settings: Settings
  stamina: Stamina
  timer: Timer | null
  seen: { milestones: number[] }
}

export function defaultData(): AppData {
  return {
    version: 1,
    subjects: [],
    sessions: [],
    exams: [],
    settings: {
      name: '',
      breakMin: 5,
      longBreakMin: 15,
      roundsPerSitting: 3,
      staminaGoalMin: 50,
      weekStart: 6,
      theme: 'system',
      chime: true,
    },
    stamina: { lengthMin: 25, floorMin: 25, completedAtLength: 0, earlyStopsInRow: 0, history: [] },
    timer: null,
    seen: { milestones: [] },
  }
}
