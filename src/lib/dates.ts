// Day keys are local calendar dates ('YYYY-MM-DD'). Math on keys goes through UTC so DST never shifts a day.

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const utc = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const fromUtc = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function addDays(key: string, n: number): string {
  return fromUtc(utc(key) + n * 86_400_000)
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((utc(toKey) - utc(fromKey)) / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: string): number {
  return new Date(utc(key)).getUTCDay()
}

export function weekStartKey(key: string, weekStart: number): string {
  return addDays(key, -((weekday(key) - weekStart + 7) % 7))
}
