/** Stint's mark: one stint, an arc of a ring three-quarters closed. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="var(--track)" strokeWidth="3" />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 8.5 * 0.72} 100`}
        transform="rotate(-90 12 12)"
      />
    </svg>
  )
}
