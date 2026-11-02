import { useSyncExternalStore } from 'react'

export const ROUTES = ['today', 'focus', 'subjects', 'log', 'exams', 'stats', 'settings'] as const
export type Route = (typeof ROUTES)[number]

const read = (): Route => {
  const r = location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(r) ? (r as Route) : 'today'
}
const subscribe = (cb: () => void) => {
  addEventListener('hashchange', cb)
  return () => removeEventListener('hashchange', cb)
}

export const go = (r: Route) => {
  location.hash = `/${r}`
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, read)
}
