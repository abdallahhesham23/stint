import { useEffect, useRef } from 'react'
import { ladder } from '../lib/stamina'
import type { Stamina } from '../lib/types'

interface Props {
  stamina: Stamina
  goal: number
  /** Animate the newest reached rung filling in (a step-up reward). */
  celebrate?: boolean
  pips?: boolean
}

/** The stamina ladder: every length from the floor to the goal, reached rungs in teal. */
export function Ladder({ stamina, goal, celebrate = false, pips = true }: Props) {
  const rungs = ladder(stamina.floorMin, goal)
  const reached = rungs.filter((r) => r <= stamina.lengthMin).length
  const newest = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!celebrate || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    newest.current?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: 700,
      delay: 300,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      fill: 'backwards',
    })
  }, [celebrate])

  const label = `Focus stamina: ${stamina.lengthMin} of ${goal} minutes, ${stamina.completedAtLength} of 3 rounds done at this length.`
  return (
    <div role="img" aria-label={label}>
      <div className="flex gap-1">
        {rungs.map((r, i) => (
          <div key={r} className="h-1.5 flex-1 rounded-full bg-track overflow-hidden">
            {i < reached && <div ref={i === reached - 1 ? newest : undefined} className="h-full bg-accent origin-left" />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between meta num">
        <span>{stamina.floorMin}</span>
        {pips && (
          <span className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`size-2 rounded-full ${i < stamina.completedAtLength ? 'bg-accent' : 'bg-track'}`} />
            ))}
          </span>
        )}
        <span>{goal} min</span>
      </div>
    </div>
  )
}
