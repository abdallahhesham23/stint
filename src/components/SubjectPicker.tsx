import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { useApp } from '../store'
import { Dialog } from './Dialog'
import { SubjectIcon } from './SubjectIcon'
import { duration } from '../lib/format'
import { minutesBySubject } from '../lib/goals'
import { colorVar } from '../lib/palette'
import type { Subject } from '../lib/types'

interface Props {
  open: boolean
  subjects: Subject[]
  current: string
  today: string
  onPick: (id: string) => void
  onClose: () => void
}

export function SubjectPicker({ open, subjects, current, today, onPick, onClose }: Props) {
  const sessions = useApp((s) => s.sessions)
  const done = useMemo(() => minutesBySubject(sessions, today, today), [sessions, today])
  return (
    <Dialog open={open} onClose={onClose} title="Study something else">
      <ul className="flex flex-col gap-1 -mx-2">
        {subjects.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="row-hover w-full flex items-center gap-3 min-h-14 px-3 py-2 rounded-card text-left"
              aria-pressed={s.id === current}
              onClick={() => onPick(s.id)}
            >
              <SubjectIcon icon={s.icon} size={18} color={colorVar(s.color)} />
              <span className="flex-1 min-w-0">
                <span className="block text-base truncate">{s.name}</span>
                <span className="block meta num">
                  {duration(done[s.id] ?? 0)}
                  {s.dailyGoalMin ? ` of ${duration(s.dailyGoalMin)}` : ''} today
                </span>
              </span>
              {s.id === current && <Check size={18} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
