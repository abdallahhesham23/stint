import { useMemo } from 'react'
import { useApp } from '../store'
import { useNow } from '../app/useNow'
import { Page, TitleRow } from '../app/Shell'
import { Heatmap } from '../components/Heatmap'
import { Ladder } from '../components/Ladder'
import { WeekBars } from '../components/WeekBars'
import { addDays, dayKey } from '../lib/dates'
import { duration, hourRange, hours, shortDate } from '../lib/format'
import { colorVar } from '../lib/palette'
import { bestWindow, heatmap, perSubject, totalMinutes, weekBars } from '../lib/stats'

export function Stats() {
  const now = useNow(false)
  const today = dayKey(new Date(now))
  const sessions = useApp((s) => s.sessions)
  const subjects = useApp((s) => s.subjects)
  const stamina = useApp((s) => s.stamina)
  const settings = useApp((s) => s.settings)
  const byId = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])

  const grid = useMemo(() => heatmap(sessions, today, settings.weekStart), [sessions, today, settings.weekStart])
  const week = useMemo(() => weekBars(sessions, today, settings.weekStart), [sessions, today, settings.weekStart])
  const month = useMemo(() => perSubject(sessions, addDays(today, -29), today), [sessions, today])
  const best = useMemo(() => bestWindow(sessions), [sessions])
  const total = totalMinutes(sessions)
  const yearTotal = grid.flat().reduce((a, d) => a + (d.minutes ?? 0), 0)
  const weekTotal = week.reduce((a, d) => a + d.minutes, 0)
  const monthMax = Math.max(1, ...month.map((m) => m.minutes))
  const average = sessions.length ? total / sessions.length : 0

  return (
    <Page>
      <TitleRow
        title="Stats"
        line={sessions.length ? `${hours(Math.round((total / 60) * 10) / 10)} in total · ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}` : 'Your year fills in one session at a time.'}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-12 panel" aria-labelledby="year-title">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="year-title" className="section-title">
              This year
            </h2>
            <p className="meta num">{duration(yearTotal)}</p>
          </div>
          <Heatmap grid={grid} />
        </section>

        <section className="lg:col-span-8 panel" aria-labelledby="week-title">
          <div className="flex items-baseline justify-between mb-5">
            <h2 id="week-title" className="section-title">
              This week
            </h2>
            <p className="meta num">{duration(weekTotal)}</p>
          </div>
          <WeekBars bars={week} today={today} />
        </section>

        <section className="lg:col-span-4 panel flex flex-col" aria-labelledby="focus-title">
          <h2 id="focus-title" className="section-title">
            How you focus
          </h2>
          <dl className="mt-4 divide-y divide-line">
            <div className="py-3 first:pt-0">
              <dt className="meta">Best time of day</dt>
              <dd className="text-2xl leading-8 mt-0.5 num">{best ? hourRange(best.startHour) : <span className="text-muted">–</span>}</dd>
              {!best && <dd className="meta mt-1">Shows up after your first few sessions.</dd>}
            </div>
            <div className="py-3 flex items-baseline justify-between">
              <dt className="meta">Average session</dt>
              <dd className="text-[15px] num">{sessions.length ? duration(average) : '–'}</dd>
            </div>
            <div className="py-3 flex items-baseline justify-between">
              <dt className="meta">Sessions</dt>
              <dd className="text-[15px] num">{sessions.length}</dd>
            </div>
            <div className="py-3 last:pb-0 flex items-baseline justify-between">
              <dt className="meta">Total</dt>
              <dd className="text-[15px] num">{duration(total)}</dd>
            </div>
          </dl>
        </section>

        <section className="lg:col-span-8 panel" aria-labelledby="subject-title">
          <div className="flex items-baseline justify-between mb-4">
            <h2 id="subject-title" className="section-title">
              Time per subject
            </h2>
            <p className="meta">Last 30 days</p>
          </div>
          {month.length ? (
            <ul className="flex flex-col gap-4">
              {month.map((m) => {
                const s = byId.get(m.subjectId)
                return (
                  <li key={m.subjectId}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="truncate">{s?.name ?? 'Subject'}</span>
                      <span className="num shrink-0 pl-3">{duration(m.minutes)}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full overflow-hidden" aria-hidden="true">
                      <div className="h-full rounded-full" style={{ width: `${(m.minutes / monthMax) * 88}%`, background: colorVar(s?.color ?? '') }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[15px] text-muted">The last 30 days are quiet so far. Your first session starts this.</p>
          )}
        </section>

        <section className="lg:col-span-4 panel flex flex-col" aria-labelledby="stamina-stat-title">
          <h2 id="stamina-stat-title" className="section-title">
            Focus stamina
          </h2>
          <p className="figure mt-3">
            {stamina.lengthMin}
            <span className="unit"> of {settings.staminaGoalMin} min</span>
          </p>
          <div className="mt-4">
            <Ladder stamina={stamina} goal={settings.staminaGoalMin} />
          </div>
          <div className="mt-5">
            {stamina.history.length ? (
              <ul className="flex flex-col gap-2">
                {stamina.history
                  .slice(-4)
                  .reverse()
                  .map((h, i) => (
                    <li key={i} className="flex justify-between text-sm num">
                      <span className="text-muted">{shortDate(h.date)}</span>
                      <span>{h.lengthMin} min rounds</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="meta">Every three full rounds, your sessions grow a little. The steps will show up here.</p>
            )}
          </div>
        </section>
      </div>
    </Page>
  )
}
