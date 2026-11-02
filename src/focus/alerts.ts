let ctx: AudioContext | null = null

/** Two soft sine tones, rising: the only sound Stint makes. */
export function playChime() {
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    for (const [i, freq] of [659.25, 987.77].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = t0 + i * 0.18
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 1.5)
    }
  } catch {
    // Audio can be blocked until the first interaction; the tab title and notification still tell the user.
  }
}

export function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  try {
    new Notification(title, { body, icon: '/icon-192.png', tag: 'stint-timer' })
  } catch {
    // Some browsers only allow notifications from a service worker; the chime still plays.
  }
}

export function requestNotify(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return Promise.resolve('denied')
  return Notification.requestPermission()
}
