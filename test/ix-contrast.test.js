// The Contrast figure's highlight rules (src/premium/components/interactive/
// contrast-logic.js): which words, and which letters inside a built word, are
// new against the form before. Every string here is printed in the book.
import { describe, expect, it } from 'vitest'
import { englishWords, kinship, letterDiff, splitMarks, stageWords, TUNES } from '../src/premium/components/interactive/contrast-logic.js'

const marked = parts => parts.filter(p => p.changed).map(p => p.text)
const spelled = parts => parts.map(p => p.text).join('')

describe('letters a built word adds', () => {
  it('marks a prefix in front', () => {
    expect(letterDiff('moe', 'faʻamoe')).toEqual([{ text: 'faʻa', changed: true }, { text: 'moe', changed: false }])
    expect(letterDiff('pō', 'anapō')).toEqual([{ text: 'ana', changed: true }, { text: 'pō', changed: false }])
    expect(marked(letterDiff('taeao', 'ʻātaeao'))).toEqual(['ʻā'])
  })

  it('marks a doubled piece in front of itself', () => {
    expect(letterDiff('nofo', 'nonofo')).toEqual([{ text: 'no', changed: true }, { text: 'nofo', changed: false }])
  })

  it('marks an ending, and a prefix with an ending', () => {
    expect(letterDiff('fasi', 'fasi=a')).toEqual([{ text: 'fasi', changed: false }, { text: '=a', changed: true }])
    expect(marked(letterDiff('alofa', 'fealofani'))).toEqual(['fe', 'ni'])
  })

  it('counts a lost macron as a change', () => {
    expect(letterDiff('sāvali', 'savaliga')).toEqual([
      { text: 's', changed: false }, { text: 'a', changed: true }, { text: 'vali', changed: false }, { text: 'ga', changed: true },
    ])
    expect(marked(letterDiff('savaliga', 'sāvaliga'))).toEqual(['ā'])
  })

  it('always spells the new word back', () => {
    for (const [a, b] of [['moe', 'faʻamoe'], ['nofo', 'nonofo'], ['alofa', 'fealofani'], ['ilo', 'feiloai'], ['uliuli', 'uli'], ['soli', 'solisoli']]) {
      expect(spelled(letterDiff(a, b))).toBe(b)
    }
  })

  it('calls words kin only when they share enough', () => {
    expect(kinship('moe', 'faʻamoe')).toBe(3)
    expect(kinship('nofo', 'nonofo')).toBe(4)
    expect(kinship('le', 'lē')).toBe(0)
    expect(kinship('tama', 'teine')).toBe(0)
    expect(kinship('', 'moe')).toBe(0)
  })
})

describe('stage words', () => {
  it('marks nothing without a reference', () => {
    const out = stageWords(null, 'Sā ia alu.')
    expect(out.map(w => w.key)).toEqual(['sā#0', 'ia#0', 'alu#0'])
    expect(out.every(w => !w.changed && marked(w.parts).length === 0)).toBe(true)
  })

  it('marks only the question mark when no word changes', () => {
    const out = stageWords('Sā ia alu.', 'Sā ia alu?')
    expect(out.map(w => w.changed)).toEqual([false, false, false])
    expect(out[2].parts).toEqual([{ text: 'alu', changed: false }, { text: '?', changed: true }])
    // The same keys as the statement, so the words stay where they are.
    expect(out.map(w => w.key)).toEqual(stageWords(null, 'Sā ia alu.').map(w => w.key))
  })

  it('marks the doubled piece of a plural verb, not the whole sentence', () => {
    const out = stageWords('Sā nofo le teine.', 'Sā nonofo teine.')
    expect(out.map(w => w.changed)).toEqual([false, true, false])
    expect(out[1].parts).toEqual([{ text: 'no', changed: true }, { text: 'nofo', changed: false }])
    expect(out[2].parts).toEqual([{ text: 'teine.', changed: false }])
  })

  it('marks a new word whole and an ending inside a kin word', () => {
    const out = stageWords('Sā fasi le tama e le teine.', 'Sā lē fasi=a le tama e le teine.')
    expect(out.filter(w => w.changed).map(w => w.word)).toEqual(['lē', 'fasi=a'])
    expect(out[1].parts).toEqual([{ text: 'lē', changed: true }])
    expect(out[2].parts).toEqual([{ text: 'fasi', changed: false }, { text: '=a', changed: true }])
  })

  it('marks the words a sentence puts round a built word, not its stop', () => {
    const out = stageWords('faʻamoe', 'Sā faʻamoe e le teine le pepe.')
    expect(out.filter(w => w.changed).map(w => w.word)).toEqual(['Sā', 'e', 'le', 'teine', 'le', 'pepe.'])
    expect(out[6].parts).toEqual([{ text: 'pepe', changed: true }, { text: '.', changed: false }])
    expect(out.map(w => w.key)).toEqual(['sā#0', 'faʻamoe#0', 'e#0', 'le#0', 'teine#0', 'le#1', 'pepe#0'])
  })

  it('marks the prefix when a word gains one', () => {
    const [w] = stageWords('moe', 'faʻamoe')
    expect(w.changed).toBe(true)
    expect(w.parts).toEqual([{ text: 'faʻa', changed: true }, { text: 'moe', changed: false }])
  })

  it('marks a word whole when it only lost letters', () => {
    const [w] = stageWords('uliuli', 'uli')
    expect(w.parts).toEqual([{ text: 'uli', changed: true }])
  })

  it('always spells each word back from its parts', () => {
    const pairs = [['Sā ia alu.', 'Sā ia alu?'], ['Sā nofo le teine.', 'Sā nonofo teine.'], ['faʻamoe', 'Sā faʻamoe e le teine le pepe.'], ['E uliuli le pusi.', 'E uli pusi.']]
    for (const [a, b] of pairs) for (const w of stageWords(a, b)) expect(spelled(w.parts)).toBe(w.word)
  })
})

describe('helpers', () => {
  it('splits a word from its punctuation', () => {
    expect(splitMarks('alu?')).toEqual({ lead: '', body: 'alu', tail: '?' })
    expect(splitMarks('"Sā')).toEqual({ lead: '"', body: 'Sā', tail: '' })
    expect(splitMarks('moe')).toEqual({ lead: '', body: 'moe', tail: '' })
  })

  it('keys English words apart from Samoan ones', () => {
    expect(englishWords('Did she go?').map(w => w.key)).toEqual(['en:did#0', 'en:she#0', 'en:go#0'])
  })

  it('draws every tune with the same commands, so one morphs into another', () => {
    const shape = d => d.replace(/-?\d+(\.\d+)?/g, 'n')
    const shapes = Object.values(TUNES).map(t => shape(t.d))
    expect(new Set(shapes).size).toBe(1)
    for (const t of Object.values(TUNES)) expect(t.d.trim().endsWith(` ${t.end}`)).toBe(true)
  })
})
