import { useEffect, useState } from 'react'

/** Current time, refreshed every second while `live`; once a minute otherwise so "today" rolls over. */
export function useNow(live: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), live ? 1000 : 60_000)
    return () => clearInterval(id)
  }, [live])
  return now
}
