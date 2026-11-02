import { useMemo, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useApp } from '../store'
import { useNow } from '../app/useNow'
import { Page, TitleRow } from '../app/Shell'
import { SessionForm } from '../components/SessionForm'
import { dayKey } from '../lib/dates'
import { dayLabel, duration, timeOfDay } from '../lib/format'
import { colorVar } from '../lib/palette'
import type { Session } from '../lib/types'

export function Log() {
  const now = useNow(false)
  const today = dayKey(new Date(now))
  const sessions = useApp((s) => s.sessions)
  const subjects = useApp((s) => s.subjects)
  const [editing, setEditing] = useState<Session | 'new' | null>(null)
  const byId = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const days = useMemo(() => {
    const groups = new Map<string, Session[]>()
    for (const s of sessions.toSorted((a, b) => b.startedAt.localeCompare(a.startedAt))) {
      const key = dayKey(new Date(s.startedAt))
      groups.set(key, [...(groups.get(key) ?? []), s])
    }
    return [...groups]
  }, [sessions])
  const total = sessions.reduce((a, s) => a + s.durationSec / 60, 0)

  return (
    <Page>
      <TitleRow
        title="Log"
        line={sessions.length ? `${duration(total)} across ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}` : 'Every session lands here, finished or not.'}
        action={
          <button type="button" className="btn btn-secondary" onClick={() => setEditing('new')} disabled={!subjects.length}>
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            Add a session
          </button>
        }
      />

      {days.length ? (
        <div className="flex flex-col gap-8 max-w-3xl">
          {days.map(([key, list]) => (
            <section key={key} aria-labelledby={`day-${key}`} style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${list.length * 64 + 40}px` }}>
              <div className="flex items-baseline justify-between mb-2 px-1">
                <h2 id={`day-${key}`} className="section-title">
                  {dayLabel(key, today)}
                </h2>
                <p className="meta num">{duration(list.reduce((a, s) => a + s.durationSec / 60, 0))}</p>
              </div>
              <ul className="panel !py-1 divide-y divide-line">
                {list.map((s) => {
                  const subject = byId.get(s.subjectId)
                  return (
                    <li key={s.id} className="flex items-start gap-3 py-3.5">
                      <span className="size-2 rounded-full mt-[7px] shrink-0" style={{ background: colorVar(subject?.color ?? '') }} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px]">
                          {subject?.name ?? 'Subject'}
                          <span className="meta"> · {timeOfDay(s.startedAt)}</span>
                        </p>
                        {s.note && <p className="text-sm text-muted mt-0.5 break-words">{s.note}</p>}
                        {s.parked.length > 0 && <p className="meta mt-1 break-words">Parked: {s.parked.join(' · ')}</p>}
                      </div>
                      <p className="text-[15px] num shrink-0">{duration(s.durationSec / 60)}</p>
                      <button type="button" className="btn-icon -my-2 -mr-2 shrink-0" aria-label={`Edit ${subject?.name ?? ''} session at ${timeOfDay(s.startedAt)}`} onClick={() => setEditing(s)}>
                        <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel max-w-2xl">
          <h2 className="text-lg font-medium">Your first session will show up here.</h2>
          <p className="mt-1 text-[15px] text-muted">
            {subjects.length ? 'Start one from Today, or add one you did away from the app.' : 'Add a subject, then start one from Today.'}
          </p>
          <a href={subjects.length ? '#/today' : '#/subjects'} className="btn btn-secondary mt-5">
            {subjects.length ? 'Go to Today' : 'Add a subject'}
          </a>
        </section>
      )}

      <SessionForm session={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
