import { useEffect, useMemo, useRef } from 'react'
import { duration, shortDate } from '../lib/format'
import type { heatmap } from '../lib/stats'

const CELL = 11
const GAP = 3
const STEP = CELL + GAP
const LEFT = 34
const TOP = 18
const level = (m: number) => (m <= 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4)
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })

/** A year of study days, one column per week. Colour is never the only carrier: every cell has its value as a title. */
export function Heatmap({ grid }: { grid: ReturnType<typeof heatmap> }) {
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const months = useMemo(() => {
    const out: { col: number; label: string }[] = []
    grid.forEach((col, c) => {
      const first = col.find((d) => d.key.endsWith('-01'))
      if (first && c < grid.length - 1) out.push({ col: c, label: MONTH.format(new Date(`${first.key}T00:00:00Z`)) })
    })
    return out
  }, [grid])

  const monthTotals = useMemo(() => {
    const m = new Map<string, number>()
    for (const col of grid) for (const d of col) if (d.minutes) m.set(d.key.slice(0, 7), (m.get(d.key.slice(0, 7)) ?? 0) + d.minutes)
    return [...m]
  }, [grid])

  const width = LEFT + grid.length * STEP
  const height = TOP + 7 * STEP
  return (
    <>
      <div ref={scroller} className="overflow-x-auto -mx-1 px-1 pb-1">
        {/* Scales up to fill the panel; on narrow screens it keeps its size and scrolls. */}
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block w-full h-auto" style={{ minWidth: width }}>
          {months.map((m) => (
            <text key={m.col} x={LEFT + m.col * STEP} y={11} fontSize={11} fill="var(--muted)">
              {m.label}
            </text>
          ))}
          {[1, 3, 5].map((r) => (
            <text key={r} x={0} y={TOP + r * STEP + CELL - 1} fontSize={11} fill="var(--muted)">
              {WEEKDAY.format(new Date(`${grid[0][r].key}T00:00:00Z`))}
            </text>
          ))}
          {grid.map((col, c) =>
            col.map((d, r) =>
              d.minutes === null ? null : (
                <rect key={d.key} x={LEFT + c * STEP} y={TOP + r * STEP} width={CELL} height={CELL} rx={3} fill={`var(--heat-${level(d.minutes)})`}>
                  <title>{`${shortDate(d.key)}, ${d.minutes ? duration(d.minutes) : 'no study'}`}</title>
                </rect>
              ),
            ),
          )}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted" aria-hidden="true">
        Less
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="size-[11px] rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        More
      </div>
      <table className="sr-only">
        <caption>Study time by month</caption>
        <tbody>
          {monthTotals.map(([month, min]) => (
            <tr key={month}>
              <th scope="row">{MONTH.format(new Date(`${month}-01T00:00:00Z`))}</th>
              <td>{duration(min)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
