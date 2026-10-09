// Presentation selection and timing only. Wording and answers come from the
// real quiz and the real Chapter 1 word table.
export const FILM_DURATION = 3000
export function practiceDuration() {
  return FILM_DURATION
}
export function practiceFrame(kind, elapsed) {
  const time = Math.max(0, Math.min(FILM_DURATION, elapsed))
  if (kind === 'cards') return { flipped: time >= 350 && time < 1750, known: time >= 1350, advanced: time >= 1750, finished: time === FILM_DURATION }
  return { selected: time >= 350, feedback: time >= 700, finished: time === FILM_DURATION }
}
export function practiceTabIndex(current, key, count = 2) {
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current + count - 1) % count
  return current
}

export function shouldAdvancePreview({ finished, autoCycle, playing, visible, pageVisible, reduceMotion }) {
  return finished && autoCycle && playing && visible && pageVisible && !reduceMotion
}
