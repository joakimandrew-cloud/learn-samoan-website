/**
 * The pure part of the Sort practice: what each pile holds this round, how a
 * pile looks once a word is answered, and recording a choice exactly once.
 * Kept out of Sort.jsx so the widget file exports a component only.
 */

/**
 * Every word sorted so far this round, in its right pile, newest first. A word
 * the learner sent to another pile still lands in its right one, marked missed.
 *   bins    [{ id }]
 *   order   the round's deck: items with .bin
 *   sorted  how many of them have been answered
 *   picks   { place in the deck: the bin id chosen there }
 */
export function pilesFor(bins, order, sorted, picks) {
  const piles = Object.fromEntries(bins.map(b => [b.id, []]))
  for (let at = Math.min(sorted, order.length) - 1; at >= 0; at -= 1) {
    const item = order[at]
    piles[item.bin]?.push({ item, missed: picks[at] !== item.bin })
  }
  return piles
}

/* The class a pile takes: the chosen one is right or wrong, the right one is
   revealed when the choice missed it, and the rest step back. */
export function binState(binId, { answered, guess, answer }) {
  if (!answered) return ''
  if (binId === guess) return guess === answer ? 'is-answer' : 'is-chosen-wrong'
  return binId === answer ? 'is-revealed-answer' : 'is-dim'
}

/**
 * A round's picks belong to one dealt deck; a new deck starts with none. The
 * first pick at a place stands, so a second tap on the same card changes
 * nothing.
 *   round  { deck, picks }
 */
export function recordPick(round, order, at, binId) {
  const base = round.deck === order ? round.picks : {}
  return base[at] != null ? round : { deck: order, picks: { ...base, [at]: binId } }
}
