// Presentation selection and timing only. Wording and answers come from the
// real quiz, the real Chapter 1 word table and the Chapter 4 tense figure
// (src/data/interactives/04.json, item ch4-tense-line). No Samoan is typed here.
export const FILM_DURATION = 3000
export const DRILL_PREVIEW_ITEM = 'ch4-tense-line'

// The drill cards for the home preview, read from the printed figure. A state
// is a target only when its English is unique among the states, so the answer
// is never in doubt (two particles print "I went."). The options are the first
// word of each state's sentence, in state order; the body is the rest of it.
export function splitFirstWord(sm) {
  const at = sm.indexOf(' ')
  return at < 0 ? [sm, ''] : [sm.slice(0, at), sm.slice(at + 1)]
}
export function drillPreviewCards(item) {
  const states = item?.data?.states || []
  const options = states.map((state, t) => ({ t, p: splitFirstWord(state.sm)[0] }))
  return states
    .map((state, t) => ({ state, t }))
    .filter(({ state }) => states.filter(other => other.en === state.en).length === 1)
    .map(({ state, t }) => {
      const [particle, body] = splitFirstWord(state.sm)
      return { t, target: state.en, particle, body, sm: state.sm, note: state.note, options }
    })
}
export function findDrillPreviewItem(file) {
  return (file?.items || []).find(item => item.id === DRILL_PREVIEW_ITEM) || null
}

export function practiceDuration(kind, count = 1) {
  return FILM_DURATION * (kind === 'drills' ? Math.max(1, count) : 1)
}
export function practiceFrame(kind, elapsed, count = 1) {
  const duration = practiceDuration(kind, count)
  const time = Math.max(0, Math.min(duration, elapsed))
  if (kind === 'drills') {
    const cards = Math.max(1, count)
    const exampleIndex = Math.min(Math.floor(time / FILM_DURATION), cards - 1)
    const exampleTime = time - exampleIndex * FILM_DURATION
    return { exampleIndex, selected: exampleTime >= 350, feedback: exampleTime >= 700, finished: time === duration }
  }
  if (kind === 'cards') return { flipped: time >= 350 && time < 1750, known: time >= 1350, advanced: time >= 1750, finished: time === FILM_DURATION }
  return { selected: time >= 350, feedback: time >= 700, finished: time === FILM_DURATION }
}
export function practiceTabIndex(current, key, count = 3) {
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current + count - 1) % count
  return current
}

export function shouldAdvancePreview({ finished, autoCycle, playing, visible, pageVisible, reduceMotion }) {
  return finished && autoCycle && playing && visible && pageVisible && !reduceMotion
}
