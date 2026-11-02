import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number // 0..n, over 1 draws a second lap
  size?: number
  stroke?: number
  color?: string
  label: string
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Progress ring. Fills from its previous value on change; closing a lap pulses once. */
export function Ring({ value, size = 64, stroke = 6, color = 'var(--accent)', label }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [shown, setShown] = useState(0)
  const prev = useRef(0)
  const pulse = useRef<SVGCircleElement>(null)

  useEffect(() => {
    // One frame at the old value so the stroke transition has something to travel from.
    const id = requestAnimationFrame(() => setShown(value))
    if (prev.current < 1 && value >= 1 && prev.current > 0 && !reduced()) {
      pulse.current?.animate(
        [{ opacity: 0.5, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.18)' }],
        { duration: 700, delay: 900, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' },
      )
    }
    prev.current = value
    return () => cancelAnimationFrame(id)
  }, [value])

  const lap1 = Math.min(1, Math.max(0, shown))
  const lap2 = Math.min(1, Math.max(0, shown - 1))
  const arc = (v: number) => ({
    strokeDasharray: c,
    strokeDashoffset: c * (1 - v),
    transition: 'stroke-dashoffset 900ms var(--ease-in-out)',
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke} strokeLinecap="round">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} style={arc(lap1)} opacity={lap1 > 0 ? 1 : 0} />
        {/* Past the goal, a thin inner lap shows how far past, distinct from a ring that is just full. */}
        {lap2 > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r - stroke - 1}
            stroke={color}
            strokeWidth={Math.max(2, stroke / 2)}
            style={{ ...arc(lap2), strokeDasharray: 2 * Math.PI * (r - stroke - 1), strokeDashoffset: 2 * Math.PI * (r - stroke - 1) * (1 - lap2) }}
          />
        )}
        <circle
          ref={pulse}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          opacity={0}
          style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
        />
      </g>
    </svg>
  )
}
