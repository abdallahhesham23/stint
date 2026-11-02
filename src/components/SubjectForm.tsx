import { useState, type FormEvent } from 'react'
import { useApp } from '../store'
import { Dialog } from './Dialog'
import { SUBJECT_ICONS, SubjectIcon } from './SubjectIcon'
import { toast } from './toast'
import { SUBJECT_COLORS, colorVar } from '../lib/palette'
import type { Subject } from '../lib/types'

const COLOR_NAMES: Record<string, string> = { ocean: 'Ocean', moss: 'Moss', amber: 'Amber', rose: 'Rose', rust: 'Rust', slate: 'Slate', sand: 'Sand', charcoal: 'Charcoal' }

export function SubjectForm({ subject, onClose }: { subject: Subject | 'new' | null; onClose: () => void }) {
  return (
    <Dialog open={subject !== null} onClose={onClose} title={subject === 'new' ? 'Add a subject' : 'Edit subject'}>
      {subject !== null && <Fields key={subject === 'new' ? 'new' : subject.id} subject={subject === 'new' ? null : subject} onClose={onClose} />}
    </Dialog>
  )
}

function Fields({ subject, onClose }: { subject: Subject | null; onClose: () => void }) {
  const { addSubject, updateSubject } = useApp.getState()
  const count = useApp((s) => s.subjects.length)
  const [name, setName] = useState(subject?.name ?? '')
  const [color, setColor] = useState(subject?.color ?? SUBJECT_COLORS[count % SUBJECT_COLORS.length])
  const [icon, setIcon] = useState(subject?.icon ?? 'book-open')
  const [daily, setDaily] = useState(String(subject?.dailyGoalMin ?? 60))
  const [weekly, setWeekly] = useState(String((subject?.weeklyGoalMin ?? 300) / 60))
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give it a name, like Calculus II.')
    const values = {
      name: trimmed.slice(0, 40),
      color,
      icon,
      dailyGoalMin: Math.min(600, Math.max(0, Math.round(Number(daily) || 0))),
      weeklyGoalMin: Math.min(4200, Math.max(0, Math.round((Number(weekly) || 0) * 60))),
    }
    if (subject) updateSubject(subject.id, values)
    else addSubject(values)
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="s-name" className="label">
          Name
        </label>
        <input
          id="s-name"
          className="input"
          value={name}
          maxLength={40}
          placeholder="Organic Chemistry"
          aria-invalid={!!error}
          aria-describedby={error ? 's-name-error' : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
        {error && (
          <p id="s-name-error" className="meta mt-2 !text-negative">
            {error}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="label">Colour</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_COLORS.map((c) => (
            <label key={c} className="relative grid place-items-center size-10 rounded-full has-[:checked]:bg-active" title={COLOR_NAMES[c]}>
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="peer absolute inset-0 opacity-0" aria-label={COLOR_NAMES[c]} />
              <span className="size-6 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" style={{ background: colorVar(c) }} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Icon</legend>
        <div className="grid grid-cols-8 gap-1">
          {Object.keys(SUBJECT_ICONS).map((k) => (
            <label key={k} className="relative grid place-items-center h-10 rounded-input text-muted has-[:checked]:bg-active has-[:checked]:text-ink">
              <input type="radio" name="icon" value={k} checked={icon === k} onChange={() => setIcon(k)} className="peer absolute inset-0 opacity-0" aria-label={k.replace('-', ' ')} />
              <span className="grid place-items-center size-8 rounded-[10px] peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                <SubjectIcon icon={k} size={18} color={icon === k ? colorVar(color) : undefined} />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="s-daily" className="label">
            Daily goal
          </label>
          <div className="relative">
            <input id="s-daily" className="input num pr-14" type="number" inputMode="numeric" min={0} max={600} step={5} value={daily} onChange={(e) => setDaily(e.target.value)} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 meta">min</span>
          </div>
        </div>
        <div>
          <label htmlFor="s-weekly" className="label">
            Weekly goal
          </label>
          <div className="relative">
            <input id="s-weekly" className="input num pr-14" type="number" inputMode="decimal" min={0} max={70} step={0.5} value={weekly} onChange={(e) => setWeekly(e.target.value)} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 meta">hours</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {subject && (
          <button
            type="button"
            className="link mr-auto"
            onClick={() => {
              updateSubject(subject.id, { archived: !subject.archived })
              toast(`${subject.name} archived. Its sessions stay in your log.`, { label: 'Undo', run: () => updateSubject(subject.id, { archived: false }) })
              onClose()
            }}
          >
            Archive
          </button>
        )}
        <button type="button" className="btn btn-ghost ml-auto" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {subject ? 'Save' : 'Add subject'}
        </button>
      </div>
    </form>
  )
}
