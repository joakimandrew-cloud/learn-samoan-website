// The calm chapter page's pure functions (plan 2026-11-06-chapter-page-simplify;
// reviews/lesson-simplify-2026-11-06/Direction.md parts 2, 5 and 8).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import quickPractice from '../src/data/quick-practice.json'
import bookExercises from '../src/data/book-exercises.json'
import { parseLessonContent } from '../src/premium/lib/lesson-content.js'
import { slugify } from '../src/lib/slugify.js'
import { figureNumbers, figurePlaces, groupSections, lengthLine, readingMinutes, sectionCount, vocabularyCount } from '../src/premium/lib/chapter-page.js'
import { rowTimeline } from '../src/premium/figure-engine/row.js'
import { forkTimeline } from '../src/premium/figure-engine/fork.js'
import { pathTimeline } from '../src/premium/figure-engine/path.js'
import { buildTimeline } from '../src/premium/figure-engine/build.js'
import { KEY_LABELS, ROLE_LABEL, ROLES } from '../src/premium/figure-engine/key.js'
import { currentItemId, firstOpenSet } from '../src/premium/components/lesson/SteppedExercises.jsx'

const APP = path.join(__dirname, '..')
const chapter = n => {
  const nn = String(n).padStart(2, '0')
  const md = fs.readFileSync(path.join(APP, 'book', `Chapter-${nn}.md`), 'utf8')
  const file = path.join(APP, 'src', 'data', 'interactives', `${nn}.json`)
  const interactives = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).items : []
  const lesson = parseLessonContent(md, { chapter: n, quickPractices: quickPractice[String(n)] || [], exercises: bookExercises[String(n)] || [], interactives, slugify })
  return { lesson, sections: groupSections(lesson.blocks), interactives: new Map(interactives.map(item => [item.id, item])) }
}

const section = (id, blocks) => ({ id, title: id, blocks })
const p = text => ({ type: 'p', text })

describe('figurePlaces', () => {
  it('places each figure after its first matching block, in its own section only', () => {
    const s = section('the-past-particle', [p('one'), p('two'), p('two again')])
    const figures = [
      { id: '4.1', after: { section: 'the-past', block: b => b.text.startsWith('two') } },
      { id: '4.2', after: { section: 'other', block: () => true } },
    ]
    const places = figurePlaces(s, figures)
    expect([...places.keys()]).toEqual([1])
    expect(places.get(1).map(def => def.id)).toEqual(['4.1'])
  })
})

describe('figureNumbers', () => {
  const interactives = new Map([
    ['a', { id: 'a', kind: 'contrast' }],
    ['b', { id: 'b', kind: 'sort' }],
    ['c', { id: 'c', kind: 'grid' }],
  ])
  const sections = [
    section('one', [p('x'), { type: 'interactive', id: 'a' }, p('y')]),
    section('two', [{ type: 'interactive', id: 'b' }, p('z'), { type: 'interactive', id: 'c' }]),
    { id: 'exercises', title: 'Exercises', exercises: true, blocks: [] },
  ]
  const figures = [{ id: '9.1', after: { section: 'one', block: b => b.text === 'x' } }, { id: '9.2', after: { section: 'two', block: b => b.text === 'z' } }]

  it('runs one sequence in reading order over new and Interactive figures, with practice unnumbered', () => {
    const out = figureNumbers({ n: 9, sections, interactives, figures })
    expect(out.figure.get('9.1')).toBe('9.1')
    expect(out.interactive.get('a')).toBe('9.2')
    expect(out.interactive.has('b')).toBe(false)
    expect(out.figure.get('9.2')).toBe('9.3')
    expect(out.interactive.get('c')).toBe('9.4')
    expect(out.count).toBe(4)
  })

  it('leaves no gap where a figure replaces an Interactive', () => {
    const out = figureNumbers({ n: 9, sections, interactives, figures, replaces: ['a'] })
    expect(out.interactive.has('a')).toBe(false)
    expect([out.figure.get('9.1'), out.figure.get('9.2'), out.interactive.get('c')]).toEqual(['9.1', '9.2', '9.3'])
  })

  it('numbers Chapter 14 as Direction.md part 6 says: two new figures, then the kept contrast', async () => {
    const { sections: s14, interactives: ix14 } = chapter(14)
    const { FIGURES, REPLACES } = await import('../src/premium/figures/14.js')
    const out = figureNumbers({ n: 14, sections: s14, interactives: ix14, figures: FIGURES, replaces: REPLACES })
    expect(out.figure.get('14.1')).toBe('14.1')
    expect(out.figure.get('14.2')).toBe('14.2')
    expect(out.interactive.get('ch14-general-and-now')).toBe('14.3')
    expect(out.interactive.has('ch14-particle-position')).toBe(false)
  })

  it('keeps today\'s numbers on a chapter with no figure file', () => {
    const { sections: s1, interactives: ix1 } = chapter(1)
    const out = figureNumbers({ n: 1, sections: s1, interactives: ix1 })
    const kinds = [...ix1.values()].filter(item => ['anatomy', 'builder', 'contrast', 'grid', 'scale', 'dialogue'].includes(item.kind))
    expect(out.count).toBe(kinds.length)
  })
})

describe('the hero length line', () => {
  it('reads as one plain line, singular where it is one', () => {
    expect(lengthLine({ mins: 4, exercises: 5, words: 12 })).toBe('4 min read, 5 exercises, 12 new words')
    expect(lengthLine({ mins: 3, exercises: 1, words: 1 })).toBe('3 min read, 1 exercise, 1 new word')
    expect(lengthLine({ mins: 3, exercises: 0, words: 0 })).toBe('3 min read')
  })

  it('counts the Words to Learn rows and the reading minutes as the old chips did', () => {
    const { lesson, sections } = chapter(14)
    expect(vocabularyCount(sections)).toBeGreaterThan(0)
    expect(readingMinutes(lesson)).toBeGreaterThanOrEqual(3)
  })
})

describe('sectionCount', () => {
  const sections = [section('a', []), section('b', []), section('c', [])]
  it('says where the student is', () => {
    expect(sectionCount(sections, 'b')).toBe('2 of 3')
    expect(sectionCount(sections, null)).toBe('1 of 3')
    expect(sectionCount(sections, 'finish')).toBe('3 of 3')
    expect(sectionCount([], 'a')).toBe('')
  })
})

describe('stepped exercises', () => {
  const items = [{ id: '1' }, { id: '2', given: true }, { id: '3' }, { id: '4' }]
  it('gives the button to the first open item, skipping given and skipped ones', () => {
    expect(currentItemId(items, () => false)).toBe('1')
    expect(currentItemId(items, item => item.id === '1')).toBe('3')
    expect(currentItemId(items, () => false, new Set(['1', '3']))).toBe('4')
    expect(currentItemId(items, () => true)).toBe(null)
  })
  it('lets a tapped prompt take the button while it is open', () => {
    expect(currentItemId(items, () => false, new Set(), '4')).toBe('4')
    expect(currentItemId(items, item => item.id === '4', new Set(), '4')).toBe('1')
  })
  it('opens the first set with an item left', () => {
    const sets = [{ id: 'a', items: [{ id: 'x' }] }, { id: 'b', items: [{ id: 'y' }, { id: 'z', given: true }] }]
    expect(firstOpenSet(sets, { a: { state: { x: true } } }).id).toBe('b')
    expect(firstOpenSet(sets, { a: { state: { x: true } }, b: { state: { y: false } } })).toBe(null)
  })
})

describe('the figure engine', () => {
  it('keeps the role key to the six kinds of word, with the book\'s own labels', () => {
    expect(ROLES).toEqual(['tense', 'verb', 'pronoun', 'noun', 'marker', 'quiet'])
    for (const label of Object.values(ROLE_LABEL).filter(Boolean)) expect(KEY_LABELS).toContain(label)
    expect(ROLES).not.toContain('focus')
  })

  it('runs every scene of Chapter 14 in under 8 s, resting after each change', async () => {
    const { FIGURES } = await import('../src/premium/figures/14.js')
    for (const def of FIGURES) {
      for (const scene of def.scenes) {
        const tl = def.kind === 'row' ? rowTimeline(scene) : forkTimeline(scene)
        expect(tl.duration).toBeLessThan(8000)
        expect(tl.rests.at(-1)).toBe(tl.duration)
      }
    }
  })

  it('times a Build and a Path as pure functions of their scenes', () => {
    const build = buildTimeline({ pieces: [{ text: 'folo' }, { text: 'folo', added: true, of: 0 }] })
    expect(build.beats.map(b => b.kind)).toEqual(['open', 'add', 'close', 'en'])
    expect(build.duration).toBeLessThan(8000)
    const route = pathTimeline({ cases: [{}, {}] })
    expect(route.beats.filter(b => b.kind === 'draw')).toHaveLength(2)
    expect(route.rests).toHaveLength(2)
  })
})
