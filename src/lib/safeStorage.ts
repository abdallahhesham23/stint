export type Notice = 'corrupt' | 'full'

type Backend = Pick<Storage, 'getItem' | 'setItem'>

/** Storage that never loses the user's data silently: unreadable data is set aside, a full disk is reported. */
export function createSafeStorage(backend: Backend, onNotice: (n: Notice) => void) {
  return {
    getItem(key: string): string | null {
      const raw = backend.getItem(key)
      if (raw === null) return null
      try {
        JSON.parse(raw)
        return raw
      } catch {
        try {
          backend.setItem(`${key}:corrupt`, raw)
        } catch {
          // nowhere to put it; the notice still tells the user
        }
        onNotice('corrupt')
        return null
      }
    },
    setItem(key: string, value: string): void {
      try {
        backend.setItem(key, value)
      } catch {
        onNotice('full')
      }
    },
    removeItem(): void {
      // The app never deletes its own save; replaceAll overwrites it.
    },
  }
}
