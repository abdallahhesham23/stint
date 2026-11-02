import { duration } from '../lib/format'

/** A duration set as a figure: numbers at full size, units small and muted ("1 h 33 min"). */
export function Dur({ min, className = 'figure' }: { min: number; className?: string }) {
  const parts = duration(min).split(' ')
  return (
    <span className={className}>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="unit">
            {' '}
            {p}
            {i < parts.length - 1 ? ' ' : ''}
          </span>
        ) : (
          p
        ),
      )}
    </span>
  )
}
