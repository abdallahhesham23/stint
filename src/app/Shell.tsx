import type { ReactNode } from 'react'
import { BarChart3, BookMarked, CalendarClock, House, ListChecks, Settings as Gear } from 'lucide-react'
import { Mark } from '../components/Mark'
import type { Route } from './useRoute'

const NAV: { route: Route; label: string; Icon: typeof House }[] = [
  { route: 'today', label: 'Today', Icon: House },
  { route: 'subjects', label: 'Subjects', Icon: BookMarked },
  { route: 'log', label: 'Log', Icon: ListChecks },
  { route: 'exams', label: 'Exams', Icon: CalendarClock },
  { route: 'stats', label: 'Stats', Icon: BarChart3 },
]

/** Open-plane shell: a labelled sidebar on the page ground on desktop, a five-tab bar on phones. */
export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-secondary bg-raised">
        Skip to content
      </a>
      <aside className="hidden md:flex flex-col sticky top-0 h-dvh px-3 py-6">
        <a href="#/today" className="flex items-center gap-2.5 px-2.5 mb-8 text-[17px] font-semibold tracking-[-0.01em]">
          <Mark size={22} />
          Stint
        </a>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV.map(({ route: r, label, Icon }) => (
            <a key={r} href={`#/${r}`} className="nav-item" aria-current={route === r ? 'page' : undefined}>
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </a>
          ))}
        </nav>
        <a href="#/settings" className="nav-item mt-auto" aria-current={route === 'settings' ? 'page' : undefined}>
          <Gear size={16} strokeWidth={1.75} aria-hidden="true" />
          Settings
        </a>
      </aside>

      <main id="main" className="pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-16">{children}</main>

      <nav
        aria-label="Main"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-ground border-t border-line grid grid-cols-5 pb-[env(safe-area-inset-bottom)]"
      >
        {NAV.map(({ route: r, label, Icon }) => {
          const on = route === r
          return (
            <a
              key={r}
              href={`#/${r}`}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 h-14 text-xs ${on ? 'text-ink' : 'text-muted'}`}
            >
              <Icon size={20} strokeWidth={on ? 2 : 1.75} aria-hidden="true" />
              {label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

/** The canvas column: 1100px max, 12 columns, one 16px gap. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1100px] px-4 md:px-8 pt-6 md:pt-10">{children}</div>
}

export function TitleRow({ title, line, action }: { title: string; line?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-6 md:mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="screen-title" tabIndex={-1} data-screen-title>
          {title}
        </h1>
        {line && <p className="mt-1 text-[15px] text-muted">{line}</p>}
      </div>
      {action}
    </header>
  )
}
