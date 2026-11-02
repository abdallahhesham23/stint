import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Pause, Play, StickyNote } from 'lucide-react'
import { useApp, dataOf } from '../store'
import { useNow } from '../app/useNow'
import { go } from '../app/useRoute'
import { SubjectIcon } from '../components/SubjectIcon'
import { Ladder } from '../components/Ladder'
import { Rewards } from '../components/Rewards'
import { toast } from '../components/toast'
import { beginFocus } from '../focus/begin'
import { useCountUp } from '../focus/useCountUp'
import { dayKey } from '../lib/dates'
import { clock, duration } from '../lib/format'
import { minutesBySubject } from '../lib/goals'
import { colorVar } from '../lib/palette'
import { stepUp } from '../lib/stamina'
import { remainingSec, elapsedSec } from '../lib/timer'
import type { Session, Subject, Timer } from '../lib/types'

const typing = (e: KeyboardEvent) => e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
const KEEP_GOING_WINDOW_MS = 2 * 60_000

export function Focus() {
  const timer = useApp((s) => s.timer)
  const lastSession = useApp((s) => s.sessions.find((x) => x.id === s.lastSessionId) ?? null)
  const subjects = useApp((s) => s.subjects)
  const lastRound = useRef(1)
  if (timer) lastRound.current = timer.round

  const subjectId = timer?.subjectId ?? lastSession?.subjectId
  const subject = subjects.find((s) => s.id === subjectId)

  useEffect(() => {
    if (!timer && !lastSession) go('today')
  }, [timer, lastSession])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !typing(e) && !document.querySelector('dialog[open]')) go('today')
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  if (!subject) return null
  const resting = !!timer && timer.phase !== 'focus'
  const running = timer?.phase === 'focus'

  // Ending a round sits in the header, away from Park, and can be undone for 5 s.
  const stop = () => {
    const before = dataOf(useApp.getState())
    useApp.getState().endFocus(false)
    toast('Round ended.', { label: 'Undo', run: () => useApp.setState({ ...before, lastSessionId: null }) })
  }

  return (
    <div className={`focus-stage min-h-dvh flex flex-col ${resting ? 'bg-wash' : 'bg-ground'}`}>
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-8 pt-4 md:pt-6">
        <a href="#/today" className="btn btn-ghost h-11 pl-3 pr-4 justify-self-start">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Today
        </a>
        <span className="inline-flex items-center gap-2.5 h-10 max-w-[46vw] pl-3 pr-4 rounded-card bg-surface text-sm font-medium" style={{ viewTransitionName: 'subject' }}>
          <SubjectIcon icon={subject.icon} size={16} color={colorVar(subject.color)} />
          <span className="truncate">{subject.name}</span>
        </span>
        {running ? (
          <button type="button" className="btn btn-ghost h-11 justify-self-end text-muted" onClick={stop}>
            End round
          </button>
        ) : (
          <span />
        )}
      </header>
      <main id="main" className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        {running && <Running timer={timer!} subject={subject} />}
        {resting && <Resting timer={timer!} subject={subject} session={lastSession} />}
        {!timer && lastSession && <Stopped session={lastSession} subject={subject} round={lastRound.current} />}
      </main>
    </div>
  )
}

function RoundDots({ round, celebrate = false }: { round: number; celebrate?: boolean }) {
  const rounds = useApp((s) => s.settings.roundsPerSitting)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!celebrate || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    ref.current?.querySelectorAll('[data-dot]').forEach((dot, i) =>
      dot.animate([{ transform: 'scale(0.6)' }, { transform: 'scale(1)' }], { duration: 400, delay: 200 + i * 120, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' }),
    )
  }, [celebrate])
  return (
    <span ref={ref} className="inline-flex items-center gap-2" role="img" aria-label={`Round ${round} of ${rounds}`}>
      {Array.from({ length: rounds }, (_, i) => (
        <span key={i} data-dot className={`size-2.5 rounded-full ${i < round ? 'bg-accent' : 'bg-track'}`} />
      ))}
    </span>
  )
}

function Running({ timer, subject }: { timer: Timer; subject: Subject }) {
  const now = useNow(true)
  const { pause, resume, parkThought } = useApp.getState()
  const rounds = useApp((s) => s.settings.roundsPerSitting)
  const [parking, setParking] = useState(false)
  const left = remainingSec(timer, now)
  const paused = !!timer.pausedAt
  const share = elapsedSec(timer, now) / timer.plannedSec

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ') {
        e.preventDefault()
        const s = useApp.getState()
        if (s.timer?.pausedAt) s.resume()
        else s.pause()
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setParking(true)
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // A kind word after time away; nothing is counted.
  useEffect(() => {
    let hiddenAt = 0
    const onVis = () => {
      if (document.hidden) hiddenAt = Date.now()
      else if (hiddenAt && Date.now() - hiddenAt >= 30_000) {
        const t = useApp.getState().timer
        if (t?.phase === 'focus' && !t.pausedAt) toast(`Welcome back. ${Math.max(1, Math.round(remainingSec(t, Date.now()) / 60))} min left.`)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const size = 'min(84vw, 62dvh, 520px)'
  return (
    <>
      <h1 className="sr-only" tabIndex={-1} data-screen-title>
        Focusing on {subject.name}
      </h1>
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90 pointer-events-none" aria-hidden="true">
          <circle cx="50" cy="50" r="48" fill="none" stroke="var(--track)" strokeWidth="0.6" />
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={paused ? 'var(--muted)' : 'var(--accent)'}
            strokeWidth="1.2"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - share}
            className="focus-arc"
          />
        </svg>
        <div className="text-center">
          {paused && <p className="mb-3 inline-flex items-center h-7 px-3 rounded-full bg-surface text-sm font-medium">Paused</p>}
          <p
            className={`greeting num leading-none ${paused ? 'text-muted' : ''}`}
            style={{ fontSize: 'clamp(96px, 15vw, 150px)', fontFeatureSettings: '"tnum"' }}
            role="timer"
            aria-label={`${Math.ceil(left / 60)} minutes left${paused ? ', paused' : ''}`}
          >
            {clock(left)}
          </p>
          <p className="mt-4 flex items-center justify-center gap-3 text-sm text-muted">
            <RoundDots round={timer.round} />
            <span>
              Round {timer.round} of {rounds} · {Math.round(timer.plannedSec / 60)} min
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-secondary h-11 min-w-36" onClick={() => (paused ? resume() : pause())} aria-keyshortcuts="Space">
          {paused ? <Play size={16} strokeWidth={1.75} aria-hidden="true" /> : <Pause size={16} strokeWidth={1.75} aria-hidden="true" />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="btn btn-secondary h-11" onClick={() => setParking(true)} aria-keyshortcuts="P">
          <StickyNote size={16} strokeWidth={1.75} aria-hidden="true" />
          Park a thought
        </button>
      </div>

      {/* Fixed height so opening the park field never moves the timer. */}
      <div className="mt-5 h-12 w-full max-w-md flex items-center justify-center">
        {parking ? (
          <ParkForm
            onDone={(text) => {
              setParking(false)
              if (text) {
                parkThought(text)
                toast('Parked. It’ll be here after this round.')
              }
            }}
          />
        ) : (
          <p className="meta text-center hidden md:block">
            {timer.parked.length ? `${timer.parked.length} parked · ` : ''}
            {paused ? 'Space to resume' : 'Space to pause'} · P to park a thought · Esc for Today
          </p>
        )}
      </div>
    </>
  )
}

function ParkForm({ onDone }: { onDone: (text: string) => void }) {
  const [text, setText] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onDone(text.trim())
  }
  return (
    <form onSubmit={submit} className="w-full flex gap-2">
      <label htmlFor="park" className="sr-only">
        A thought to come back to later
      </label>
      <input
        id="park"
        autoFocus
        className="input"
        placeholder="Email the professor about the lab"
        value={text}
        maxLength={140}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), onDone(''))}
      />
      <button type="submit" className="btn btn-secondary h-11">
        Park it
      </button>
    </form>
  )
}

function SessionNote({ session }: { session: Session }) {
  const updateSession = useApp((s) => s.updateSession)
  const [note, setNote] = useState(session.note)
  return (
    <div className="mt-5">
      <label htmlFor="note" className="label">
        What did you cover? <span className="text-muted font-normal">Optional</span>
      </label>
      <input
        id="note"
        className="input"
        placeholder="Integration by parts, problems 4 to 9"
        value={note}
        maxLength={500}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== session.note && updateSession(session.id, { note: note.trim() })}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      {session.parked.length > 0 && (
        <div className="mt-4">
          <p className="label">Parked while you focused</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            {session.parked.map((p, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted" aria-hidden="true">
                  ·
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** The finish moment: minutes counted up, today's total, and, for stamina rounds, the ladder moving. */
function FinishCard({ session, line, ladder }: { session: Session; line: string; ladder: boolean }) {
  const target = Math.round(session.durationSec / 60)
  const minutes = useCountUp(target)
  const sessions = useApp((s) => s.sessions)
  const stamina = useApp((s) => s.stamina)
  const goal = useApp((s) => s.settings.staminaGoalMin)
  const today = dayKey(new Date())
  const todayTotal = useMemo(() => Object.values(minutesBySubject(sessions, today, today)).reduce((a, b) => a + b, 0), [sessions, today])

  const steppedUp = stamina.lengthMin > Math.round(session.plannedSec / 60)
  const toGo = 3 - stamina.completedAtLength
  const progressLine = steppedUp
    ? `Next round: ${stamina.lengthMin} min. Your focus is growing.`
    : stamina.lengthMin >= goal
      ? 'At your goal length. This one keeps it strong.'
      : `${stamina.completedAtLength} of 3 at ${stamina.lengthMin} min. ${toGo === 1 ? 'One more' : `${toGo} more`} and rounds grow to ${stepUp(stamina.lengthMin, goal)}.`

  return (
    <section className="rise card w-full max-w-lg p-6 md:p-7" aria-labelledby="finish-title">
      <div className="flex items-baseline justify-between gap-4">
        <h1 id="finish-title" className="screen-title num" tabIndex={-1} data-screen-title>
          <span aria-hidden="true">{minutes}</span>
          <span className="sr-only">{target}</span> minutes.
        </h1>
        <p className="meta num shrink-0">Today {duration(todayTotal)}</p>
      </div>
      <p className="text-base text-muted">{line}</p>
      {ladder && (
        <div className="mt-5">
          <Ladder stamina={stamina} goal={goal} celebrate={steppedUp ? 'rung' : 'pip'} />
          <p className="text-sm mt-2">{progressLine}</p>
        </div>
      )}
      <SessionNote key={session.id} session={session} />
    </section>
  )
}

function Resting({ timer, subject, session }: { timer: Timer; subject: Subject; session: Session | null }) {
  const now = useNow(true)
  const stamina = useApp((s) => s.stamina)
  const rounds = useApp((s) => s.settings.roundsPerSitting)
  const left = remainingSec(timer, now)
  const long = timer.phase === 'longBreak'
  const nextLabel = long ? 'Start a new sitting' : `Start round ${Math.min(timer.round + 1, rounds)} of ${rounds}`
  const breakAge = now - Date.parse(timer.startedAt)
  const justFinished = session && session.subjectId === subject.id && Date.parse(timer.startedAt) - (Date.parse(session.startedAt) + session.durationSec * 1000) < 120_000

  return (
    <div className="w-full flex flex-col items-center">
      {justFinished && session && (
        <FinishCard session={session} ladder={timer.kind === 'stamina'} line={timer.kind === 'quick' && session.plannedSec <= 600 ? 'That’s how it starts.' : 'Nicely done.'} />
      )}
      <Rewards inline />
      <div className="mt-10 text-center">
        <p className="text-sm text-muted flex items-center justify-center gap-3">
          <RoundDots round={timer.round} celebrate={long} />
          {long ? 'Long break' : 'Break'}
        </p>
        <p className="greeting num mt-2 leading-none" style={{ fontSize: 'clamp(56px, 10vw, 96px)', fontFeatureSettings: '"tnum"' }} role="timer">
          {left > 0 ? clock(left) : 'Break’s over'}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-primary btn-big min-w-60" onClick={() => beginFocus(subject.id, 'stamina', stamina.lengthMin)}>
          {left > 0 ? nextLabel : 'Back to it'}
        </button>
        {breakAge < KEEP_GOING_WINDOW_MS && (
          <button type="button" className="btn btn-secondary h-12" onClick={() => useApp.getState().extend(10)}>
            Keep going +10 min
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost h-12"
          onClick={() => {
            useApp.getState().endTimer()
            useApp.setState({ lastSessionId: null })
            go('today')
          }}
        >
          Done for now
        </button>
      </div>
    </div>
  )
}

function Stopped({ session, subject, round }: { session: Session; subject: Subject; round: number }) {
  const breakMin = useApp((s) => s.settings.breakMin)
  return (
    <div className="w-full flex flex-col items-center">
      <FinishCard session={session} ladder={false} line="And they count." />
      <Rewards inline />
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-primary btn-big min-w-60" onClick={() => useApp.getState().startBreak(subject.id, round)}>
          Take a {breakMin}-minute break
        </button>
        <button
          type="button"
          className="btn btn-ghost h-12"
          onClick={() => {
            useApp.setState({ lastSessionId: null })
            go('today')
          }}
        >
          Done for now
        </button>
      </div>
    </div>
  )
}
