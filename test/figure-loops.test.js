// The turns an Interactive figure takes in the page-wide queue (plan 2026-11-09-figure-loops):
// what each turn shows, when, and that every turn hands the queue on once its change has settled.
import { describe, expect, it } from 'vitest'
import { LOOP_HOLD_MS, LOOP_LEAD_MS } from '../src/premium/figure-engine/lib/clock.js'
import { nextTurn, roundTurn, SETTLE_MS } from '../src/premium/components/interactive/loop.js'

// A turn that records what it was asked to do, and when.
function fakeTurn() {
  const log = []
  const turn = {
    later: (fn, ms) => log.push({ ms, fn }),
    done: () => {},
  }
  return { turn, log }
}

describe('the loop timing', () => {
  it('holds a finished example 3.2 s and leads the next one in 0.6 s, as on the Tongan site', () => {
    expect(LOOP_HOLD_MS).toBe(3200)
    expect(LOOP_LEAD_MS).toBe(600)
  })

  it('a next turn holds the example showing, brings in the next, and passes on once it has settled', () => {
    const { turn, log } = fakeTurn()
    const advance = () => {}
    nextTurn(advance)(turn)
    expect(log.map(item => item.ms)).toEqual([LOOP_HOLD_MS, LOOP_HOLD_MS + SETTLE_MS])
    expect(log[0].fn).toBe(advance)
    expect(log[1].fn).toBe(turn.done)
  })

  it('a round turn shows every state in order, comes back to the first, and passes on last', () => {
    const { turn, log } = fakeTurn()
    const shown = []
    roundTurn(3, i => shown.push(i), 2600)(turn)
    const steps = log.slice(0, -1)
    steps.forEach(item => item.fn())
    expect(shown).toEqual([1, 2, 0])
    expect(steps.map(item => item.ms)).toEqual([2600, 5200, 7800])
    expect(log.at(-1)).toEqual({ ms: 7800 + SETTLE_MS, fn: turn.done })
  })

  it('a two-form round goes to the second form and back, like a statement and its question', () => {
    const { turn, log } = fakeTurn()
    const shown = []
    roundTurn(2, i => shown.push(i))(turn)
    log.slice(0, -1).forEach(item => item.fn())
    expect(shown).toEqual([1, 0])
    expect(log.at(-1).ms).toBe(2 * LOOP_HOLD_MS + SETTLE_MS)
  })
})
