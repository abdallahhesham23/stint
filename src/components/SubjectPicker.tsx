import { Check } from 'lucide-react'
import { Dialog } from './Dialog'
import { SubjectIcon } from './SubjectIcon'
import { colorVar } from '../lib/palette'
import type { Subject } from '../lib/types'

interface Props {
  open: boolean
  subjects: Subject[]
  current: string
  onPick: (id: string) => void
  onClose: () => void
}

export function SubjectPicker({ open, subjects, current, onPick, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Study something else">
      <ul className="flex flex-col gap-1 -mx-2">
        {subjects.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="row-hover w-full flex items-center gap-3 h-12 px-3 rounded-card text-left text-[15px]"
              aria-pressed={s.id === current}
              onClick={() => onPick(s.id)}
            >
              <SubjectIcon icon={s.icon} size={18} color={colorVar(s.color)} />
              <span className="flex-1 truncate">{s.name}</span>
              {s.id === current && <Check size={18} strokeWidth={1.75} className="text-accent" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
