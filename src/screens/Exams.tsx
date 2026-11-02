import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useApp } from '../store'
import { useNow } from '../app/useNow'
import { Page, TitleRow } from '../app/Shell'
import { ExamForm } from '../components/ExamForm'
import { SubjectIcon } from '../components/SubjectIcon'
import { dayKey } from '../lib/dates'
import { examPlan } from '../lib/exams'
import { duration, shortDate } from '../lib/format'
import { colorVar } from '../lib/palette'
import type { Exam } from '../lib/types'

export function Exams() {
  const now = useNow(false)
  const today = dayKey(new Date(now))
  const exams = useApp((s) => s.exams)
  const sessions = useApp((s) => s.sessions)
  const subjects = useApp((s) => s.subjects)
  const [editing, setEditing] = useState<Exam | 'new' | null>(null)
  const byId = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const sorted = useMemo(() => exams.toSorted((a, b) => a.date.localeCompare(b.date)), [exams])
  const upcoming = sorted.filter((e) => e.date >= today)
  const done = sorted.filter((e) => e.date < today).reverse()
  const next = upcoming[0] && examPlan(upcoming[0], sessions, today)

  return (
    <Page>
      <TitleRow
        title="Exams"
        line={
          !upcoming.length
            ? 'Add an exam and Stint works out how much a day gets you ready.'
            : next?.state === 'today'
              ? 'An exam today. You’ve put in the work.'
              : `Next one in ${next?.daysLeft} ${next?.daysLeft === 1 ? 'day' : 'days'}`
        }
        action={
          <button type="button" className="btn btn-secondary" onClick={() => setEditing('new')} disabled={!subjects.length}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add an exam
          </button>
        }
      />

      {upcoming.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {upcoming.map((e) => {
            const p = examPlan(e, sessions, today)
            const subject = byId.get(e.subjectId)
            const share = e.hoursNeeded ? Math.min(1, p.hoursDone / e.hoursNeeded) : 1
            return (
              <li key={e.id} className="panel flex flex-col">
                <div className="flex items-center gap-2.5">
                  {subject && <SubjectIcon icon={subject.icon} size={16} color={colorVar(subject.color)} />}
                  <p className="text-sm text-muted flex-1 truncate">{subject?.name ?? 'Subject'}</p>
                  <button type="button" className="btn-icon -my-2 -mr-2" aria-label={`Edit ${e.title}`} onClick={() => setEditing(e)}>
                    <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
                <h2 className="text-base font-medium mt-1">{e.title}</h2>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <p className="figure">
                    {p.state === 'today' ? 'Today' : p.daysLeft}
                    {p.state !== 'today' && <span className="unit"> {p.daysLeft === 1 ? 'day' : 'days'}</span>}
                  </p>
                  <p className="meta pb-1">{shortDate(e.date)}</p>
                </div>
                <div className="mt-5">
                  <div className="h-2 rounded-full bg-track overflow-hidden" role="img" aria-label={`${duration(p.hoursDone * 60)} of ${duration(e.hoursNeeded * 60)} studied`}>
                    <div className="h-full rounded-full" style={{ width: `${share * 100}%`, background: colorVar(subject?.color ?? '') }} />
                  </div>
                  <div className="mt-2 flex justify-between meta num">
                    <span>{duration(p.hoursDone * 60)} studied</span>
                    <span>{duration(e.hoursNeeded * 60)} planned</span>
                  </div>
                </div>
                <p className="mt-4 text-sm">
                  {p.state === 'today'
                    ? 'Exam day. You’ve put in the work.'
                    : p.hoursRemaining <= 0
                      ? 'You’ve done the hours. Keep it light and keep it fresh.'
                      : `About ${duration((p.dailyHours ?? 0) * 60)} a day gets you there.`}
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="panel max-w-2xl">
          <h2 className="text-base font-medium">No exams on the calendar</h2>
          <p className="mt-1 text-base text-muted">
            {subjects.length ? 'Add the date and a rough number of hours you want in before it.' : 'Add a subject first, then its exams.'}
          </p>
          {subjects.length ? (
            <button type="button" className="btn btn-secondary mt-5" onClick={() => setEditing('new')}>
              Add an exam
            </button>
          ) : (
            <a href="#/subjects" className="btn btn-secondary mt-5">
              Add a subject
            </a>
          )}
        </section>
      )}

      {done.length > 0 && (
        <details className="mt-10">
          <summary className="section-title inline-flex py-2">Done ({done.length})</summary>
          <ul className="mt-3 panel !py-2 divide-y divide-line max-w-2xl">
            {done.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex-1 truncate">
                  {byId.get(e.subjectId)?.name ?? 'Subject'} · {e.title}
                </span>
                <span className="meta">{shortDate(e.date)}</span>
                <button type="button" className="btn-icon -my-2" aria-label={`Edit ${e.title}`} onClick={() => setEditing(e)}>
                  <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ExamForm exam={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
