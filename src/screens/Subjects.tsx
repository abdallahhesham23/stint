import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useApp } from '../store'
import { useNow } from '../app/useNow'
import { Page, TitleRow } from '../app/Shell'
import { Ring } from '../components/Ring'
import { Dur } from '../components/Dur'
import { SubjectIcon } from '../components/SubjectIcon'
import { SubjectForm } from '../components/SubjectForm'
import { QuickAddSubject } from '../components/QuickAddSubject'
import { beginFocus } from '../focus/begin'
import { dayKey, weekStartKey } from '../lib/dates'
import { examPlan } from '../lib/exams'
import { duration } from '../lib/format'
import { minutesBySubject, progress } from '../lib/goals'
import { colorVar } from '../lib/palette'
import type { Subject } from '../lib/types'

export function Subjects() {
  const now = useNow(false)
  const today = dayKey(new Date(now))
  const subjects = useApp((s) => s.subjects)
  const sessions = useApp((s) => s.sessions)
  const exams = useApp((s) => s.exams)
  const weekStart = useApp((s) => s.settings.weekStart)
  const updateSubject = useApp((s) => s.updateSubject)
  const staminaMin = useApp((s) => s.stamina.lengthMin)
  const busy = useApp((s) => !!s.timer)
  const [editing, setEditing] = useState<Subject | 'new' | null>(null)

  const active = subjects.filter((s) => !s.archived)
  const archived = subjects.filter((s) => s.archived)
  const todayMin = useMemo(() => minutesBySubject(sessions, today, today), [sessions, today])
  const weekMin = useMemo(() => minutesBySubject(sessions, weekStartKey(today, weekStart), today), [sessions, today, weekStart])

  return (
    <Page>
      <TitleRow
        title="Subjects"
        line={active.length ? `${active.length} ${active.length === 1 ? 'course' : 'courses'} this term` : 'Add the courses you’re taking this term.'}
        action={
          <button type="button" className="btn btn-secondary" onClick={() => setEditing('new')}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add a subject
          </button>
        }
      />

      {active.length ? (
        <ul className={`grid gap-4 sm:grid-cols-2 ${active.length % 3 === 0 || active.length > 4 ? "lg:grid-cols-3" : ""}`}>
          {active.map((s) => {
            const done = todayMin[s.id] ?? 0
            const week = weekMin[s.id] ?? 0
            const exam = exams.filter((e) => e.subjectId === s.id && e.date >= today).toSorted((a, b) => a.date.localeCompare(b.date))[0]
            const plan = exam && examPlan(exam, sessions, today)
            return (
              <li key={s.id} className="panel flex flex-col gap-5">
                <div className="flex items-center gap-2.5">
                  <SubjectIcon icon={s.icon} size={18} color={colorVar(s.color)} />
                  <h2 className="text-base font-medium flex-1 truncate">{s.name}</h2>
                  <button type="button" className="btn-icon -my-2 -mr-2" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                    <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <Ring value={progress(done, s.dailyGoalMin)} size={48} stroke={5} color={colorVar(s.color)} label={`${Math.round(done)} of ${s.dailyGoalMin} minutes today`} />
                  <div>
                    <Dur min={done} className="text-2xl num leading-7 block" />
                    <p className="meta mt-0.5">{s.dailyGoalMin ? `of ${duration(s.dailyGoalMin)} today` : 'today'}</p>
                  </div>
                </div>
                <div>
                  <div className="h-1.5 rounded-full bg-track overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, progress(week, s.weeklyGoalMin) * 100)}%`, background: colorVar(s.color) }} />
                  </div>
                  <p className="meta mt-2 num">
                    This week {duration(week)}
                    {s.weeklyGoalMin ? ` of ${duration(s.weeklyGoalMin)}` : ''}
                    {plan && plan.state !== 'past' ? ` · ${exam.title} ${plan.state === 'today' ? 'today' : `in ${plan.daysLeft} ${plan.daysLeft === 1 ? 'day' : 'days'}`}` : ''}
                  </p>
                </div>
                {!busy && (
                  <button type="button" className="btn btn-secondary h-10 self-start mt-auto" onClick={() => beginFocus(s.id, 'stamina', staminaMin)}>
                    Study this · {staminaMin} min
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="panel max-w-2xl">
          <h2 className="text-base font-medium">Start with one course</h2>
          <p className="mt-1 text-base text-muted">Give it a name now. You can pick a colour, an icon and goals any time.</p>
          <QuickAddSubject className="mt-5" />
        </section>
      )}

      {archived.length > 0 && (
        <details className="mt-10 group">
          <summary className="section-title inline-flex items-center gap-2 py-2">Archived ({archived.length})</summary>
          <ul className="mt-3 panel !py-2 divide-y divide-line max-w-2xl">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <SubjectIcon icon={s.icon} size={16} color={colorVar(s.color)} />
                <span className="flex-1 truncate text-sm">{s.name}</span>
                <button type="button" className="btn btn-secondary h-9" onClick={() => updateSubject(s.id, { archived: false })}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <SubjectForm subject={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
