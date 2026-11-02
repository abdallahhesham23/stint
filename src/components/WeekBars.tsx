import { useEffect, useRef } from 'react'
import { duration } from '../lib/format'

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })

/** This week, one column per day; today's bar takes the accent. Bars grow from the baseline once on open. */
export function WeekBars({ bars, today }: { bars: { key: string; minutes: number }[]; today: string }) {
  const maxHours = Math.max(1, Math.ceil(Math.max(...bars.map((b) => b.minutes)) / 60))
  const ticks = maxHours <= 3 ? Array.from({ length: maxHours + 1 }, (_, i) => i) : [0, Math.ceil(maxHours / 2), maxHours]
  const top = ticks[ticks.length - 1] * 60
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    box.current?.querySelectorAll('[data-bar]').forEach((bar, i) =>
      bar.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 500, delay: i * 30, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' }),
    )
  }, [])

  return (
    <div ref={box}>
      <div className="relative h-44 grid grid-cols-[28px_minmax(0,1fr)]">
        <div className="relative">
          {ticks.map((t) => (
            <span key={t} className="absolute left-0 meta num -translate-y-1/2" style={{ bottom: `calc(${(t * 60 * 100) / top}% - 8px)` }}>
              {t}h
            </span>
          ))}
        </div>
        <div className="relative">
          {ticks.map((t) => (
            <div key={t} className={`absolute inset-x-0 ${t === 0 ? 'h-0.5 bg-control/40' : 'h-px bg-line'}`} style={{ bottom: `${(t * 60 * 100) / top}%` }} aria-hidden="true" />
          ))}
          <ul className="absolute inset-0 grid grid-cols-7 gap-2 md:gap-3 px-1 items-end">
            {bars.map((b) => (
              <li key={b.key} className="h-full flex items-end justify-center">
                <span className="sr-only">{`${WEEKDAY.format(new Date(`${b.key}T00:00:00Z`))}: ${duration(b.minutes)}`}</span>
                <div
                  data-bar
                  className="w-full max-w-10 rounded-t-[4px] origin-bottom"
                  style={{ height: `${(b.minutes * 100) / top}%`, background: b.key === today ? 'var(--accent)' : 'color-mix(in srgb, var(--muted) 55%, transparent)' }}
                  title={duration(b.minutes)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-[28px_minmax(0,1fr)] mt-2" aria-hidden="true">
        <span />
        <div className="grid grid-cols-7 gap-2 md:gap-3 px-1">
          {bars.map((b) => (
            <span key={b.key} className={`text-center text-xs ${b.key === today ? 'text-ink font-medium' : 'text-muted'}`}>
              {WEEKDAY.format(new Date(`${b.key}T00:00:00Z`))}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
