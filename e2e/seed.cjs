// Sample data for screenshots and manual checks: a term in progress, computed relative to "now".
// Usage (browser): localStorage.setItem('study-tracker', JSON.stringify(seed(new Date()))); location.reload()
function seed(now) {
  const pad = (n) => String(n).padStart(2, '0')
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const day = (offset, h = 0, m = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    d.setHours(h, m, 0, 0)
    return d
  }
  let r = 7
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647)

  const subjects = [
    { id: 'calc', name: 'Calculus II', color: 'ocean', icon: 'sigma', dailyGoalMin: 60, weeklyGoalMin: 360 },
    { id: 'chem', name: 'Organic Chemistry', color: 'moss', icon: 'flask-conical', dailyGoalMin: 45, weeklyGoalMin: 300 },
    { id: 'dsa', name: 'Data Structures', color: 'amber', icon: 'code', dailyGoalMin: 45, weeklyGoalMin: 240 },
    { id: 'writ', name: 'Technical Writing', color: 'rose', icon: 'pen-line', dailyGoalMin: 20, weeklyGoalMin: 90 },
  ].map((s) => ({ ...s, archived: false, createdAt: day(-130, 9).toISOString() }))

  const notes = ['Integration by parts, problems 4 to 9', 'Reaction mechanisms, chapter 7', 'Binary heaps and heap sort', 'Outline for the lab report', 'Past paper, question 3', '', '', '']
  const sessions = []
  let n = 0
  for (let offset = -120; offset <= 0; offset++) {
    const recent = offset > -14
    if (offset === -5) continue // this week's rest day
    if (!recent && rand() < 0.3) continue
    const count = offset === 0 ? 2 : 1 + Math.floor(rand() * (recent ? 3 : 2.4))
    const length = offset < -40 ? 25 : offset < -12 ? 28 : 31
    for (let i = 0; i < count; i++) {
      const subject = subjects[offset === 0 ? i : Math.floor(rand() * (rand() < 0.2 ? 4 : 3))]
      const evening = rand() < 0.7
      const start = day(offset, evening ? 19 + i : 10 + i * 2, Math.floor(rand() * 4) * 10)
      const completed = rand() > 0.15
      const durationSec = (completed ? length : 8 + Math.floor(rand() * (length - 8))) * 60
      sessions.push({
        id: `s${++n}`,
        subjectId: subject.id,
        startedAt: start.toISOString(),
        durationSec,
        plannedSec: length * 60,
        completed,
        note: notes[Math.floor(rand() * notes.length)],
        parked: rand() < 0.1 ? ['Email the professor about the lab'] : [],
      })
    }
  }
  // Today, in the morning: two rounds so far.
  sessions.filter((s) => s.startedAt >= day(0).toISOString()).forEach((s, i) => (s.startedAt = day(0, 9 + i, 15).toISOString()))

  const exams = [
    { id: 'e1', subjectId: 'calc', title: 'Midterm', date: key(day(9)), hoursNeeded: 20, createdAt: day(-12, 9).toISOString() },
    { id: 'e2', subjectId: 'chem', title: 'Lab practical', date: key(day(23)), hoursNeeded: 12, createdAt: day(-6, 9).toISOString() },
    { id: 'e3', subjectId: 'writ', title: 'Essay deadline', date: key(day(-10)), hoursNeeded: 6, createdAt: day(-40, 9).toISOString() },
  ]

  return {
    state: {
      version: 1,
      subjects,
      sessions,
      exams,
      settings: { name: 'Abdallah', breakMin: 5, longBreakMin: 15, roundsPerSitting: 3, staminaGoalMin: 50, weekStart: 6, theme: 'system', chime: true },
      stamina: { lengthMin: 31, floorMin: 25, completedAtLength: 2, earlyStopsInRow: 0, history: [{ date: key(day(-40)), lengthMin: 28 }, { date: key(day(-12)), lengthMin: 31 }] },
      timer: null,
      seen: { milestones: [3, 7] },
    },
    version: 1,
  }
}
if (typeof module !== 'undefined') module.exports = { seed }
