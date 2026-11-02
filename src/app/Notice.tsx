import { useApp, STORAGE_KEY } from '../store'

function downloadCorrupt() {
  const raw = localStorage.getItem(`${STORAGE_KEY}:corrupt`) ?? ''
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
  a.download = 'study-old-data.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Storage problems, said calmly, inside the canvas. */
export function Notice() {
  const notice = useApp((s) => s.notice)
  const dismiss = useApp((s) => s.dismissNotice)
  if (!notice) return null
  return (
    <div className="mx-auto max-w-[1100px] px-4 md:px-8 pt-4">
      <div role="status" className="panel !py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className="flex-1 min-w-60">
          {notice === 'corrupt'
            ? "We couldn't read your saved data, so we started fresh. Your old data is safe to download."
            : 'Storage is full. Export a backup to be safe.'}
        </p>
        {notice === 'corrupt' ? (
          <button type="button" className="btn btn-secondary h-9" onClick={downloadCorrupt}>
            Download old data
          </button>
        ) : (
          <a href="#/settings" className="btn btn-secondary h-9">
            Export a backup
          </a>
        )}
        <button type="button" className="link" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
