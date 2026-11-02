import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Native <dialog>: focus trap, Esc and focus return come from the platform. */
export function Dialog({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // Keep the last content while the sheet fades out, so it never closes empty.
  const shown = useRef(children)
  if (open) shown.current = children
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 id={titleId} className="screen-title">
            {title}
          </h2>
          <button type="button" className="btn-icon -mr-2 -mt-1" aria-label="Close" onClick={onClose}>
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {shown.current}
      </div>
    </dialog>
  )
}
