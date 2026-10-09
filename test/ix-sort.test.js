// The Sort practice's piles: what each holds, how each looks after an answer,
// and that a choice is recorded once per card and per dealt deck.
import { describe, expect, it } from 'vitest'
import { binState, pilesFor, recordPick } from '../src/premium/components/interactive/sort-logic.js'

const bins = [{ id: 'a' }, { id: 'o' }]
const order = [
  { key: 0, bin: 'o' },
  { key: 1, bin: 'a' },
  { key: 2, bin: 'o' },
  { key: 3, bin: 'a' },
]
const keys = list => list.map(e => e.item.key)

describe('pilesFor', () => {
  it('starts every pile empty', () => {
    expect(pilesFor(bins, order, 0, {})).toEqual({ a: [], o: [] })
  })

  it('files each sorted word in its right pile, newest first', () => {
    const piles = pilesFor(bins, order, 3, { 0: 'o', 1: 'a', 2: 'o' })
    expect(keys(piles.o)).toEqual([2, 0])
    expect(keys(piles.a)).toEqual([1])
    expect([...piles.o, ...piles.a].every(e => !e.missed)).toBe(true)
  })

  it('files a wrongly sorted word in its right pile, marked missed', () => {
    const piles = pilesFor(bins, order, 2, { 0: 'a', 1: 'a' })
    expect(keys(piles.o)).toEqual([0])
    expect(piles.o[0].missed).toBe(true)
    expect(keys(piles.a)).toEqual([1])
    expect(piles.a[0].missed).toBe(false)
  })

  it('holds the whole deck once the round is done, and never more', () => {
    const piles = pilesFor(bins, order, 99, { 0: 'o', 1: 'a', 2: 'o', 3: 'a' })
    expect(keys(piles.o)).toEqual([2, 0])
    expect(keys(piles.a)).toEqual([3, 1])
  })
})

describe('binState', () => {
  it('leaves every pile plain before an answer', () => {
    expect(binState('a', { answered: false, guess: null, answer: 'a' })).toBe('')
  })

  it('marks a right choice and steps the rest back', () => {
    const s = { answered: true, guess: 'a', answer: 'a' }
    expect(binState('a', s)).toBe('is-answer')
    expect(binState('o', s)).toBe('is-dim')
  })

  it('marks a wrong choice and reveals the right pile', () => {
    const s = { answered: true, guess: 'o', answer: 'a' }
    expect(binState('o', s)).toBe('is-chosen-wrong')
    expect(binState('a', s)).toBe('is-revealed-answer')
    expect(binState('x', s)).toBe('is-dim')
  })
})

describe('recordPick', () => {
  it('records the first choice at a place and ignores a second', () => {
    const first = recordPick({ deck: null, picks: {} }, order, 0, 'o')
    expect(first).toEqual({ deck: order, picks: { 0: 'o' } })
    expect(recordPick(first, order, 0, 'a')).toBe(first)
  })

  it('keeps earlier picks of the same deck', () => {
    const one = recordPick({ deck: null, picks: {} }, order, 0, 'o')
    expect(recordPick(one, order, 1, 'a').picks).toEqual({ 0: 'o', 1: 'a' })
  })

  it('starts a newly dealt deck with no picks', () => {
    const one = recordPick({ deck: null, picks: {} }, order, 0, 'o')
    const dealt = [...order]
    expect(recordPick(one, dealt, 1, 'a')).toEqual({ deck: dealt, picks: { 1: 'a' } })
  })
})
