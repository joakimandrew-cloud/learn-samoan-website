/**
 * Shared game code: the fair-answer rules (pure, no React).
 *
 * Every game that shows a right answer among wrong choices uses the same test
 * for "could this pass for the right answer". A wrong choice is never a second
 * right answer:
 *   - its shown meaning never equals the target's;
 *   - it shares no comma- or semicolon-separated meaning item with the target;
 *   - it never has the target's spelling, and never folds to the same letters
 *     once the macrons and the ʻ are taken off (tama and tamā are two words
 *     that read alike; neither may sit beside the other);
 *   - it shares no content word with the target, over the WHOLE printed
 *     meaning with its bracketed notes kept ("lie (down)" is never offered
 *     against "lie down", nor "letter, book (also: write)" against "write").
 *     The test reads both cards' words, so it holds in both directions.
 * Also here: the seeded random number generator and the shuffle every game
 * draws from.
 */

/** Seeded PRNG (mulberry32), so tests and the title screens can repeat. */
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** True when the two cards share a content word in any of their meanings. */
export function shareWord(a, b) {
  const words = new Set(a.words)
  return b.words.some(w => words.has(w))
}

/** True when `other` could pass for a right answer to `target`. */
export function clashes(target, other) {
  if (other.id === target.id) return true
  if (other.key === target.key) return true
  if (other.fold === target.fold) return true
  if (other.meaning.toLowerCase() === target.meaning.toLowerCase()) return true
  const items = new Set(target.items)
  if (other.items.some(i => items.has(i))) return true
  return shareWord(target, other)
}
