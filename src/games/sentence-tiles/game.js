/**
 * Sentence Tiles: the game state (a pure reducer, no React, no randomness).
 *
 * The page supplies every random choice (the round's shuffled tiles) and the
 * time each action was sent (`now`, read only by the tap lockouts) inside the
 * action, so the same actions always give the same game.
 *
 * Untimed: there is no clock, no time-out and no countdown. A sentence stays
 * until it is built.
 *
 * One game is one chapter. `start` names the chapter and how many sentences it
 * holds; the page deals them one at a time; the game ends ('over', the
 * chapter's finish card) once the last of them is built.
 *
 * Phases: title -> playing -> over.
 * One sentence is on screen at a time (`round`). Its status:
 *   building  the player is putting tiles in the line
 *   done      the sentence is finished; it scores, then the next comes
 *
 * The game marks against the order the book prints. A tap that is not the next
 * word of the book's order (or of an order the item accepts) is an OFF-ORDER
 * tap, not a wrong answer: the tile stays in the tray, the page says "not the
 * book's order" and shows the book's sentence, the streak starts again, and
 * that is all it costs. There are no lives. A sentence built with any
 * off-order tap goes on the finish card's list of sentences to look at again.
 *
 * Scoring has no time term: a sentence built with no filled word scores the
 * shared base points (pointsFor with no time given) times the streak
 * multiplier.
 *
 * Fill-in: `fill` places the next word of the order the line follows, exactly
 * as a right tap would. A filled word costs nothing but scores nothing: the
 * sentence scores its points times the share of words the player placed (a
 * fully filled sentence scores 0). A sentence with any filled word leaves the
 * streak as it was, counts in `helped`, not in `correct`, and goes on the list
 * to look at again.
 */
import { pointsFor, multiplierFor } from '../shared/scoring.js'
import { isNextWord, fillSlot } from './rounds.js'

/**
 * A new sentence ignores taps for this long (ms), so the second tap of a
 * quick double tap on the last tile never lands on the next sentence; the
 * same off-order tile tapped again inside it is the same tap, not a second cost.
 */
export const TAP_LOCKOUT_MS = 250

export function initialGame(extra = {}) {
  return {
    phase: 'title', // title | playing | over
    gameId: 0,
    chapter: null, // the chapter this game plays
    total: 0, // sentences in the chapter
    paused: false,
    round: null,
    nextKey: 1,
    since: null, // { key, at }: when the current sentence was dealt
    score: 0,
    correct: 0, // sentences finished with no filled word
    helped: 0, // sentences finished with at least one filled word
    filledWords: 0, // words placed by the fill-in, this game
    streak: 0,
    bestStreak: 0,
    offOrderTaps: 0, // taps off the book's order so far
    missed: [], // sentences built with an off-order tap or a filled word, once each
    ...extra,
  }
}

/** Sentences of the chapter finished so far. */
export function finishedCount(state) {
  return state.correct + state.helped
}

/** True when taps are held (not playing, paused, or no sentence being built). */
export function isFrozen(state) {
  return state.phase !== 'playing' || state.paused || !state.round || state.round.status !== 'building'
}

function addMissed(list, sentence) {
  return list.some(s => s.id === sentence.id) ? list : [...list, sentence]
}

/** True when a tap or fill-in for this round arrives inside the new-sentence lockout. */
function lockedOut(state, round, now) {
  return now != null && state.since?.key === round.key && state.since.at != null && now - state.since.at < TAP_LOCKOUT_MS
}

/** Puts a tile in the line (a right tap, or a fill-in when `filled`); finishes the sentence when it is complete. */
function place(state, slot, filled) {
  const { round } = state
  const placed = [...round.placed, slot]
  const filledAt = filled ? [...(round.filled ?? []), round.placed.length] : (round.filled ?? [])
  const filledWords = state.filledWords + (filled ? 1 : 0)
  if (placed.length < round.sentence.words.length) return { ...state, filledWords, round: { ...round, placed, filled: filledAt } }
  const total = round.sentence.words.length
  const own = total - filledAt.length
  const missed = filledAt.length > 0 || round.offs > 0 ? addMissed(state.missed, round.sentence) : state.missed
  if (filledAt.length > 0) {
    // Helped: points for the player's own share only, at the streak as it stands; the streak stays.
    const full = pointsFor({ streak: state.streak })
    const gain = Math.round((full * own) / total)
    return {
      ...state,
      filledWords,
      missed,
      round: { ...round, placed, filled: filledAt, status: 'done', gain, mult: multiplierFor(state.streak) },
      score: state.score + gain,
      helped: state.helped + 1,
    }
  }
  const streak = state.streak + 1
  const gain = pointsFor({ streak })
  return {
    ...state,
    filledWords,
    missed,
    round: { ...round, placed, filled: filledAt, status: 'done', gain, mult: multiplierFor(streak) },
    score: state.score + gain,
    correct: state.correct + 1,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
  }
}

function reduce(state, action) {
  switch (action.type) {
    case 'start': {
      const total = Math.max(0, Math.floor(Number(action.total) || 0))
      return { ...initialGame({ gameId: state.gameId + 1, chapter: action.chapter ?? null, total }), phase: 'playing' }
    }
    case 'deal': {
      if (state.phase !== 'playing' || state.paused || state.round || !action.round) return state
      if (finishedCount(state) >= state.total) return state
      const key = state.nextKey
      return {
        ...state,
        nextKey: key + 1,
        round: { ...action.round, key, placed: [], filled: [], offs: 0, status: 'building', gain: 0, mult: 1, off: null },
        since: { key, at: action.now ?? null },
      }
    }
    case 'pick': {
      if (isFrozen(state)) return state
      const { round } = state
      // A tap is for one sentence only.
      if (action.key != null && action.key !== round.key) return state
      const tile = round.tiles.find(t => t.slot === action.slot)
      if (!tile || round.placed.includes(tile.slot)) return state
      const now = action.now
      if (lockedOut(state, round, now)) return state
      if (now != null && round.off && round.off.slot === tile.slot && now - round.off.at < TAP_LOCKOUT_MS) return state
      if (!isNextWord(round.sentence, round.placed.map(sl => round.tiles.find(t => t.slot === sl)?.text), tile.text)) {
        const offOrderTaps = state.offOrderTaps + 1
        return {
          ...state,
          offOrderTaps,
          streak: 0,
          round: { ...round, offs: round.offs + 1, off: { slot: tile.slot, at: now ?? null, n: offOrderTaps, placedAt: round.placed.length } },
        }
      }
      return place(state, tile.slot, false)
    }
    case 'fill': {
      // The fill-in: the next word of the order the line follows, as a right tap would place it.
      if (isFrozen(state)) return state
      const { round } = state
      if (action.key != null && action.key !== round.key) return state
      if (lockedOut(state, round, action.now)) return state
      const slot = fillSlot(round.sentence, round.tiles, round.placed)
      if (slot == null) return state
      return place(state, slot, true)
    }
    case 'next': {
      if (!state.round || state.round.status === 'building') return state
      if (finishedCount(state) >= state.total) return { ...state, round: null, paused: false, phase: 'over' }
      return { ...state, round: null }
    }
    case 'pause':
      if (state.phase !== 'playing' || state.paused) return state
      return { ...state, paused: true }
    case 'resume':
      return state.paused ? { ...state, paused: false } : state
    case 'quit':
      return initialGame({ gameId: state.gameId })
    default:
      return state
  }
}

export function gameReducer(state, action) {
  return reduce(state, action)
}
