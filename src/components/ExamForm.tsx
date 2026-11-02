import { useState, type FormEvent } from 'react'
import { useApp } from '../store'
import { Dialog } from './Dialog'
import { addDays, dayKey } from '../lib/dates'
import type { Exam } from '../lib/types'

export function ExamForm({ exam, onClose }: { exam: Exam | 'new' | null; onClose: () => void }) {
  return (
    <Dialog open={exam !== null} onClose={onClose} title={exam === 'new' ? 'Add an exam' : 'Edit exam'}>
      {exam !== null && <Fields key={exam === 'new' ? 'new' : exam.id} exam={exam === 'new' ? null : exam} onClose={onClose} />}
    </Dialog>
  )
}

function Fields({ exam, onClose }: { exam: Exam | null; onClose: () => void }) {
  const subjects = useApp((s) => s.subjects).filter((x) => !x.archived || x.id === exam?.subjectId)
  const { addExam, updateExam, deleteExam } = useApp.getState()
  const [subjectId, setSubjectId] = useState(exam?.subjectId ?? subjects[0]?.id ?? '')
  const [title, setTitle] = useState(exam?.title ?? 'Midterm')
  const [date, setDate] = useState(exam?.date ?? addDays(dayKey(new Date()), 14))
  const [hoursNeeded, setHours] = useState(String(exam?.hoursNeeded ?? 15))
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const h = Number(hoursNeeded)
    if (!subjectId) return setError('Pick a subject.')
    if (!title.trim()) return setError('Give the exam a name, like Midterm.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Pick the exam date.')
    if (!(h >= 0 && h <= 500)) return setError('Hours go from 0 to 500.')
    const values = { subjectId, title: title.trim().slice(0, 60), date, hoursNeeded: Math.round(h * 2) / 2 }
    if (exam) updateExam(exam.id, values)
    else addExam(values)
    onClose()
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor="e-subject" className="label">
          Subject
        </label>
        <select id="e-subject" className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="e-title" className="label">
          Exam
        </label>
        <input id="e-title" className="input" value={title} maxLength={60} placeholder="Final" onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="e-date" className="label">
            Date
          </label>
          <input id="e-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="e-hours" className="label">
            Hours to be ready
          </label>
          <input id="e-hours" className="input num" type="number" inputMode="decimal" min={0} max={500} step={0.5} value={hoursNeeded} onChange={(e) => setHours(e.target.value)} aria-describedby="e-hours-help" />
        </div>
      </div>
      <p id="e-hours-help" className="meta -mt-3">
        A rough guess is fine. Study you log for this subject from today counts toward it.
      </p>
      {error && (
        <p role="alert" className="text-sm text-negative -mt-2">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {exam &&
          (confirming ? (
            <span className="mr-auto flex items-center gap-3 text-sm">
              Delete this exam?
              <button
                type="button"
                className="link text-negative"
                onClick={() => {
                  deleteExam(exam.id)
                  onClose()
                }}
              >
                Delete
              </button>
              <button type="button" className="link" onClick={() => setConfirming(false)}>
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" className="link mr-auto text-negative" onClick={() => setConfirming(true)}>
              Delete exam
            </button>
          ))}
        <button type="button" className="btn btn-ghost ml-auto" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {exam ? 'Save' : 'Add exam'}
        </button>
      </div>
    </form>
  )
}
