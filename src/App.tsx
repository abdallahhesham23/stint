import { Shell } from './app/Shell'
import { Notice } from './app/Notice'
import { TabTitle, TimerDriver, useScreenFocus, useTheme } from './app/effects'
import { useRoute, type Route } from './app/useRoute'
import { Rewards } from './components/Rewards'
import { Toaster } from './components/toast'
import { Today } from './screens/Today'
import { Focus } from './screens/Focus'
import { Subjects } from './screens/Subjects'
import { Log } from './screens/Log'
import { Exams } from './screens/Exams'
import { Stats } from './screens/Stats'
import { Settings } from './screens/Settings'

const SCREENS: Record<Exclude<Route, 'focus'>, () => React.JSX.Element> = {
  today: Today,
  subjects: Subjects,
  log: Log,
  exams: Exams,
  stats: Stats,
  settings: Settings,
}

export function App() {
  const route = useRoute()
  useTheme()
  useScreenFocus(route)
  const Screen = route === 'focus' ? null : SCREENS[route]

  return (
    <>
      {Screen ? (
        <Shell route={route}>
          <Notice />
          <Screen />
        </Shell>
      ) : (
        <Focus />
      )}
      <TimerDriver />
      <TabTitle />
      <Toaster />
      {route !== 'focus' && <Rewards />}
    </>
  )
}
