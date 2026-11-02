import { useApp } from '../store'
import { go } from '../app/useRoute'
import type { TimerKind } from '../lib/types'

/** Start a round and open Focus. The subject chip morphs into the Focus header where View Transitions exist. */
export function beginFocus(subjectId: string, kind: TimerKind, minutes: number) {
  const run = () => {
    useApp.getState().startFocus(subjectId, kind, minutes)
    go('focus')
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduced) return run()
  // The hash route renders on 'hashchange', so the transition waits for it before taking the new snapshot.
  document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        addEventListener('hashchange', () => requestAnimationFrame(() => resolve()), { once: true })
        run()
      }),
  )
}
