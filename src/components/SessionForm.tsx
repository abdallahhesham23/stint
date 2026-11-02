import { useState, type FormEvent } from 'react'
import { useApp } from '../store'
import { Dialog } from './Dialog'
import { toast } from './toast'
import { dayKey } from '../lib/dates'
import { timeOfDay } from '../lib/format'
import type { Session } from '../lib/types'

export function SessionForm({ session, onClose }: { session: Session | 'new' | null; onClose: () => void }) {
  return (
    <Dialog open={session !== null} onClose={onClose} title={session === 'new' ? 'Add a session' : 'Edit session'}>
      {session !== null && <Fields key={session === 'new' ? 'new' : session.id} session={session === 'new' ? null : session} onClose={onClose} />}
    </Dialog>
  )
}

function Fields({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const subjects = useApp((s) => s.subjects)
  const { addSession, updateSession, deleteSession } = useApp.getState()
  const start = session ? new Date(session.startedAt) : new Date(Date.now() - 30 * 60_000)
  const [subjectId, setSubjectId] = useState(session?.subjectId ?? subjects.find((s) => !s.archived)?.id ?? '')
  const [date, setDate] = useState(dayKey(start))
  const [time, setTime] = useState(timeOfDay(start.toISOString()))
  const [minutes, setMinutes] = useState(String(session ? Math.round(session.durationSec / 60) : 25))
  const [note, setNote] = useState(session?.note ?? '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const min = Math.round(Number(minutes))
    const startedAt = new Date(`${date}T${time}`)
    if (!subjectId) return setError('Pick a subject.')
    if (!(min >= 1 && min <= 600)) return setError('Minutes go from 1 to 600.')
    if (Number.isNaN(startedAt.getTime())) return setError('Check the date and start time.')
    if (startedAt.getTime() > Date.now()) return setError('That start time is still ahead. Pick one that has happened.')
    const values = { subjectId, startedAt: startedAt.toISOString(), durationSec: min * 60, note: note.trim() }
    if (session) updateSession(session.id, values)
    else addSession({ ...values, plannedSec: min * 60, completed: true, parked: [] })
    onClose()
  }

  const remove = () => {
    if (!session) return
    deleteSession(session.id)
    toast('Session deleted.', { label: 'Undo', run: () => useApp.setState((s) => ({ sessions: [...s.sessions, session] })) })
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="ss-subject" className="label">
          Subject
        </label>
        <select id="ss-subject" className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects
            .filter((s) => !s.archived || s.id === subjectId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="ss-date" className="label">
            Date
          </label>
          <input id="ss-date" className="input" type="date" value={date} max={dayKey(new Date())} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ss-time" className="label">
            Started at
          </label>
          <input id="ss-time" className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label htmlFor="ss-min" className="label">
            Minutes
          </label>
          <input id="ss-min" className="input num" type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
      </div>
      <div>
        <label htmlFor="ss-note" className="label">
          What you covered <span className="text-muted font-normal">Optional</span>
        </label>
        <textarea id="ss-note" className="input" rows={2} maxLength={500} placeholder="Read chapter 4, made flashcards" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-negative -mt-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {session && (
          <button type="button" className="link mr-auto text-negative" onClick={remove}>
            Delete session
          </button>
        )}
        <button type="button" className="btn btn-ghost ml-auto" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {session ? 'Save' : 'Add session'}
        </button>
      </div>
    </form>
  )
}
