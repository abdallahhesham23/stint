import { daysBetween } from './dates'

const pad = (n: number) => String(n).padStart(2, '0')

export function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}

export function duration(min: number): string {
  const total = Math.round(min)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function hours(h: number): string {
  return `${Number(h.toFixed(2))} h`
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17) return 'Good evening'
  return 'Hello'
}

const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** 'Tue 3 Nov' from a day key. */
export function shortDate(key: string): string {
  return DAY.format(new Date(`${key}T00:00:00Z`)).replace(',', '')
}

export function dayLabel(key: string, todayKey: string): string {
  const diff = daysBetween(key, todayKey)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return shortDate(key)
}

const h12 = (h: number) => ({ n: h % 12 || 12, half: h % 24 < 12 ? 'am' : 'pm' })

export function hourRange(startHour: number): string {
  const a = h12(startHour)
  const b = h12((startHour + 2) % 24)
  return a.half === b.half ? `${a.n}–${b.n} ${b.half}` : `${a.n} ${a.half}–${b.n} ${b.half}`
}

export function timeOfDay(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
