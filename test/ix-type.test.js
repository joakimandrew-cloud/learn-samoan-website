// Grading for the Type practice (src/premium/components/interactive/type-logic.js).
// Every Samoan string here is printed in the book (Chapters 1 and 2).
import { describe, expect, it } from 'vitest'
import { gradeTyped, spellingDiff } from '../src/premium/components/interactive/type-logic.js'

const bathe = { en: 'bathe, have a shower', sm: 'tāʻele' }
const fish = { en: 'go fishing', sm: 'fāgota' }
const me = { en: 'I', sm: 'ʻou', accept: ['aʻu'] }
const went = { en: 'I went.', sm: 'Sā ʻou alu.' }

// Which printed letters are marked, as a string of the marked runs.
const marked = runs => runs.filter(r => r.differs).map(r => r.text).join('|')
const spelled = runs => runs.map(r => r.text).join('')

describe('gradeTyped', () => {
  it('accepts the printed spelling exactly', () => {
    expect(gradeTyped('tāʻele', bathe)).toEqual({ verdict: 'right', match: 'tāʻele' })
    expect(gradeTyped('fāgota', fish).verdict).toBe('right')
  })

  it('ignores case, spacing and a final stop', () => {
    expect(gradeTyped('  Tāʻele. ', bathe).verdict).toBe('right')
    expect(gradeTyped('TĀʻELE', bathe).verdict).toBe('right')
    expect(gradeTyped('sā   ʻou alu', went).verdict).toBe('right')
  })

  it('takes any apostrophe for the glottal stop', () => {
    for (const mark of ["'", '‘', '’', '`', 'ʼ']) {
      expect(gradeTyped(`tā${mark}ele`, bathe).verdict, mark).toBe('right')
    }
    expect(gradeTyped("'ou", me).verdict).toBe('right')
  })

  it('accepts a printed alternative from accept[]', () => {
    expect(gradeTyped("a'u", me)).toEqual({ verdict: 'right', match: 'aʻu' })
    expect(gradeTyped('ʻou', me)).toEqual({ verdict: 'right', match: 'ʻou' })
  })

  it('calls a missing macron or glottal stop almost, against the form it nearly matched', () => {
    expect(gradeTyped('fagota', fish)).toEqual({ verdict: 'almost', match: 'fāgota' })
    expect(gradeTyped('taele', bathe)).toEqual({ verdict: 'almost', match: 'tāʻele' })
    expect(gradeTyped("ta'ele", bathe).verdict).toBe('almost')
    expect(gradeTyped('tāele', bathe).verdict).toBe('almost')
    expect(gradeTyped('ou', me)).toEqual({ verdict: 'almost', match: 'ʻou' })
    expect(gradeTyped('au', me)).toEqual({ verdict: 'almost', match: 'aʻu' })
    expect(gradeTyped('sa ou alu', went).verdict).toBe('almost')
  })

  it('calls a macron on the wrong vowel almost, not right', () => {
    expect(gradeTyped('fagotā', fish).verdict).toBe('almost')
  })

  it('marks a different word wrong and points to the printed form', () => {
    expect(gradeTyped('siva', bathe)).toEqual({ verdict: 'wrong', match: 'tāʻele' })
    expect(gradeTyped('fāgot', fish).verdict).toBe('wrong')
    expect(gradeTyped('alu', me)).toEqual({ verdict: 'wrong', match: 'ʻou' })
  })

  it('grades nothing when nothing is typed', () => {
    expect(gradeTyped('', bathe).verdict).toBe('empty')
    expect(gradeTyped('   ', bathe).verdict).toBe('empty')
    expect(gradeTyped('.', bathe).verdict).toBe('empty')
  })

  it('does not call a lone glottal stop almost', () => {
    expect(gradeTyped("'", bathe).verdict).toBe('wrong')
  })
})

describe('spellingDiff', () => {
  it('always spells the printed form back', () => {
    for (const typed of ['taele', "t'aele", 'tāʻele', 'TAELE', 'x']) expect(spelled(spellingDiff('tāʻele', typed))).toBe('tāʻele')
    expect(spelled(spellingDiff('Sā ʻou alu.', 'sa ou alu'))).toBe('Sā ʻou alu.')
  })

  it('marks a missing macron', () => {
    expect(spellingDiff('fāgota', 'fagota')).toEqual([
      { text: 'f', differs: false },
      { text: 'ā', differs: true },
      { text: 'gota', differs: false },
    ])
  })

  it('marks a missing glottal stop with the macron beside it', () => {
    expect(marked(spellingDiff('tāʻele', 'taele'))).toBe('āʻ')
    expect(marked(spellingDiff('tāʻele', "ta'ele"))).toBe('ā')
    expect(marked(spellingDiff('ʻou', 'ou'))).toBe('ʻ')
  })

  it('marks a glottal stop typed in the wrong place', () => {
    expect(marked(spellingDiff('tāʻele', "t'aele"))).toBe('āʻ')
  })

  it('marks a macron the printed word does not have', () => {
    expect(marked(spellingDiff('fāgota', 'fāgotā'))).toBe('a')
  })

  it('marks the letter a stray glottal stop was typed before', () => {
    expect(marked(spellingDiff('alofa', "'alofa"))).toBe('a')
  })

  it('ignores case and the final stop', () => {
    expect(marked(spellingDiff('Sā ʻou alu.', 'sā ʻou alu'))).toBe('')
    expect(marked(spellingDiff('Sā ʻou alu.', 'sa ou alu'))).toBe('ā|ʻ')
  })

  it('marks nothing when the spelling matches', () => {
    expect(spellingDiff('tāʻele', 'tā’ele')).toEqual([{ text: 'tāʻele', differs: false }])
  })
})
