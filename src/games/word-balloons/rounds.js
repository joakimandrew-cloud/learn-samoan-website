/**
 * Word Balloons: round generation (pure, no React).
 *
 * A round is one target card and its answer options: the target's own face
 * plus wrong choices drawn from the set the player picked, then from the whole
 * deck when the set has no more that could be passed over safely. A wrong
 * choice is never a second right answer (shared/fair.js clashes()):
 *   - its shown meaning never equals the target's;
 *   - it shares no meaning item with the target;
 *   - it never has the target's spelling or folds to the same letters;
 *   - it shares no content word with the target, over the whole printed
 *     meanings with their notes kept, and no two wrong choices share one
 *     either;
 *   - no two options read the same.
 * The data has no part of speech, so the choices are not matched by kind.
 */
import { shuffle, clashes } from '../shared/fair.js'

/** Directions: the moving word is Sāmoan (tap the English) or the reverse. */
export const DIRECTIONS = ['to-english', 'to-samoan']

/** What a card shows on its face in a direction. */
export function moverText(card, direction) {
  return direction === 'to-samoan' ? card.meaning : card.samoanShown
}
export function optionText(card, direction) {
  return direction === 'to-samoan' ? card.samoanShown : card.meaning
}

/**
 * One round. `avoid` is a set of card ids not to use as the target (the last
 * few words, so the same word does not come straight back). `target` fixes
 * the target (tests and the title screen). `fallback` is the wider deck a set
 * draws its wrong choices from once the set itself has no more.
 * Returns { target, options: [card], labels: [string], correctIndex, mover }.
 */
export function makeRound(deck, rng, { direction = 'to-english', optionCount = 4, avoid = null, fallback = null, target: fixed = null } = {}) {
  const free = avoid && avoid.size ? deck.filter(c => !avoid.has(c.id)) : deck
  const pool = free.length ? free : deck
  const target = fixed ?? pool[Math.floor(rng() * pool.length)]
  const label = c => optionText(c, direction)
  const chosen = []
  const seenLabels = new Set([label(target).toLowerCase()])

  const tryAdd = candidates => {
    for (const c of shuffle(candidates, rng)) {
      if (chosen.length >= optionCount - 1) return
      if (clashes(target, c)) continue
      const l = label(c).toLowerCase()
      if (seenLabels.has(l)) continue
      // Two wrong choices that read alike would leave a learner who knows the
      // right answer still guessing between them; one is enough.
      if (chosen.some(d => clashes(d, c))) continue
      chosen.push(c)
      seenLabels.add(l)
    }
  }
  tryAdd(deck)
  if (fallback && chosen.length < optionCount - 1) tryAdd(fallback)

  const options = shuffle([target, ...chosen], rng)
  return {
    target,
    options,
    labels: options.map(label),
    correctIndex: options.indexOf(target),
    mover: moverText(target, direction),
    direction,
  }
}
