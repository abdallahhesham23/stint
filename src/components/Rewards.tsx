import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../store'
import { Ladder } from './Ladder'
import type { RewardEvent } from '../lib/flow'

function copy(e: RewardEvent, subjectName: (id: string) => string): { title: string; body: string } | null {
  switch (e.type) {
    case 'staminaUp':
      return { title: 'Your focus is growing.', body: `Next round: ${e.lengthMin} minutes.` }
    case 'staminaDown':
      return { title: `Let’s settle at ${e.lengthMin} for a bit.`, body: 'Rounds you finish build focus fastest.' }
    case 'sittingDone':
      return { title: `${e.rounds === 3 ? 'Three' : e.rounds} rounds. That’s a real sitting.`, body: 'Take the long break. You’ve earned it.' }
    case 'dailyGoal':
      return { title: `${subjectName(e.subjectId)} goal met for today.`, body: 'Anything more is a bonus.' }
    case 'streak':
      return { title: `${e.days} days. You keep showing up.`, body: 'Rest days are built in, so there’s no pressure.' }
    default:
      return null
  }
}

/** Reward moments, one at a time. The finished-session moment lives on the Focus screen, so it is skipped here. */
export function Rewards({ inline = false }: { inline?: boolean }) {
  const reward = useApp((s) => s.rewards[0])
  const subjects = useApp((s) => s.subjects)
  const stamina = useApp((s) => s.stamina)
  const goal = useApp((s) => s.settings.staminaGoalMin)
  const shift = useApp((s) => s.shiftReward)
  const card = useRef<HTMLDivElement>(null)

  // Memoised on the event itself: the break screen re-renders every second and must not restart the timer or the entrance.
  const text = useMemo(() => (reward ? copy(reward, (id) => subjects.find((s) => s.id === id)?.name ?? 'Your') : null), [reward, subjects])

  useEffect(() => {
    if (!reward) return
    if (!text) return shift()
    // Let the finish card land first, then hold for 6 s.
    const id = setTimeout(shift, 6400)
    return () => clearTimeout(id)
  }, [reward, text, shift])

  useEffect(() => {
    if (!text || !card.current) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    card.current.animate(
      reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(-12px) scale(0.98)' }, { opacity: 1, transform: 'none' }],
      { duration: reduced ? 200 : 400, delay: 400, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' },
    )
  }, [reward, text])

  return (
    <div aria-live="polite" className={inline ? 'w-full max-w-lg mt-3' : 'fixed z-40 inset-x-4 top-4 md:top-6 flex justify-center pointer-events-none'}>
      {reward && text && (
        <div ref={card} key={JSON.stringify(reward)} className={`${inline ? 'card' : 'toast max-w-sm'} pointer-events-auto w-full p-4 pr-3 flex gap-3`}>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium">{text.title}</p>
            <p className="text-sm text-muted mt-0.5">{text.body}</p>
            {reward.type === 'staminaUp' && (
              <div className="mt-3">
                <Ladder stamina={stamina} goal={goal} celebrate pips={false} />
              </div>
            )}
          </div>
          <button type="button" className="btn-icon -mt-1 size-9" aria-label="Dismiss" onClick={shift}>
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
