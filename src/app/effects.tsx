import { useEffect, useRef } from 'react'
import { useApp } from '../store'
import { playChime, notify } from '../focus/alerts'
import { clock } from '../lib/format'
import { remainingSec, timerEndMs } from '../lib/timer'
import { useNow } from './useNow'
import { go, type Route } from './useRoute'

/** Applies the chosen theme; 'system' follows the OS live. */
export function useTheme() {
  const theme = useApp((s) => s.settings.theme)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const t = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme
      const root = document.documentElement
      // Swap themes in one frame: no colour transition may run between the two palettes.
      root.classList.add('theme-switching')
      root.dataset.theme = t
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0f1110' : '#ffffff')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

/** On a screen change, move focus to its title so keyboard and screen-reader users land in the right place. */
export function useScreenFocus(route: Route) {
  const prev = useRef(route)
  useEffect(() => {
    // Compare with the previous route (not a first-run flag) so StrictMode's double effect never steals focus on load.
    if (prev.current === route) return
    prev.current = route
    scrollTo(0, 0)
    document.querySelector<HTMLElement>('[data-screen-title]')?.focus({ preventScroll: true })
  }, [route])
}

/**
 * Ends focus rounds and announces break ends wherever the user is in the app.
 * One timeout to the exact end: a single timer isn't throttled like an interval in a background tab.
 */
export function TimerDriver() {
  // Keyed on the timer's values, not its identity: a rehydrate from another tab must not re-arm it.
  const key = useApp((s) => (s.timer ? [s.timer.phase, s.timer.startedAt, s.timer.pausedAt, s.timer.plannedSec, s.timer.pausedSec].join('|') : ''))
  useEffect(() => {
    const timer = useApp.getState().timer
    if (!timer || timer.pausedAt) return
    const ms = timerEndMs(timer) - Date.now()
    if (timer.phase !== 'focus' && ms < -5000) return // break ended long ago (e.g. reload): don't chime again
    const id = setTimeout(() => {
      // With two tabs open both timers fire; re-read storage so only the first one logs the round.
      useApp.persist.rehydrate()
      const now = useApp.getState().timer
      if (now?.startedAt !== timer.startedAt || now.phase !== timer.phase) return
      const s = useApp.getState()
      const name = s.subjects.find((x) => x.id === timer.subjectId)?.name ?? 'Your subject'
      if (s.settings.chime) playChime()
      if (timer.phase === 'focus') {
        s.endFocus(true)
        notify('Round done', `${Math.round(timer.plannedSec / 60)} minutes of ${name}. Nicely done.`)
        go('focus')
      } else {
        const rounds = s.settings.roundsPerSitting
        notify(
          "Break's over",
          timer.phase === 'longBreak'
            ? `${name} is ready when you are.`
            : `Round ${Math.min(timer.round + 1, rounds)} of ${rounds} · ${name} is ready when you are.`,
        )
      }
    }, Math.max(0, ms))
    return () => clearTimeout(id)
  }, [key])
  return null
}

/** The tab title carries the countdown, so a glance at the tab bar is enough. Isolated so only it ticks. */
export function TabTitle() {
  const timer = useApp((s) => s.timer)
  const name = useApp((s) => s.subjects.find((x) => x.id === s.timer?.subjectId)?.name)
  const now = useNow(!!timer)
  useEffect(() => {
    if (!timer) {
      document.title = 'Stint'
      return
    }
    const left = remainingSec(timer, now)
    if (timer.phase === 'focus') document.title = `${clock(left)} · ${name ?? 'Focus'}${timer.pausedAt ? ' (paused)' : ''}`
    else document.title = left > 0 ? `Break · ${clock(left)}` : 'Ready for the next round · Stint'
  }, [timer, now, name])
  return null
}
