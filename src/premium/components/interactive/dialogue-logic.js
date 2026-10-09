/**
 * Pure helpers for the Dialogue figure (Dialogue.jsx): who takes part, which
 * colour each speaker gets, and how far a role-play has got. Kept apart so the
 * component file exports only a component (React Fast Refresh) and the turn
 * logic can be tested on its own (test/ix-dialogue.test.js).
 */

// Speaker keys in the order the data names them.
export function speakerKeys(speakers) {
  return speakers && typeof speakers === 'object' ? Object.keys(speakers) : []
}

// The speakers with at least one line: the parts a learner can take.
export function speakingParts(speakers, lines) {
  return speakerKeys(speakers).filter(k => lines.some(l => l.who === k))
}

// The colour step for a speaker: 0 (accent) for the first named, 1 (ink) for
// the second, 2 (muted) for a third, then round again.
export function toneOf(speakers, who) {
  const i = speakerKeys(speakers).indexOf(who)
  return i < 0 ? 0 : i % 3
}

/**
 * A role-play as speaker `me` once `said` of my lines have been shown.
 *   mine   indexes of my lines, in order
 *   said   how many of them are shown (clamped)
 *   next   index of my next line, its Samoan still hidden; null once all are said
 *   upTo   how many lines are on the page: through my next line, or all of them
 *   done   every one of my lines is said
 */
export function rolePlay(lines, me, said) {
  const mine = lines.flatMap((l, i) => (l.who === me ? [i] : []))
  const count = Math.max(0, Math.min(said, mine.length))
  const next = count < mine.length ? mine[count] : null
  return { mine, said: count, next, upTo: next === null ? lines.length : next + 1, done: next === null }
}

// Line indexes from `from` up to, not including, `to`.
export function range(from, to) {
  const out = []
  for (let i = from; i < to; i += 1) out.push(i)
  return out
}
