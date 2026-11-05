// The calm chapter page across the whole range (plan 2026-11-06-chapter-page-simplify, Step 7):
// guards that hold for all 52 chapters, for the book pages that share the page's pieces, and for
// the production build. The browser sweep (reviews/lesson-simplify-2026-11-06/tools/sweep-chapters.cjs)
// covers what only a browser can see.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import quickPractice from '../src/data/quick-practice.json'
import bookExercises from '../src/data/book-exercises.json'
import { parseLessonContent } from '../src/premium/lib/lesson-content.js'
import { slugify } from '../src/lib/slugify.js'
import { figureNumbers, groupSections } from '../src/premium/lib/chapter-page.js'

const APP = path.join(__dirname, '..')
const read = (...p) => fs.readFileSync(path.join(APP, ...p), 'utf8')
const nn = n => String(n).padStart(2, '0')
const chapter = n => {
  const md = read('book', `Chapter-${nn(n)}.md`)
  const file = path.join(APP, 'src', 'data', 'interactives', `${nn(n)}.json`)
  const interactives = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).items : []
  const lesson = parseLessonContent(md, { chapter: n, quickPractices: quickPractice[String(n)] || [], exercises: bookExercises[String(n)] || [], interactives, slugify })
  return { lesson, sections: groupSections(lesson.blocks), interactives: new Map(interactives.map(item => [item.id, item])) }
}

describe('all 52 chapters', () => {
  // Chapter 14's figure file is the only one this test reads: figure files for other chapters arrive in
  // later steps and are held by check:figures, so a file half written by an author never fails the unit tests.
  it('number their figures 1 to k in reading order, with none repeated, whether or not a chapter has a figure file', async () => {
    for (let n = 1; n <= 52; n += 1) {
      const { sections, interactives } = chapter(n)
      const mod = n === 14 ? await import('../src/premium/figures/14.js') : {}
      const out = figureNumbers({ n, sections, interactives, figures: mod.FIGURES || [], replaces: mod.REPLACES || [] })
      const labels = [...out.figure.values(), ...out.interactive.values()].sort((a, b) => Number(a.split('.')[1]) - Number(b.split('.')[1]))
      expect(labels, `chapter ${n}`).toEqual(Array.from({ length: out.count }, (_, i) => `${n}.${i + 1}`))
    }
  })

  it('end every chapter\'s page in the sections the page lays out: an Exercises section, or the exercises inline', () => {
    const inline = new Set([24, 42])
    for (let n = 1; n <= 52; n += 1) {
      const { sections } = chapter(n)
      expect(sections.length, `chapter ${n} sections`).toBeGreaterThan(0)
      if (!inline.has(n)) expect(sections.some(s => s.exercises), `chapter ${n} has an Exercises section`).toBe(true)
    }
  })
})

describe('Chapter 14, the first chapter', () => {
  it('ends each text alternative where the book\'s sentence ends (look note 3)', async () => {
    const { FIGURES } = await import('../src/premium/figures/14.js')
    for (const def of FIGURES) for (const line of def.alt) expect(line, `${def.id} alt line`).toMatch(/[.!?]['”"]?\)?\.?$/)
  })
})

describe('the book pages that share the page\'s pieces', () => {
  const lesson = read('src', 'premium', 'pages', 'Lesson.jsx')
  const bookPage = read('src', 'premium', 'pages', 'BookPage.jsx')
  it('keep the exports BookPage imports from Lesson.jsx', () => {
    for (const name of ['Rail', 'RenderBlock', 'Section']) {
      if (new RegExp(`\\b${name}\\b`).test(bookPage.match(/import[^;]*Lesson\.jsx['"]/s)?.[0] || '')) expect(lesson, name).toMatch(new RegExp(`export (function|const) ${name}\\b`))
    }
    expect(bookPage).toMatch(/Lesson\.jsx/)
  })
  it('keep the mobile compass component for the book pages', () => {
    expect(fs.existsSync(path.join(APP, 'src', 'premium', 'components', 'lesson', 'MobileCompass.jsx'))).toBe(true)
  })
})

describe('one caption treatment for new and Interactive figures (look note 4)', () => {
  const css = read('src', 'premium', 'styles', 'interactive.css') + read('src', 'premium', 'styles', 'chapter-page.css')
  const rule = sel => css.match(new RegExp(`^${sel.replace(/[.]/g, '\\.')}\\s*\\{([^}]*)\\}`, 'm'))?.[1]?.replace(/\s+/g, ' ').trim()
  it('gives the Interactive caption the hairline, spacing and type the figure caption has', () => {
    const a = rule('.fx-caption')
    const b = rule('.ix-fig figcaption')
    expect(a).toBeTruthy()
    expect(b).toBe(a)
  })
})

describe('the production build', () => {
  it('mounts the figure scrubber and the proto route only on a test build', () => {
    const app = read('src', 'premium', 'App.jsx')
    expect(app).toMatch(/__TEST_BUILD__ \? lazy\(\(\) => import\('\.\/pages\/ScrubPage\.jsx'\)\) : null/)
    expect(app).toMatch(/__TEST_BUILD__ && <Route path="\/scrub"/)
    expect(app).toMatch(/__TEST_BUILD__ && <Route path="\/__proto\/chapter\/:num"/)
  })
  it('folds __TEST_BUILD__ to false unless the dev server or LS_TEST_BUILD=1 asks for it', () => {
    expect(read('vite.config.js')).toMatch(/__TEST_BUILD__: JSON\.stringify\(command === 'serve' \|\| process\.env\.LS_TEST_BUILD === '1'\)/)
  })
  it('keeps the old /lessons/:n addresses pointing at /chapters/:n', () => {
    expect(read('src', 'premium', 'App.jsx')).toMatch(/\/lessons\/:num/)
  })
})
