// The Match practice rules (src/premium/components/interactive/match-logic.js):
// rounds, column order, and what each tap does to the score.
import { describe, expect, it } from 'vitest'
import { columns, initMatch, isRoundDone, matchReducer, newPass, planRounds, roundOf, roundSize } from '../src/premium/components/interactive/match-logic.js'

const range = n => [...Array(n).keys()]
const sizes = rounds => rounds.map(r => r.length)

describe('match rounds', () => {
  it('reads the round size, defaulting to five', () => {
    expect(roundSize(undefined)).toBe(5)
    expect(roundSize(4)).toBe(4)
    expect(roundSize('6')).toBe(6)
    for (const bad of [0, 1, -3, 2.5, 'x', null]) expect(roundSize(bad)).toBe(5)
  })

  it('cuts pairs into rounds and never leaves one pair alone', () => {
    expect(sizes(planRounds(range(9), 5))).toEqual([5, 4])
    expect(sizes(planRounds(range(10), 5))).toEqual([5, 5])
    expect(sizes(planRounds(range(11), 5))).toEqual([5, 6])
    expect(sizes(planRounds(range(6), 5))).toEqual([6])
    expect(sizes(planRounds(range(4), 5))).toEqual([4])
    expect(sizes(planRounds(range(9), 4))).toEqual([4, 5])
    expect(sizes(planRounds(range(12), 4))).toEqual([4, 4, 4])
    expect(sizes(planRounds(range(1), 5))).toEqual([1])
    expect(planRounds([], 5)).toEqual([])
    for (let n = 2; n <= 30; n += 1) {
      for (const size of [2, 3, 4, 5, 6]) {
        const rounds = planRounds(range(n), size)
        expect(rounds.flat()).toEqual(range(n))
        expect(rounds.every(r => r.length >= 2)).toBe(true)
      }
    }
  })

  it('orders each column on its own, never row for row', () => {
    for (let k = 0; k < 300; k += 1) {
      const ids = range(2 + (k % 5))
      const { sm, en } = columns(ids)
      expect([...sm].sort()).toEqual(ids)
      expect([...en].sort()).toEqual(ids)
      expect(en.every((id, i) => id === sm[i])).toBe(false)
    }
  })

  it('covers every pair once per pass', () => {
    const pass = newPass(11, 5)
    expect(pass.map(r => r.sm.length)).toEqual([5, 6])
    expect(pass.flatMap(r => r.sm).sort((a, b) => a - b)).toEqual(range(11))
    expect(pass.flatMap(r => r.en).sort((a, b) => a - b)).toEqual(range(11))
  })
})

// A fixed pass: round one holds pairs 0-2, round two pairs 3-4.
const PAIRS = range(5).map(i => ({ sm: `s${i}`, en: `e${i}` }))
const PASS = [{ sm: [0, 1, 2], en: [2, 0, 1] }, { sm: [3, 4], en: [4, 3] }]
const start = () => initMatch({ pairs: PAIRS, pass: PASS })
const run = (state, ...actions) => actions.reduce(matchReducer, state)
const tap = (side, id) => ({ type: 'tap', side, id })

describe('match taps', () => {
  it('locks a right pair chosen from either side first', () => {
    let s = run(start(), tap('sm', 0), tap('en', 0))
    expect(s.matched).toEqual([0])
    expect(s.score).toEqual({ right: 1, total: 1 })
    expect(s.streak).toBe(1)
    expect(s.last).toMatchObject({ kind: 'match', id: 0 })
    s = run(s, tap('en', 1), tap('sm', 1))
    expect(s.matched).toEqual([0, 1])
    expect(s.score).toEqual({ right: 2, total: 2 })
    expect(s.selected).toBe(null)
  })

  it('moves the selection within a side, and lets it go on a second tap', () => {
    let s = run(start(), tap('sm', 0), tap('sm', 1))
    expect(s.selected).toEqual({ side: 'sm', id: 1 })
    s = run(s, tap('sm', 1))
    expect(s.selected).toBe(null)
    expect(s.verdicts).toBe(0)
  })

  it('counts a wrong pair as a miss for both items', () => {
    let s = run(start(), tap('sm', 0), tap('en', 1))
    expect(s.wrong).toMatchObject({ sm: 0, en: 1 })
    expect(s.missed.sort()).toEqual([0, 1])
    expect(s.streak).toBe(0)
    expect(s.matched).toEqual([])
    expect(s.last.kind).toBe('miss')
    // Both pairs can still be matched, but not first time.
    s = run(s, tap('sm', 0), tap('en', 0), tap('en', 1), tap('sm', 1), tap('sm', 2), tap('en', 2))
    expect(s.score).toEqual({ right: 1, total: 3 })
    expect(s.streak).toBe(3)
  })

  it('clears the red flash on the next tap, or when its own timer ends', () => {
    let s = run(start(), tap('sm', 0), tap('en', 1))
    const { n } = s.wrong
    expect(run(s, { type: 'unflash', n: n - 1 }).wrong).not.toBe(null)
    expect(run(s, { type: 'unflash', n }).wrong).toBe(null)
    s = run(s, tap('en', 2))
    expect(s.wrong).toBe(null)
    expect(s.selected).toEqual({ side: 'en', id: 2 })
  })

  it('ignores matched cells and cells from another round', () => {
    const s = run(start(), tap('sm', 0), tap('en', 0))
    expect(run(s, tap('sm', 0))).toBe(s)
    expect(run(s, tap('en', 0))).toBe(s)
    expect(run(s, tap('sm', 3))).toBe(s)
    expect(run(s, tap('xx', 1))).toBe(s)
  })

  it('moves to the next round only from a finished round, once per tap', () => {
    let s = run(start(), tap('sm', 0), tap('en', 0), { type: 'next' })
    expect(s.round).toBe(0)
    s = run(s, tap('sm', 1), tap('en', 1), tap('sm', 2), tap('en', 2))
    expect(isRoundDone(s)).toBe(true)
    s = run(s, { type: 'next' }, { type: 'next' })
    expect(s.round).toBe(1)
    expect(roundOf(s).sm).toEqual([3, 4])
    expect(s.last).toBe(null)
    s = run(s, tap('en', 3), tap('sm', 3), tap('sm', 4), tap('en', 4), { type: 'next' })
    expect(s.finished).toBe(true)
    expect(s.score).toEqual({ right: 5, total: 5 })
    expect(run(s, tap('sm', 3))).toBe(s)
  })

  it('goes again with the score kept, and starts fresh with it cleared', () => {
    let s = run(start(), tap('sm', 0), tap('en', 1))
    expect(run(s, { type: 'again', pairs: PAIRS, pass: PASS })).toBe(s)
    s = run(s, ...[0, 1, 2].flatMap(i => [tap('sm', i), tap('en', i)]), { type: 'next' }, ...[3, 4].flatMap(i => [tap('sm', i), tap('en', i)]), { type: 'next' })
    expect(s.finished).toBe(true)
    expect(s.score).toEqual({ right: 3, total: 5 })
    const again = run(s, { type: 'again', pairs: PAIRS, pass: PASS })
    expect(again).toMatchObject({ finished: false, round: 0, matched: [], missed: [], score: { right: 3, total: 5 }, pass: s.pass + 1 })
    const fresh = run(again, tap('sm', 0), { type: 'reset', pairs: PAIRS, pass: PASS })
    expect(fresh).toMatchObject({ finished: false, round: 0, selected: null, score: { right: 0, total: 0 }, streak: 0, pass: again.pass + 1 })
  })
})
