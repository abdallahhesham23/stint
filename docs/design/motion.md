# Motion: Stint · Reading room

From emil-design-eng on 2026-11-03.

**Library:** none. CSS transitions handle interruptible UI, `@starting-style` handles enter states, WAAPI (`el.animate`) handles the reward sequences, and the View Transitions API handles Today → Focus. That's zero dependencies, and it all runs off the main thread where possible.

## Tokens

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entering, feedback */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* on-screen fills and moves */
--ease-pop: cubic-bezier(0.34, 1.56, 0.64, 1);    /* small overshoot: round dots only */
--dur-press: 160ms;  --dur-hover: 150ms;  --dur-ui: 200ms;
--dur-toast: 400ms;  --dur-fill: 900ms;   --dur-reward: 600ms;
```

## Decision table (frequency decides)

| Thing | How often | Animate? | Spec |
|---|---|---|---|
| Timer digits ticking | every second | **No** | Digits swap instantly. Tabular figures stop the jitter. |
| Space (pause) / P (park) / Esc | keyboard, many times | **No** | Instant. The park field appears focused with no transition. |
| Screen change (nav) | tens a day | **No** | Instant swap. Focus moves to the new h1. |
| Hover (buttons, rows, nav) | tens a day | Colour only | `background-color`/`color` over 150ms ease, gated by `@media (hover: hover) and (pointer: fine)` |
| Press (any pressable) | tens a day | Yes, tiny | `transform: scale(0.97)` on `:active`, 160ms `--ease-out`. Icon buttons use 0.94. |
| Dialog open / close | occasional | Yes | Open: scale 0.96 → 1 with opacity, 200ms `--ease-out`, origin centre, via `@starting-style`. Close: 150ms. The backdrop fades over 200ms. |
| Toast | occasional | Yes | Enters from `translateY(100%)` with opacity over 400ms `ease` (Sonner-like). Exits over 200ms `--ease-out`. Transitions, not keyframes. The timer pauses while the tab is hidden. |
| Today → Focus (Start) | a few times a day | Yes, the doorway | `document.startViewTransition`. The root crossfades over 250ms, and the subject chip (`view-transition-name: subject`) morphs into the Focus header over 350ms `--ease-out`. Without support it is instant. |
| Focus → break | a few times a day | Yes | The page `background-color` eases to `--accent-wash` over 800ms `ease`, so the change is felt and doesn't jolt. |
| Rings on Today | on arrival and on change | Yes | `stroke-dashoffset` transitions from the previous value (0 on app load) over 900ms `--ease-in-out`. |
| Week bars / per-subject bars | on Stats open | Yes | `scaleY` (or `scaleX`) from 0 at the baseline over 500ms `--ease-out`, staggered 30ms. It never blocks interaction. |

## Reward moments (rare, so they can delight)

They should feel calm and earned. No confetti, no bounce on text, no sound beyond the chime.

1. **Session finished.**
   - The chime plays (if enabled).
   - A thin teal ring around the timer closes its last arc over 900ms `--ease-in-out`.
   - The digits fade to 0 opacity over 200ms.
   - The finish card rises 12px with opacity over 400ms `--ease-out`, 150ms after the ring closes.
   - The minutes figure counts up from 0 to N over 600ms `--ease-out`, using tabular figures.
   - Copy: "25 minutes. Nicely done."
   - When the session was stopped early, the same card appears without the ring sweep. Copy: "14 minutes, and they count."
2. **Stamina step-up.**
   - On the finish card, the ladder appears and the newly reached rung fills with `scaleX` 0 → 1 (origin left) over 700ms `--ease-out`, after a 300ms delay.
   - The label "Next round: 28 min" crossfades in with `blur(2px)` → 0.
   - **Step-down** has no motion beyond a crossfade. Its copy is kind: "Let's settle at 25 for a bit."
3. **Sitting done.**
   - The three round dots fill one after another, 120ms apart. Each scales 0.6 → 1 over 400ms `--ease-pop`.
   - Copy: "Three rounds. That's a real sitting."
   - A long break is offered.
4. **Daily goal closed** (a subject's ring reaches 100%).
   - After the fill finishes, a copy of the ring scales 1 → 1.18 while its opacity goes 0.5 → 0, over 700ms `--ease-out`. It runs once.
   - A toast says "Calculus II goal met for today."
5. **Streak milestone** (3, 7, 14, 30, 50, 100).
   - The streak figure rolls: the old figure goes out to `translateY(-60%)` while the new one comes in from `translateY(60%)`, with opacity and `blur(2px)`, over 350ms `--ease-out`.
   - A reward card says "7 days. You keep showing up." It stays 6 seconds and can be dismissed.

The reward queue (`rewards[]`) shows one event at a time. The finish card always comes first, and the others follow after 400ms. Each reward is announced through an `aria-live="polite"` region with the same words.

## Reduced motion (`prefers-reduced-motion: reduce`)

Reduced motion means fewer and gentler animations, not zero.

- **Removed:** every transform. That covers press scale, toast travel, the dialog scale, ring sweeps, bar growth, the count-up, the dot pop, the streak roll and view transitions.
- **Kept:** opacity and colour transitions of 200ms or less. The break wash still changes colour, but over 200ms. Rings and bars show their final values at once. Reward cards fade in.
- Every reward is still complete without motion: the same copy, the same filled ring, the same reached rung.

## Rules

- Transition explicit properties only, never `transition: all`. Animate only transform and opacity, with two exceptions: the ring's `stroke-dashoffset` on small SVGs, and the background colour of the break wash.
- Nothing enters from `scale(0)`. The smallest starting scale is 0.6, and only for the round dots.
- Exits are faster than entries.
- Hover effects are gated to fine pointers.
- UI animations stay under 300ms. Only the rare reward moments run longer.
