import { useEffect, useState } from 'react'

/** Counts from 0 to `target` over 600 ms with a strong ease-out; instant under reduced motion. */
export function useCountUp(target: number): number {
  const [value, setValue] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0))
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setValue(target)
    const start = performance.now()
    let id = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 600)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))))
      if (p < 1) id = requestAnimationFrame(step)
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [target])
  return value
}
