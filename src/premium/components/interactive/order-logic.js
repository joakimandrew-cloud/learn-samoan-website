/**
 * The rules behind the Order practice (Order.jsx): which tiles a card offers,
 * how they are shuffled, and whether the tiles a learner placed spell the
 * chapter's sentence or one of its accepted alternatives. Plain functions,
 * no React, tested in test/ix-order.test.js. Every word comes from the
 * chapter data; nothing here knows any Samoan.
 */

// A sentence's final stop, by the honesty gate's own rule
// (scripts/check-interactives.mjs), so the tiles shown are the tiles checked.
export const SENTENCE_END = /[.?!]+$/

export function finalStop(sentence) {
  return String(sentence ?? '').trim().match(SENTENCE_END)?.[0] ?? ''
}

export function withoutStop(sentence) {
  return String(sentence ?? '').trim().replace(SENTENCE_END, '').trim()
}

const words = s => String(s ?? '').trim().split(/\s+/).filter(Boolean)

// The tiles of a card in the sentence's order: the item's own tiles (a tile
// may hold more than one word), or the sentence without its final stop, cut
// at the spaces.
export function targetTiles(item) {
  if (Array.isArray(item?.tiles) && item.tiles.length) return item.tiles.map(t => String(t).trim()).filter(Boolean)
  return words(withoutStop(item?.sm))
}

// Everything a card lets the learner tap: its tiles, then the extra words
// that do not belong. Each tile has its own id, so a word printed twice is
// two tiles.
export function poolTiles(item) {
  const extra = (Array.isArray(item?.extra) ? item.extra : []).map(t => String(t).trim()).filter(Boolean)
  return [
    ...targetTiles(item).map((text, i) => ({ id: `t${i}`, text })),
    ...extra.map((text, i) => ({ id: `x${i}`, text })),
  ]
}

// One word, two spellings: a capital that only opens the sentence, or an
// apostrophe standing in for the glottal stop, is still the same word.
export function wordKey(word) {
  return String(word).normalize('NFC').replace(/[‘’'`ʼ]/g, 'ʻ').toLowerCase()
}

// Do the chapter's tiles already lie in the sentence's order (extras
// between them or not)? Then a pool would hand the answer over.
export function solvedInPool(item, pool) {
  const target = targetTiles(item).map(wordKey).join(' ')
  return pool.filter(t => t.id.startsWith('t')).map(t => wordKey(t.text)).join(' ') === target
}

// The pool for one showing of a card, shuffled with the given shuffle, and
// shuffled again while it shows the sentence in order. A sentence whose
// words are all the same can only come out in order, so the tries are capped.
export function shuffledPool(item, shuffle) {
  const tiles = poolTiles(item)
  let pool = shuffle(tiles)
  for (let tries = 0; tries < 20 && tiles.length > 1 && solvedInPool(item, pool); tries += 1) pool = shuffle(tiles)
  return pool
}

/**
 * Check the placed tiles (their texts, in order). Right when the words,
 * joined with single spaces, are the chapter's sentence (its tiles in order)
 * or one of item.accept, each without its final stop. Identical words are
 * interchangeable, and so are two spellings of one word (wordKey).
 *
 * Returns { right, shown }: on a right answer `shown` is the matched
 * sentence's own spelling cut at the placed tiles' edges, so the sentence
 * reads as printed even when a capitalised word swapped places with its
 * lower-case twin. Otherwise `shown` is the placed texts as they are.
 */
export function checkOrder(item, placed) {
  const texts = (placed || []).map(t => String(t).trim())
  const built = words(texts.join(' '))
  if (!built.length) return { right: false, shown: texts }
  const sentences = [targetTiles(item).join(' '), ...(Array.isArray(item?.accept) ? item.accept : []).map(withoutStop)]
  for (const sentence of sentences) {
    const target = words(sentence)
    if (target.length !== built.length || !target.every((w, i) => wordKey(w) === wordKey(built[i]))) continue
    let at = 0
    const shown = texts.map(t => {
      const n = words(t).length
      const part = target.slice(at, at + n).join(' ')
      at += n
      return part
    })
    return { right: true, shown }
  }
  return { right: false, shown: texts }
}
