/**
 * The rules behind Match.jsx, kept pure so they can be tested: how the pairs
 * are cut into rounds, how each round's two columns are ordered, and what a
 * tap does. The component only renders this state and moves focus.
 *
 * A pair is named by its index in data.pairs; the Samoan cell and the English
 * cell of a pair share that id.
 */
import { shuffle } from './engine.js'

export const DEFAULT_ROUND = 5

// Pairs per round: a whole number of at least two, else the default.
export function roundSize(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 2 ? n : DEFAULT_ROUND
}

// Cut the items into rounds of `size`. A last round of one would be no
// match at all, so a single leftover joins the round before it.
export function planRounds(items, size = DEFAULT_ROUND) {
  const n = roundSize(size)
  const out = []
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n))
  if (out.length > 1 && out[out.length - 1].length === 1) {
    const last = out.pop()
    out[out.length - 1] = [...out[out.length - 1], ...last]
  }
  return out
}

// One round's columns, each shuffled on its own. With two or more pairs the
// English never lines up row for row with the Samoan.
export function columns(ids) {
  const sm = shuffle(ids)
  let en = shuffle(ids)
  if (ids.length > 1 && en.every((id, i) => id === sm[i])) en = [...en.slice(1), en[0]]
  return { sm, en }
}

// A fresh run through every pair: shuffled once, cut into rounds.
export function newPass(count, size) {
  return planRounds(shuffle([...Array(count).keys()]), size).map(columns)
}

export function initMatch({ pairs, size, pass }) {
  return {
    pairs,                          // the data the pass was cut from
    rounds: pass ?? newPass(pairs.length, size),
    round: 0,                       // index into rounds
    selected: null,                 // { side: 'sm' | 'en', id }: the cell waiting for its partner
    matched: [],                    // pair ids locked this pass
    missed: [],                     // pair ids that were part of a wrong pair this pass
    wrong: null,                    // { sm, en, n }: the pair flashing red
    verdicts: 0,                    // counts every judged pair (keys the flash and the status)
    last: null,                     // { kind: 'match', id } | { kind: 'miss' }, with n
    score: { right: 0, total: 0 },  // pairs matched first time / pairs matched
    streak: 0,                      // right pairs in a row
    finished: false,
    pass: 0,                        // counts the runs through the pairs (keys the grid)
  }
}

export const roundOf = state => state.rounds[state.round] ?? { sm: [], en: [] }
export const isRoundDone = state => roundOf(state).sm.every(id => state.matched.includes(id))
export const isLastRound = state => state.round >= state.rounds.length - 1

export function matchReducer(state, action) {
  switch (action.type) {
    case 'tap': {
      const { side, id } = action
      const round = roundOf(state)
      if (state.finished || (side !== 'sm' && side !== 'en') || !round[side].includes(id) || state.matched.includes(id)) return state
      const sel = state.selected
      // Nothing waiting, or a cell on the same side: this cell is chosen
      // instead (choosing the waiting cell again lets it go).
      if (!sel || sel.side === side) {
        const same = sel && sel.id === id
        return { ...state, selected: same ? null : { side, id }, wrong: null }
      }
      // One cell on each side: judge the pair.
      const sm = side === 'sm' ? id : sel.id
      const en = side === 'en' ? id : sel.id
      const n = state.verdicts + 1
      if (sm === en) {
        const first = !state.missed.includes(sm)
        return {
          ...state,
          selected: null,
          wrong: null,
          verdicts: n,
          matched: [...state.matched, sm],
          last: { kind: 'match', id: sm, n },
          score: { right: state.score.right + (first ? 1 : 0), total: state.score.total + 1 },
          streak: state.streak + 1,
        }
      }
      // A wrong pair is a miss for both items: neither can now be matched first time.
      return {
        ...state,
        selected: null,
        wrong: { sm, en, n },
        verdicts: n,
        missed: [...new Set([...state.missed, sm, en])],
        last: { kind: 'miss', n },
        streak: 0,
      }
    }
    case 'unflash':
      return state.wrong && state.wrong.n === action.n ? { ...state, wrong: null } : state
    case 'next': {
      // Only from a finished round, so a second tap on "Next round" does nothing.
      if (state.finished || !isRoundDone(state)) return state
      if (!isLastRound(state)) return { ...state, round: state.round + 1, selected: null, wrong: null, last: null }
      return { ...state, finished: true, selected: null, wrong: null }
    }
    case 'again':
      // A new pass with the score kept, like the deck's "Go again".
      if (!state.finished) return state
      return { ...initMatch({ pairs: action.pairs, pass: action.pass }), score: state.score, streak: state.streak, verdicts: state.verdicts, pass: state.pass + 1 }
    case 'reset':
      return { ...initMatch({ pairs: action.pairs, pass: action.pass }), verdicts: state.verdicts, pass: state.pass + 1 }
    default:
      return state
  }
}
