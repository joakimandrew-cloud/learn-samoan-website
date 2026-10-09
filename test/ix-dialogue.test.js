// The Dialogue figure's turn logic (src/premium/components/interactive/
// dialogue-logic.js): which parts a learner can take, each speaker's colour,
// and how far a role-play has got. Speaker keys and line text here are
// placeholders; only the shape matters.
import { describe, expect, it } from 'vitest'
import { range, rolePlay, speakerKeys, speakingParts, toneOf } from '../src/premium/components/interactive/dialogue-logic.js'

const turns = whos => whos.split('').map((who, i) => ({ who, sm: `line ${i}`, en: `line ${i}` }))
const abab = turns('abababab')

describe('dialogue: role-play turns', () => {
  it('as the second speaker: the first line is shown, my first line waits', () => {
    expect(rolePlay(abab, 'b', 0)).toEqual({ mine: [1, 3, 5, 7], said: 0, next: 1, upTo: 2, done: false })
  })

  it('each reveal brings the other speaker in, up to my next line', () => {
    expect(rolePlay(abab, 'b', 1)).toMatchObject({ next: 3, upTo: 4, done: false })
    expect(rolePlay(abab, 'b', 2)).toMatchObject({ next: 5, upTo: 6, done: false })
  })

  it('my last line said: the whole conversation is on the page', () => {
    expect(rolePlay(abab, 'b', 4)).toMatchObject({ said: 4, next: null, upTo: 8, done: true })
  })

  it('as the first speaker: only my hidden first line at the start', () => {
    expect(rolePlay(abab, 'a', 0)).toMatchObject({ next: 0, upTo: 1 })
    // My last line is not the last line: the reply comes in after it.
    expect(rolePlay(abab, 'a', 4)).toMatchObject({ next: null, upTo: 8, done: true })
  })

  it('two of my lines in a row are revealed one at a time', () => {
    const run = turns('aab')
    expect(rolePlay(run, 'a', 0)).toMatchObject({ next: 0, upTo: 1 })
    expect(rolePlay(run, 'a', 1)).toMatchObject({ next: 1, upTo: 2 })
    expect(rolePlay(run, 'a', 2)).toMatchObject({ next: null, upTo: 3, done: true })
  })

  it('a count out of range is clamped', () => {
    expect(rolePlay(abab, 'b', 9)).toMatchObject({ said: 4, done: true })
    expect(rolePlay(abab, 'b', -2)).toMatchObject({ said: 0, next: 1 })
  })
})

describe('dialogue: speakers', () => {
  it('lists speakers in the order the data names them', () => {
    expect(speakerKeys({ b: 'Second', a: 'First' })).toEqual(['b', 'a'])
    expect(speakerKeys(null)).toEqual([])
  })

  it('offers only the parts that have lines', () => {
    expect(speakingParts({ a: 'A', b: 'B', c: 'C' }, turns('abab'))).toEqual(['a', 'b'])
  })

  it('colours the first speaker with the accent, the second with ink, a third muted', () => {
    const speakers = { a: 'A', b: 'B', c: 'C', d: 'D' }
    expect(['a', 'b', 'c', 'd'].map(k => toneOf(speakers, k))).toEqual([0, 1, 2, 0])
    expect(toneOf(speakers, 'nobody')).toBe(0)
  })

  it('range counts up to, not including, the end', () => {
    expect(range(2, 5)).toEqual([2, 3, 4])
    expect(range(3, 3)).toEqual([])
  })
})
