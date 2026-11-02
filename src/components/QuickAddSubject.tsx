import { useState, type FormEvent } from 'react'
import { useApp } from '../store'
import { SUBJECT_COLORS } from '../lib/palette'

/** One field and a button: the fastest way from an empty app to a first session. */
export function QuickAddSubject({ className = '' }: { className?: string }) {
  const count = useApp((s) => s.subjects.length)
  const addSubject = useApp((s) => s.addSubject)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give it a name, like Calculus II.')
    addSubject({ name: trimmed.slice(0, 40), color: SUBJECT_COLORS[count % SUBJECT_COLORS.length], icon: 'book-open', dailyGoalMin: 60, weeklyGoalMin: 300 })
    setName('')
    setError('')
  }

  return (
    <form onSubmit={submit} className={`flex flex-col sm:flex-row gap-3 ${className}`} noValidate>
      <div className="flex-1">
        <label htmlFor="quick-subject" className="sr-only">
          Course name
        </label>
        <input
          id="quick-subject"
          className="input"
          placeholder="Calculus II"
          value={name}
          maxLength={40}
          aria-invalid={!!error}
          aria-describedby={error ? 'quick-subject-error' : undefined}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
        {error && (
          <p id="quick-subject-error" className="meta mt-2 !text-negative">
            {error}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn-primary h-11">
        Add subject
      </button>
    </form>
  )
}
