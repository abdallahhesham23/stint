import { expect, test } from 'vitest'
import { createSafeStorage, type Notice } from './safeStorage'

const backend = (init: Record<string, string> = {}, full = false) => {
  const m = new Map(Object.entries(init))
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (full) throw new DOMException('quota', 'QuotaExceededError')
      m.set(k, v)
    },
  }
}

test('corrupt saved data is kept aside and reported, never thrown', () => {
  const b = backend({ 'study-tracker': '{not json' })
  const notices: Notice[] = []
  expect(createSafeStorage(b, (n) => notices.push(n)).getItem('study-tracker')).toBeNull()
  expect(b.m.get('study-tracker:corrupt')).toBe('{not json')
  expect(notices).toEqual(['corrupt'])
})

test('a full store reports instead of throwing', () => {
  const notices: Notice[] = []
  expect(() => createSafeStorage(backend({}, true), (n) => notices.push(n)).setItem('study-tracker', '{}')).not.toThrow()
  expect(notices).toEqual(['full'])
})

test('valid values pass through', () => {
  const b = backend()
  const s = createSafeStorage(b, () => {})
  s.setItem('study-tracker', '{"a":1}')
  expect(s.getItem('study-tracker')).toBe('{"a":1}')
})
