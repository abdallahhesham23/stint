import { useEffect, useSyncExternalStore } from 'react'

interface Toast {
  id: number
  text: string
  action?: { label: string; run: () => void }
}

let current: Toast | null = null
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string, action?: Toast['action']) {
  current = { id: ++seq, text, action }
  emit()
}
const dismiss = (id: number) => {
  if (current?.id === id) {
    current = null
    emit()
  }
}

/** One toast at a time, 5 s, paused while the tab is hidden. */
export function Toaster() {
  const t = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => current,
  )
  useEffect(() => {
    if (!t) return
    let left = 5000
    let started = Date.now()
    let timer = setTimeout(() => dismiss(t.id), left)
    const onVis = () => {
      if (document.hidden) {
        clearTimeout(timer)
        left -= Date.now() - started
      } else {
        started = Date.now()
        timer = setTimeout(() => dismiss(t.id), left)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [t])

  return (
    <div role="status" aria-live="polite" className="fixed z-40 inset-x-4 bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-6 flex justify-center pointer-events-none">
      {t && (
        <div key={t.id} className="toast pointer-events-auto flex items-center gap-4 pl-4 pr-2 py-2 min-h-12 text-sm max-w-md">
          <span>{t.text}</span>
          {t.action && (
            <button
              type="button"
              className="btn btn-ghost h-9 px-3"
              onClick={() => {
                t.action!.run()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
