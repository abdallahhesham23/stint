import { useRef, useState, type ReactNode } from 'react'
import { Download, Upload } from 'lucide-react'
import { useApp, dataOf } from '../store'
import { Page, TitleRow } from '../app/Shell'
import { Dialog } from '../components/Dialog'
import { toast } from '../components/toast'
import { playChime, requestNotify } from '../focus/alerts'
import { backupFileName, parseBackup, toBackup } from '../lib/backup'
import { ladder } from '../lib/stamina'
import type { AppData, Settings as S } from '../lib/types'

function Row({ title, help, children }: { title: string; help: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10 py-8 first:pt-0 border-b border-line last:border-0">
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted max-w-[46ch]">{help}</p>
      </div>
      <div className="panel flex flex-col gap-5">{children}</div>
    </section>
  )
}

function Num({ id, label, value, min, max, step = 1, unit, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (n: number) => void }) {
  const [text, setText] = useState(String(value))
  const n = Number(text)
  const invalid = text === '' || !(n >= min && n <= max)
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative max-w-48">
        <input
          id={id}
          className="input num pr-16"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number(e.target.value)
            if (e.target.value !== '' && v >= min && v <= max) onChange(Math.round(v))
          }}
          onBlur={() => setText(String(value))}
          aria-invalid={invalid}
          aria-describedby={`${id}-range`}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 meta">{unit}</span>
      </div>
      <p id={`${id}-range`} className={`meta mt-1.5 ${invalid ? '!text-negative' : ''}`} aria-live="polite">
        {invalid ? `Pick a number from ${min} to ${max}. Still using ${value}.` : `${min} to ${max} ${unit}`}
      </p>
    </div>
  )
}

function Segmented<T extends string | number>({ name, label, value, options, onChange }: { name: string; label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="segmented">
        {options.map((o) => (
          <label key={String(o.value)}>
            <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Settings() {
  const settings = useApp((s) => s.settings)
  const stamina = useApp((s) => s.stamina)
  const update = useApp((s) => s.updateSettings)
  const set = <K extends keyof S>(k: K) => (v: S[K]) => update({ [k]: v } as Partial<S>)
  const [permission, setPermission] = useState(() => ('Notification' in window ? Notification.permission : 'denied'))
  const [pending, setPending] = useState<{ data: AppData; counts: { subjects: number; sessions: number; exams: number } } | null>(null)
  const [importError, setImportError] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const rungs = ladder(stamina.floorMin, settings.staminaGoalMin)

  const exportData = () => {
    const now = new Date()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([toBackup(dataOf(useApp.getState()), now)], { type: 'application/json' }))
    a.download = backupFileName(now)
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Backup saved to your downloads.')
  }

  const readFile = async (f: File | undefined) => {
    setImportError('')
    if (!f) return
    if (f.size > 20_000_000) return setImportError('That file is too large to be a Stint backup.')
    const r = parseBackup(await f.text())
    if (r.ok) setPending({ data: r.data, counts: r.counts })
    else setImportError(r.reason)
    if (file.current) file.current.value = ''
  }

  return (
    <Page>
      <TitleRow title="Settings" line="Changes save as you make them." />

      <Row title="You" help="Used in the greeting on Today. Leave it empty if you prefer.">
        <div>
          <label htmlFor="name" className="label">
            Your name
          </label>
          <input id="name" className="input max-w-sm" value={settings.name} maxLength={30} placeholder="Abdallah" autoComplete="given-name" onChange={(e) => update({ name: e.target.value })} />
        </div>
      </Row>

      <Row
        title="Rounds and breaks"
        help={`Rounds start at ${stamina.floorMin} minutes and grow toward your goal: ${rungs.join(', ')}. You’re at ${stamina.lengthMin}.`}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Num id="break" label="Short break" value={settings.breakMin} min={1} max={30} unit="min" onChange={set('breakMin')} />
          <Num id="long" label="Long break" value={settings.longBreakMin} min={5} max={60} unit="min" onChange={set('longBreakMin')} />
          <Num id="rounds" label="Rounds in a sitting" value={settings.roundsPerSitting} min={1} max={6} unit="rounds" onChange={set('roundsPerSitting')} />
          <Num id="goal" label="Stamina goal" value={settings.staminaGoalMin} min={stamina.floorMin} max={90} step={5} unit="min" onChange={set('staminaGoalMin')} />
        </div>
      </Row>

      <Row title="Week" help="Weekly goals and the weekly rest day follow this.">
        <Segmented
          name="weekStart"
          label="Week starts on"
          value={settings.weekStart}
          options={[
            { value: 6, label: 'Saturday' },
            { value: 0, label: 'Sunday' },
            { value: 1, label: 'Monday' },
          ]}
          onChange={set('weekStart')}
        />
      </Row>

      <Row title="Appearance" help="System follows your computer, light by day and dark at night if you’ve set it up that way.">
        <Segmented
          name="theme"
          label="Theme"
          value={settings.theme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={set('theme')}
        />
      </Row>

      <Row title="Sound and alerts" help="A soft chime when a round or a break ends, and a notification if Stint is in another tab.">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="chime" className="text-sm font-medium">
            Chime
          </label>
          <span className="flex items-center gap-3">
            <button type="button" className="link" onClick={playChime}>
              Play it
            </button>
            <input id="chime" type="checkbox" role="switch" className="switch" checked={settings.chime} onChange={(e) => update({ chime: e.target.checked })} />
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Notifications</p>
            <p className="meta mt-0.5">
              {permission === 'granted' ? 'On. Stint tells you when a break ends.' : permission === 'denied' ? 'Blocked in your browser settings. The chime still plays.' : 'Off for now.'}
            </p>
          </div>
          {permission === 'default' && (
            <button type="button" className="btn btn-secondary" onClick={async () => setPermission(await requestNotify())}>
              Turn on notifications
            </button>
          )}
        </div>
      </Row>

      <Row title="Your data" help="Everything stays on this device. Save a backup now and then so you never lose it, and to move to another computer.">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-secondary" onClick={exportData}>
            <Download size={16} strokeWidth={1.75} aria-hidden="true" />
            Save a backup
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => file.current?.click()}>
            <Upload size={16} strokeWidth={1.75} aria-hidden="true" />
            Restore from a backup
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => readFile(e.target.files?.[0])} />
        </div>
        {importError && (
          <p role="alert" className="text-sm text-negative">
            {importError}
          </p>
        )}
      </Row>

      <Dialog open={!!pending} onClose={() => setPending(null)} title="Restore this backup?">
        {pending && (
          <>
            <p className="text-sm">
              This replaces what’s on this device with {pending.counts.subjects} {pending.counts.subjects === 1 ? 'subject' : 'subjects'}, {pending.counts.sessions}{' '}
              {pending.counts.sessions === 1 ? 'session' : 'sessions'} and {pending.counts.exams} {pending.counts.exams === 1 ? 'exam' : 'exams'}.
            </p>
            <p className="text-sm text-muted mt-2">If you want to keep what’s here too, save a backup of it first.</p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  useApp.getState().replaceAll(pending.data)
                  setPending(null)
                  toast('Backup restored.')
                }}
              >
                Replace my data
              </button>
            </div>
          </>
        )}
      </Dialog>
    </Page>
  )
}
