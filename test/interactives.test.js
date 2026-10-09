// The honesty gate for chapter interactives, and their placement. Every Samoan
// string must be printed in the course (scripts/check-interactives.mjs), and
// every interactive must land exactly once on its chapter page.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { chapterFiles, readJson, validateFile, pairedIn, plainText } from '../scripts/check-interactives.mjs'
import { parseLessonContent } from '../src/premium/lib/lesson-content.js'
import { slugify } from '../src/lib/slugify.js'
import exercises from '../src/data/book-exercises.json'
import quickPractice from '../src/data/quick-practice.json'

const APP = path.join(__dirname, '..')
const book = name => fs.readFileSync(path.join(APP, 'book', name), 'utf8')
const pad = n => String(n).padStart(2, '0')
const fixtureDir = path.join(APP, 'src', 'premium', 'components', 'interactive', 'fixtures')
const fixtures = fs.existsSync(fixtureDir) ? fs.readdirSync(fixtureDir).filter(f => f.endsWith('.json')).map(f => path.join(fixtureDir, f)) : []

describe('chapter interactives', () => {
  for (const file of chapterFiles()) {
    const rel = path.relative(APP, file)
    it(`${rel} shows only printed Samoan`, () => {
      const data = readJson(file)
      expect(data.chapter, `${rel}: file name and chapter`).toBe(Number(path.basename(file, '.json')))
      const { errors } = validateFile(data, { file: rel })
      expect(errors, errors.join('\n')).toEqual([])
    })
    it(`${rel} places every interactive once`, () => {
      const data = readJson(file)
      const n = data.chapter
      const lesson = parseLessonContent(book(`Chapter-${pad(n)}.md`), {
        chapter: n,
        exercises: exercises[String(n)] || [],
        quickPractices: quickPractice[String(n)] || [],
        interactives: data.items,
        slugify,
      })
      expect(lesson.unplacedInteractives, `${rel}: anchors that match no heading`).toEqual([])
      const shown = lesson.blocks.filter(b => b.type === 'interactive').map(b => b.id)
      expect(shown.sort()).toEqual(data.items.map(x => x.id).sort())
    })
  }

  for (const file of fixtures) {
    const rel = path.relative(APP, file)
    it(`${rel} (lab fixture) shows only printed Samoan`, () => {
      const { errors } = validateFile(readJson(file), { file: rel })
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})


describe('printed translation pairing boundaries', () => {
  it('rejects a word fragment at either English endpoint', () => {
    expect(pairedIn(10, 'lana', 'hi')).toBe(false)
    expect(pairedIn(10, 'lona', 'hi')).toBe(false)
    const isolated = { chapters: new Map([[1, plainText('| his | lana |')]]), intro: '' }
    expect(pairedIn(1, 'lana', 'is', isolated)).toBe(false)
    expect(pairedIn(1, 'lana', 'his', isolated)).toBe(true)
  })
  it('keeps leading words that belong to a printed gloss', () => {
    expect(pairedIn(1, 'sā', 'the past particle: puts the whole sentence in the past')).toBe(true)
    expect(pairedIn(1, 'timu', 'to rain (the weather word)')).toBe(true)
  })
  it('rejects either neighbour row as a translation', () => {
    const rows = book('Chapter-02.md').split('\n').filter(line => /^\| \*(?:ʻoulua|ʻoutou)\*/.test(line)).slice(0, 2).join('\n')
    expect(rows.split('\n')).toHaveLength(2)
    const isolated = { chapters: new Map([[2, plainText(rows)]]), intro: '' }
    expect(pairedIn(2, 'ʻoulua', 'you two', isolated)).toBe(true)
    expect(pairedIn(2, 'ʻoutou', 'you all', isolated)).toBe(true)
    expect(pairedIn(2, 'ʻoulua', 'you all', isolated)).toBe(false)
    expect(pairedIn(2, 'ʻoutou', 'you two', isolated)).toBe(false)
  })
  it('keeps the literal column paired to its own sentence', () => {
    expect(pairedIn(27, 'e le tama', 'the boy')).toBe(true)
  })
})
