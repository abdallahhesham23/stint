import { useMemo, useState } from 'react'
import { ChevronDown, Settings as Gear } from 'lucide-react'
import { useApp } from '../store'
import { useNow } from '../app/useNow'
import { go } from '../app/useRoute'
import { Page } from '../app/Shell'
import { Ring } from '../components/Ring'
import { Ladder } from '../components/Ladder'
import { SubjectIcon } from '../components/SubjectIcon'
import { SubjectPicker } from '../components/SubjectPicker'
import { QuickAddSubject } from '../components/QuickAddSubject'
import { dayKey, weekStartKey } from '../lib/dates'
import { examPlan } from '../lib/exams'
import { clock, dayLabel, duration, greeting, hours, shortDate, timeOfDay } from '../lib/format'
import { minutesBySubject, progress } from '../lib/goals'
import { pickNextUp } from '../lib/nextUp'
import { colorVar } from '../lib/palette'
import { computeStreak } from '../lib/streak'
import { nextRound, remainingSec } from '../lib/timer'
import type { Exam, Session, Subject } from '../lib/types'
import { beginFocus } from '../focus/begin'

export function Today() {
  const now = useNow(false)
  const today = dayKey(new Date(now))
  const subjects = useApp((s) => s.subjects)
  const sessions = useApp((s) => s.sessions)
  const exams = useApp((s) => s.exams)
  const settings = useApp((s) => s.settings)
  const active = useMemo(() => subjects.filter((s) => !s.archived), [subjects])

  const todayMin = useMemo(() => minutesBySubject(sessions, today, today), [sessions, today])
  const weekMin = useMemo(() => minutesBySubject(sessions, weekStartKey(today, settings.weekStart), today), [sessions, today, settings.weekStart])
  const streak = useMemo(() => computeStreak(sessions, today, settings.weekStart), [sessions, today, settings.weekStart])
  const nextExam = useMemo(() => {
    const ids = new Set(active.map((s) => s.id))
    return exams.filter((e) => ids.has(e.subjectId) && e.date >= today).toSorted((a, b) => a.date.localeCompare(b.date))[0] ?? null
  }, [exams, active, today])

  const totalToday = Object.values(todayMin).reduce((a, b) => a + b, 0)
  const goalToday = active.reduce((a, s) => a + s.dailyGoalMin, 0)
  const byId = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const examLine = nextExam ? findingForExam(nextExam, byId.get(nextExam.subjectId), sessions, today) : null

  const finding = !active.length
    ? 'Add the courses you’re taking and Stint will suggest what to study next.'
    : (examLine ??
      (goalToday > 0 && totalToday >= goalToday
        ? 'Today’s goal is met. Anything more is a bonus.'
        : totalToday > 0
          ? `${duration(totalToday)} so far today. Nicely going.`
          : streak.days > 0
            ? `${streak.days}-day streak. One session keeps it going.`
            : 'Pick up where it feels easiest. Even five minutes counts.'))

  return (
    <Page>
      <header className="flex items-start justify-between gap-4 pt-2 md:pt-8 mb-8 md:mb-12">
        <div>
          <h1 className="greeting text-[34px] md:text-[48px]" tabIndex={-1} data-screen-title>
            {greeting(new Date(now).getHours())}
            {settings.name ? `, ${settings.name}` : ''}
          </h1>
          <p className="mt-3 text-base text-muted max-w-[60ch]">
            <span className="text-ink">{shortDate(today)}</span>
            <span aria-hidden="true"> · </span>
            {finding}
          </p>
        </div>
        <a href="#/settings" className="btn-icon md:hidden -mr-2" aria-label="Settings">
          <Gear size={20} strokeWidth={1.75} aria-hidden="true" />
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <section className="lg:col-span-8 panel !p-0 overflow-hidden" aria-labelledby="start-title">
          {active.length ? <StartBlock subjects={active} sessions={sessions} exams={exams} today={today} /> : <FirstSubject />}
        </section>
        <StaminaPanel />

        <section className="lg:col-span-4 panel flex items-center gap-4" aria-labelledby="today-title">
          <Ring value={progress(totalToday, goalToday)} label={`${Math.round(totalToday)} of ${goalToday} minutes today`} />
          <div className="min-w-0">
            <h2 id="today-title" className="meta">
              Today
            </h2>
            <p className="figure mt-0.5">
              {Math.round(totalToday)}
              <span className="unit"> min</span>
            </p>
            <p className="meta mt-1">{goalToday ? `of ${duration(goalToday)} planned` : 'Set daily goals in Subjects'}</p>
          </div>
        </section>

        <section className="lg:col-span-4 panel" aria-labelledby="streak-title">
          <h2 id="streak-title" className="meta">
            Streak
          </h2>
          <p className="figure mt-0.5">
            {streak.days}
            <span className="unit"> {streak.days === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="meta mt-1">{streakLine(streak, today, settings.weekStart)}</p>
        </section>

        <ExamPanel exam={nextExam} subject={nextExam ? byId.get(nextExam.subjectId) : undefined} sessions={sessions} today={today} />

        <SubjectsToday subjects={active} todayMin={todayMin} weekMin={weekMin} />
        <Recent sessions={sessions} byId={byId} today={today} />
      </div>
    </Page>
  )
}

function findingForExam(e: Exam, subject: Subject | undefined, sessions: Session[], today: string): string | null {
  const p = examPlan(e, sessions, today)
  if (p.state === 'today') return `${e.title} is today. You’ve put in the work.`
  if (p.daysLeft > 14) return null
  const when = p.daysLeft === 1 ? 'tomorrow' : `in ${p.daysLeft} days`
  const name = subject ? `${subject.name} ${e.title.toLowerCase()}` : e.title
  return p.dailyHours ? `${name} ${when}. About ${hours(p.dailyHours)} a day gets you there.` : `${name} ${when}. You’re ready for it.`
}

const weekdayName = (key: string) => new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })

function streakLine(streak: ReturnType<typeof computeStreak>, today: string, weekStart: number): string {
  const weekFrom = weekStartKey(today, weekStart)
  const restThisWeek = streak.restDays.find((d) => d >= weekFrom)
  if (restThisWeek) return `Rest day on ${weekdayName(restThisWeek)}. Your streak is safe.`
  if (streak.days > 0) return 'A rest day is there if you need one this week.'
  return 'Your streak starts with today’s first session.'
}

function StartBlock({ subjects, sessions, exams, today }: { subjects: Subject[]; sessions: Session[]; exams: Exam[]; today: string }) {
  const timer = useApp((s) => s.timer)
  const stamina = useApp((s) => s.stamina)
  const settings = useApp((s) => s.settings)
  const now = useNow(!!timer)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const suggested = useMemo(() => pickNextUp(subjects, sessions, exams, today, settings.weekStart), [subjects, sessions, exams, today, settings.weekStart])
  const subject = subjects.find((s) => s.id === (timer?.subjectId ?? chosenId)) ?? suggested ?? subjects[0]
  const round = nextRound(timer, now, settings.roundsPerSitting)
  const left = timer ? remainingSec(timer, now) : 0

  const status = !timer
    ? `Up next · round ${round} of ${settings.roundsPerSitting}`
    : timer.phase === 'focus'
      ? `Focusing · ${clock(left)} left${timer.pausedAt ? ' · paused' : ''}`
      : left > 0
        ? `On a break · ${clock(left)}`
        : `Ready for round ${round} of ${settings.roundsPerSitting}`

  return (
    <div className="p-5 md:p-7 h-full flex flex-col">
      <h2 id="start-title" className="meta">
        {status}
      </h2>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <button
          type="button"
          className="card inline-flex items-center gap-2.5 h-11 pl-3.5 pr-3 text-lg font-medium disabled:cursor-default"
          style={{ viewTransitionName: 'subject' }}
          onClick={() => setPicking(true)}
          disabled={!!timer}
          aria-label={`Subject: ${subject.name}. Change subject`}
        >
          <SubjectIcon icon={subject.icon} size={18} color={colorVar(subject.color)} />
          {subject.name}
          {!timer && <ChevronDown size={16} strokeWidth={1.75} className="text-muted" aria-hidden="true" />}
        </button>
        <span className="text-lg text-muted num">
          {timer?.phase === 'focus' ? `${Math.round(timer.plannedSec / 60)} min` : `${stamina.lengthMin} min`}
        </span>
      </div>

      <div className="mt-auto pt-8 flex flex-col sm:flex-row sm:items-center gap-3">
        {!timer && (
          <>
            <button type="button" className="btn btn-primary btn-big sm:min-w-64" onClick={() => beginFocus(subject.id, 'stamina', stamina.lengthMin)}>
              Start studying
            </button>
            <button type="button" className="btn btn-ghost h-12" onClick={() => beginFocus(subject.id, 'quick', 5)}>
              Just 5 minutes
            </button>
          </>
        )}
        {timer?.phase === 'focus' && (
          <button type="button" className="btn btn-primary btn-big sm:min-w-64" onClick={() => go('focus')}>
            Back to focus
          </button>
        )}
        {timer && timer.phase !== 'focus' && (
          <>
            <button type="button" className="btn btn-primary btn-big sm:min-w-64" onClick={() => beginFocus(timer.subjectId, 'stamina', stamina.lengthMin)}>
              Back to it
            </button>
            <button type="button" className="btn btn-ghost h-12" onClick={() => go('focus')}>
              See the break
            </button>
          </>
        )}
      </div>

      <SubjectPicker
        open={picking}
        subjects={subjects}
        current={subject.id}
        onPick={(id) => {
          setChosenId(id)
          setPicking(false)
        }}
        onClose={() => setPicking(false)}
      />
    </div>
  )
}

function FirstSubject() {
  return (
    <div className="p-5 md:p-7">
      <h2 id="start-title" className="text-lg font-medium">
        What are you studying this term?
      </h2>
      <p className="mt-1 text-[15px] text-muted">Add one course to begin. You can add the rest any time.</p>
      <QuickAddSubject className="mt-5" />
    </div>
  )
}

function StaminaPanel() {
  const stamina = useApp((s) => s.stamina)
  const goal = useApp((s) => s.settings.staminaGoalMin)
  const atGoal = stamina.lengthMin >= goal
  return (
    <section className="lg:col-span-4 panel flex flex-col" aria-labelledby="stamina-title">
      <h2 id="stamina-title" className="section-title">
        Focus stamina
      </h2>
      <p className="figure mt-3">
        {stamina.lengthMin}
        <span className="unit"> of {goal} min</span>
      </p>
      <div className="mt-4">
        <Ladder stamina={stamina} goal={goal} />
      </div>
      <p className="meta mt-auto pt-4">
        {atGoal
          ? 'You’ve reached your goal length. Every round from here is strength kept.'
          : `${3 - stamina.completedAtLength} more full ${3 - stamina.completedAtLength === 1 ? 'round' : 'rounds'} and the next one gets a little longer.`}
      </p>
    </section>
  )
}

function ExamPanel({ exam, subject, sessions, today }: { exam: Exam | null; subject?: Subject; sessions: Session[]; today: string }) {
  if (!exam) {
    return (
      <section className="lg:col-span-4 panel" aria-labelledby="exam-title">
        <h2 id="exam-title" className="meta">
          Next exam
        </h2>
        <p className="mt-2 text-[15px]">No exams on the calendar.</p>
        <a href="#/exams" className="link inline-block mt-2">
          Add an exam
        </a>
      </section>
    )
  }
  const p = examPlan(exam, sessions, today)
  return (
    <section className="lg:col-span-4 panel" aria-labelledby="exam-title">
      <h2 id="exam-title" className="meta">
        Next exam
      </h2>
      <p className="figure mt-0.5">
        {p.state === 'today' ? 'Today' : p.daysLeft}
        {p.state !== 'today' && <span className="unit"> {p.daysLeft === 1 ? 'day' : 'days'}</span>}
      </p>
      <p className="meta mt-1 truncate">
        {subject?.name ?? 'Exam'} · {exam.title}
        {p.dailyHours ? ` · about ${hours(p.dailyHours)} a day` : ''}
      </p>
    </section>
  )
}

function SubjectsToday({ subjects, todayMin, weekMin }: { subjects: Subject[]; todayMin: Record<string, number>; weekMin: Record<string, number> }) {
  return (
    <section className="lg:col-span-8 panel" aria-labelledby="subjects-title">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="subjects-title" className="section-title">
          Your subjects today
        </h2>
        <a href="#/subjects" className="link">
          {subjects.length ? 'View all' : 'Add a subject'}
        </a>
      </div>
      {subjects.length ? (
        <ul className="divide-y divide-line">
          {subjects.slice(0, 5).map((s) => {
            const done = todayMin[s.id] ?? 0
            return (
              <li key={s.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                <Ring value={progress(done, s.dailyGoalMin)} size={32} stroke={4} color={colorVar(s.color)} label={`${s.name}: ${Math.round(done)} of ${s.dailyGoalMin} minutes today`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="meta num">
                    This week {duration(weekMin[s.id] ?? 0)}
                    {s.weeklyGoalMin ? ` of ${duration(s.weeklyGoalMin)}` : ''}
                  </p>
                </div>
                <p className="text-sm num text-right shrink-0">
                  {Math.round(done)}
                  <span className="text-muted">{s.dailyGoalMin ? ` /${s.dailyGoalMin}` : ''} min</span>
                </p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[15px] text-muted">Your courses will show up here with today’s progress.</p>
      )}
    </section>
  )
}

function Recent({ sessions, byId, today }: { sessions: Session[]; byId: Map<string, Subject>; today: string }) {
  const recent = useMemo(() => sessions.toSorted((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 4), [sessions])
  return (
    <section className="lg:col-span-4 panel" aria-labelledby="recent-title">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="recent-title" className="section-title">
          Recent
        </h2>
        {recent.length > 0 && (
          <a href="#/log" className="link">
            View all
          </a>
        )}
      </div>
      {recent.length ? (
        <ul className="flex flex-col gap-3">
          {recent.map((s) => {
            const subject = byId.get(s.subjectId)
            const day = dayKey(new Date(s.startedAt))
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="size-2 rounded-full shrink-0" style={{ background: colorVar(subject?.color ?? '') }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{subject?.name ?? 'Subject'}</p>
                  <p className="meta">
                    {dayLabel(day, today)} · {timeOfDay(s.startedAt)}
                  </p>
                </div>
                <p className="text-sm num shrink-0">{duration(s.durationSec / 60)}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-[15px] text-muted">Your first session will show up here.</p>
      )}
    </section>
  )
}

