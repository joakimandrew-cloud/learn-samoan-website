// The drills hub, the drill pages and Daily words. The honesty gate for the
// new data (scripts/check-interactives.mjs validateDrills) runs here too, so
// `npm test` fails if the catalogue or the deck carries Samoan the course does
// not print.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chapterFiles, readJson, validateDrills } from '../scripts/check-interactives.mjs'
import catalog from '../src/premium/data/drills-catalog.json'
import chapters from '../src/data/chapters.json'
import vocab from '../src/data/book-vocabulary.json'
import { loadInteractives } from '../src/premium/lib/book.js'
import { filterDrillGroups, matchesDrill } from '../src/premium/lib/catalog-query.js'
import { DAILY_WORDS_ID, buildDrillGroups, catalogIds, drillChapter, drillEyebrow, practiceItemsById } from '../src/premium/lib/drills-catalog.js'
import { MAX_BOX, SESSION_SIZE, buildDeck, buildSession, contentWords, loadBoxes, nextBox, saveBoxes, STORE_KEY } from '../src/premium/lib/daily-words.js'
import { HUBS } from '../src/lib/site-meta.js'

const files = chapterFiles().map(readJson)
const items = practiceItemsById(files)

describe('drills catalogue and Daily words honesty gate', () => {
  it('passes on the shipped data', () => {
    const { errors, lines } = validateDrills()
    expect(errors, errors.join('\n')).toEqual([])
    expect(lines.length).toBe(4)
  })

  it('has 56 drills in 8 groups: every practice item once, plus Daily words', () => {
    const ids = catalogIds(catalog)
    expect(catalog).toHaveLength(8)
    expect(ids).toHaveLength(56)
    expect(new Set(ids).size).toBe(56)
    expect(items.size).toBe(55)
    expect(ids.filter(id => id !== DAILY_WORDS_ID).sort()).toEqual([...items.keys()].sort())
    expect(HUBS['/drills'].description.startsWith('56 drills')).toBe(true)
  })

  it('fails when the catalogue names a drill that does not exist', () => {
    const bad = structuredClone(catalog)
    bad[0].drills.push('ch99-made-up')
    expect(validateDrills({ catalog: bad }).errors.join('\n')).toMatch(/ch99-made-up/)
  })

  it('fails when a practice item is left out of the catalogue', () => {
    const bad = structuredClone(catalog)
    bad[0].drills.pop()
    expect(validateDrills({ catalog: bad }).errors.join('\n')).toMatch(/is in no group/)
  })

  it('fails when catalogue copy carries Samoan or a dash', () => {
    const bad = structuredClone(catalog)
    bad[0].note = 'Practise *abc* in italics'
    bad[1].name = 'Tense — and the verb'
    const text = validateDrills({ catalog: bad }).errors.join('\n')
    expect(text).toMatch(/carries Samoan/)
    expect(text).toMatch(/em dash/)
  })

  it('fails when a deck word is not printed in its chapter', () => {
    const bad = structuredClone(vocab)
    const row = bad.find(r => r.list === 'vocabulary' && r.english.length <= 20 && !/[/.…]/.test(r.english))
    row.samoan = 'zzzxq'
    expect(validateDrills({ vocab: bad }).errors.join('\n')).toMatch(/zzzxq/)
  })

  it('fails when a deck word is paired with another word\'s English', () => {
    const bad = structuredClone(vocab)
    const [a, b] = bad.filter(r => r.list === 'vocabulary' && r.chapter === 3 && r.english.length <= 20 && !/[/.…]/.test(r.english))
    ;[a.english, b.english] = [b.english, a.english]
    expect(validateDrills({ vocab: bad }).errors.join('\n')).toMatch(/is not printed beside/)
  })
})

describe('drill pages', () => {
  it('resolve every catalogue id to the very item in its chapter file', async () => {
    for (const id of catalogIds(catalog)) {
      if (id === DAILY_WORDS_ID) continue
      const n = drillChapter(id)
      const fromFile = items.get(id)
      expect(fromFile.chapter, id).toBe(n)
      const loaded = (await loadInteractives(n)).find(x => x.id === id)
      expect(loaded, id).toEqual(fromFile.item)
    }
  })

  it('give every drill an eyebrow of Chapter N and its level', () => {
    expect(drillEyebrow('ch1-order', chapters)).toBe('Chapter 1 · Beginner')
    expect(drillEyebrow('ch50-built-meaning', chapters)).toMatch(/^Chapter 50 · (Intermediate|Advanced)$/)
    expect(drillEyebrow(DAILY_WORDS_ID, chapters)).toBe('Every chapter · Words to Learn')
    expect(drillEyebrow('not-a-drill', chapters)).toBe('')
  })
})

describe('hub search and filters', () => {
  const groups = buildDrillGroups(catalog, items, chapters, buildDeck(vocab))
  const count = (query, level) => filterDrillGroups(groups, query, level).reduce((n, g) => n + g.visible.length, 0)

  it('shows all 56 with no filter', () => expect(count('', 'all')).toBe(56))
  it('narrows by a word and by a level', () => {
    expect(count('question', 'all')).toBeGreaterThan(0)
    expect(count('question', 'all')).toBeLessThan(56)
    const advanced = filterDrillGroups(groups, '', 'advanced').flatMap(g => g.visible)
    expect(advanced.length).toBeGreaterThan(0)
    expect(advanced.every(d => d.level === 'advanced')).toBe(true)
    expect(count('zzzzqq', 'all')).toBe(0)
  })
  it('finds a drill by its chapter', () => {
    const hits = filterDrillGroups(groups, 'chapter 4', 'all').flatMap(g => g.visible)
    expect(hits.some(d => d.id === 'ch4-type-state-verbs')).toBe(true)
    expect(matchesDrill({ title: 'x', blurb: '', action: 'Pick', ch: null }, 'chapter null')).toBe(false)
  })
  it('searches a title without its italic stars', () => {
    expect(matchesDrill({ title: 'Tell *abc* apart', blurb: '', action: 'Sort', ch: 16 }, 'abc apart')).toBe(true)
  })
})

describe('Daily words', () => {
  const deck = buildDeck(vocab)
  const seeded = seed => { let a = seed; return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296 } }

  it('keeps vocabulary and carry rows with a short one-line gloss, without duplicates', () => {
    expect(deck.length).toBeGreaterThan(400)
    for (const e of deck) {
      expect(e.english.length).toBeLessThanOrEqual(32)
      expect(e.english).not.toMatch(/\.\.\.|…|\//)
    }
    expect(new Set(deck.map(e => `${e.samoan}|${e.english}`)).size).toBe(deck.length)
  })

  it('builds sessions of 12 with four options, three near and never a clashing gloss', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const session = buildSession(deck, {}, seeded(seed))
      expect(session).toHaveLength(SESSION_SIZE)
      for (const { entry, options } of session) {
        expect(options).toHaveLength(4)
        expect(new Set(options.map(o => o.samoan)).size).toBe(4)
        expect(options.some(o => o.id === entry.id)).toBe(true)
        const cue = new Set(contentWords(entry.english))
        for (const o of options.filter(x => x.id !== entry.id)) {
          const row = deck.find(e => e.id === o.id)
          expect(contentWords(row.english).some(w => cue.has(w)), `${entry.english} vs ${row.english}`).toBe(false)
        }
      }
    }
  })

  it('puts the least-known words first', () => {
    const boxes = Object.fromEntries(deck.map(e => [e.id, MAX_BOX]))
    const unseen = deck.slice(0, 12).map(e => e.id)
    for (const id of unseen) delete boxes[id]
    const session = buildSession(deck, boxes, seeded(9))
    expect(session.map(r => r.entry.id).sort()).toEqual([...unseen].sort())
  })

  it('moves a word up a box when right and back to box 1 when wrong', () => {
    expect(nextBox(undefined, true)).toBe(1)
    expect(nextBox(3, true)).toBe(4)
    expect(nextBox(MAX_BOX, true)).toBe(MAX_BOX)
    expect(nextBox(4, false)).toBe(1)
  })

  it('keeps boxes under ls-daily-words-v1 and survives a blocked store', () => {
    expect(STORE_KEY).toBe('ls-daily-words-v1')
    const mem = new Map()
    const store = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }
    saveBoxes({ w0001: 2 }, store)
    expect(loadBoxes(store)).toEqual({ w0001: 2 })
    const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
    expect(loadBoxes(blocked)).toEqual({})
    expect(() => saveBoxes({ a: 1 }, blocked)).not.toThrow()
    mem.set(STORE_KEY, '[1,2]')
    expect(loadBoxes(store)).toEqual({})
  })

  it('uses no file that is not in the course data', () => {
    for (const rel of ['src/premium/lib/daily-words.js', 'src/premium/lib/drills-catalog.js', 'src/premium/data/drills-catalog.json']) {
      const text = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8')
      // Allowed site copy: exactly "Sāmoa", "Sāmoan", "Sāmoans" (Andrew's ruling
      // 2026-10-24, attested at [mosel p.27]); any other marked letter still fails.
      expect(text.replace(/(?<![\p{L}])Sāmoa(?:ns?)?(?![\p{L}])/gu, ' '), rel).not.toMatch(/[āēīōūĀĒĪŌŪʻ]/)
      expect(text, rel).not.toMatch(/—/)
    }
  })
})
