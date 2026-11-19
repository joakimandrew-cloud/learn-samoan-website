// /quiz, the short test "Can you still understand your grandmother?"
// (plans/2026-11-20-samoan-scribbles-site-tour.md, Step 1).
//
// The page's Sāmoan is typed into src/seo/pages/grandmother-quiz.js, so this holds
// it to the book: each question names one line of book/Chapter-NN.md, and that
// line must read, character for character, "*<the Sāmoan>* <the right answer>".
// A changed mark in the Sāmoan, a changed word in the right answer or a moved line
// fails. It also holds the wrong choices, the copy's house rules, the wiring and
// what the prerender serves. The deploy runs the tests before the build, so the
// built page is built here into a temporary folder and no test reads dist/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from '../scripts/prerender.mjs'
import { STATIC_META } from '../src/seo/meta.js'
import { COPY, QUESTIONS, QUIZ_PATH, RESULTS, resultFor } from '../src/seo/pages/grandmother-quiz.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
const text = (...parts) => fs.readFileSync(path.join(APP, ...parts), 'utf8')
const bookLine = ({ file, line }) => text('book', file).split('\n')[line - 1]

const HEADLINE = 'Can you still understand your grandmother?'
const META = {
  title: 'Can You Still Understand Your Grandmother? A Sāmoan Test · Learn Sāmoan',
  description: 'Six sentences a Sāmoan grandmother might say at home, each printed in the course book. Choose what each one means in English and see how much you still understand.',
}
// The words the hub's link to this page shows (src/premium/pages/Quizzes.jsx).
const HUB_LINK = ['Before the chapters', 'A short test', 'Can you still understand your grandmother?', 'Six sentences from the course book']

/** Every English string a visitor can read on the page, in its title or in the link to it. */
const englishStrings = () => [
  ...Object.values(COPY).flat(),
  ...RESULTS.flatMap(r => [r.band, r.body]),
  ...QUESTIONS.flatMap(q => [q.prompt, ...q.options]),
  META.title, META.description,
  ...HUB_LINK,
]

describe('grandmother test: the Sāmoan is the book\'s, word for word', () => {
  it('has six questions, each naming a line of a chapter of the site\'s book copy', () => {
    expect(QUESTIONS).toHaveLength(6)
    expect(new Set(QUESTIONS.map(q => q.id)).size).toBe(6)
    expect(new Set(QUESTIONS.map(q => q.sm)).size).toBe(6)
    for (const q of QUESTIONS) {
      expect(q.source.file, q.id).toMatch(/^Chapter-\d{2}\.md$/)
      expect(Number.isInteger(q.source.line) && q.source.line > 0, q.id).toBe(true)
      expect(fs.existsSync(path.join(APP, 'book', q.source.file)), q.id).toBe(true)
      expect(q.chapter, q.id).toBe(Number(q.source.file.slice(8, 10)))
    }
  })

  it('finds each sentence and its right answer, character for character, on its named book line', () => {
    for (const q of QUESTIONS) {
      const where = `${q.id}: book/${q.source.file}:${q.source.line}`
      expect(bookLine(q.source), where).toBe(`*${q.sm}* ${q.options[q.answer]}`)
    }
  })

  it('writes the glottal stop as U+02BB and never as an apostrophe or a quote mark', () => {
    for (const q of QUESTIONS) expect(q.sm, q.id).not.toMatch(/['‘’`*]/)
  })
})

describe('grandmother test: the choices', () => {
  it('gives each question four different choices and one right answer', () => {
    for (const q of QUESTIONS) {
      expect(q.options, q.id).toHaveLength(4)
      expect(new Set(q.options.map(o => o.toLowerCase())).size, q.id).toBe(4)
      expect([0, 1, 2, 3], q.id).toContain(q.answer)
    }
    // The right answer does not sit in one place: every letter is right at least once.
    expect(new Set(QUESTIONS.map(q => q.answer)).size).toBe(4)
  })

  it('writes the wrong choices in English only, in the shape of the right one', () => {
    for (const q of QUESTIONS) {
      const right = q.options[q.answer]
      const words = s => s.split(/\s+/).length
      for (const wrong of q.options.filter((_, i) => i !== q.answer)) {
        expect(wrong, q.id).not.toMatch(/[āēīōūĀĒĪŌŪʻ]/)
        expect(wrong.at(-1), `${q.id}: "${wrong}" ends as the right answer does`).toBe(right.at(-1))
        expect(/^[A-Z]/.test(wrong), `${q.id}: "${wrong}"`).toBe(true)
        expect(Math.abs(words(wrong) - words(right)), `${q.id}: "${wrong}" is about as long as "${right}"`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('keeps out the second readings the book gives each sentence', () => {
    const wrongOf = id => { const q = QUESTIONS.find(x => x.id === id); return q.options.filter((_, i) => i !== q.answer).join(' ') }
    expect(wrongOf('hello')).not.toMatch(/sympath|sorry|feel for/i)
    expect(wrongOf('mat')).not.toMatch(/\b(stay|live) on the mat/i)
    expect(wrongOf('towel')).not.toMatch(/^If |\. If |\btake the towel/i)
    expect(wrongOf('thanks')).not.toMatch(/no,? thank/i)
    expect(wrongOf('goodbye')).not.toMatch(/health|sleep|night|farewell/i)
  })
})

describe('grandmother test: the copy', () => {
  it('has the headline, and three result bands for 0 to 2, 3 or 4, and 5 or 6', () => {
    expect(COPY.h1.join(' ')).toBe(HEADLINE)
    expect(RESULTS.map(r => r.min)).toEqual([0, 3, 5])
    expect([0, 1, 2, 3, 4, 5, 6].map(score => RESULTS.indexOf(resultFor(score)))).toEqual([0, 0, 0, 1, 1, 2, 2])
    expect(new Set(RESULTS.map(r => r.band)).size).toBe(3)
  })

  it('says nothing of cost or access, and holds no U+2014, spaced hyphen, "Lesson" or CEFR label', () => {
    for (const s of englishStrings()) {
      expect(s).not.toMatch(/free|paid|price|member|open|subscri|donat|support/i)
      expect(s).not.toMatch(/—/)
      expect(s).not.toMatch(/ [-–] /)
      expect(s).not.toMatch(/\bLessons?\b/i)
      expect(s).not.toMatch(/\b[ABC][12]\b/)
    }
  })

  it('carries the macron on Sāmoa and Sāmoan, and no other marked word outside the six sentences', () => {
    for (const s of englishStrings()) {
      expect(s).not.toMatch(/\bSamoan?\b/)
      const marked = (s.match(/[\p{L}ʻ]+/gu) || []).filter(w => /[āēīōūĀĒĪŌŪʻ]/.test(w))
      expect(marked.filter(w => !/^Sāmoan?$/.test(w)), s).toEqual([])
    }
  })

  it('keeps every word the page shows in the data module: the page file types no sentence of its own', () => {
    const page = text('src', 'premium', 'pages', 'GrandmotherQuiz.jsx')
    // Its comments aside, the file holds no marked letter at all, so no Sāmoan is typed in it.
    const code = page.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n')
    expect(code).not.toMatch(/[āēīōūĀĒĪŌŪʻ—]/)
    expect(page).not.toMatch(/free|paid|price|member|subscri|donat|support|href=/i)
    expect(page).toContain('to="/chapters/1"')
    expect(page).toContain("from '@app/seo/pages/grandmother-quiz.js'")
  })
})

describe('grandmother test: the wiring', () => {
  it('has its route, its meta row and one link from the quizzes hub, and leaves the home page alone', () => {
    expect(QUIZ_PATH).toBe('/quiz')
    expect(text('src', 'premium', 'App.jsx')).toContain('<Route path="/quiz" element={<Page><GrandmotherQuiz /></Page>} />')
    expect(STATIC_META[QUIZ_PATH]).toEqual(META)
    expect(META.title.length).toBeLessThanOrEqual(80)
    expect(META.description.length).toBeLessThanOrEqual(220)
    const hub = text('src', 'premium', 'pages', 'Quizzes.jsx')
    expect(hub.match(/to="\/quiz"/g)).toHaveLength(1)
    for (const s of HUB_LINK) expect(hub, s).toContain(`>${s}<`)
    expect(text('src', 'premium', 'pages', 'Home.jsx')).not.toMatch(/["'`]\/quiz["'`]/)
  })

  it('uses the site\'s own stylesheets and tokens: no colour and no font of its own', () => {
    const css = text('src', 'premium', 'styles', 'grandmother-quiz.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|@font-face|@import/i)
    for (const m of css.matchAll(/font(?:-family)?:[^;]*/g)) expect(m[0].replace(/var\([^)]*\)/g, '')).not.toMatch(/['"]|serif|sans|Georgia|Arial/)
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) expect(text('src', 'premium', 'styles', 'base.css'), m[1]).toContain(`${m[1]}:`)
  })
})

describe('grandmother test: what the prerender serves', () => {
  let dist
  let result
  let html
  const article = page => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(page)?.[1] ?? ''
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  const plainText = page => unescape(page.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-quiz-'))
    fs.copyFileSync(path.join(APP, 'index.html'), path.join(dist, 'index.html'))
    result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
    html = fs.readFileSync(path.join(dist, 'quiz.html'), 'utf8')
  })

  afterAll(() => {
    fs.rmSync(dist, { recursive: true, force: true })
  })

  it('writes both file forms with one title, the description and the canonical', () => {
    expect(fs.readFileSync(path.join(dist, 'quiz', 'index.html'), 'utf8')).toBe(html)
    expect(html.match(/<title>/g)).toHaveLength(1)
    expect(unescape(/<title>([\s\S]*?)<\/title>/.exec(html)[1])).toBe(META.title)
    expect(unescape(/<meta name="description" content="([^"]*)"/.exec(html)[1])).toBe(META.description)
    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/quiz" />`)
    expect(html).not.toContain('noindex')
  })

  it('serves the headline, the lead-in and the six sentences inside #root, each marked lang="sm"', () => {
    const served = article(html)
    expect(html).toContain('<div id="root"><!-- prerender:root --><article ')
    expect((served.match(/<h1[ >]/g) || []).length).toBe(1)
    expect(plainText(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(served)[1])).toBe(HEADLINE)
    expect(plainText(served)).toContain(COPY.lead)
    const marked = [...served.matchAll(/<span lang="sm">([\s\S]*?)<\/span>/g)].map(m => unescape(m[1]))
    expect(marked).toEqual(QUESTIONS.map(q => q.sm))
    expect(served.match(/lang="sm"/g)).toHaveLength(6)
    // Outside those six spans the only marked word is the site's own "Sāmoan".
    expect(plainText(served.replace(/<span lang="sm">[\s\S]*?<\/span>/g, '')).replace(/Sāmoan/g, '')).not.toMatch(/[āēīōūĀĒĪŌŪʻ]/)
  })

  it('serves no answer, links each sentence to its chapter and ends on Chapter 1', () => {
    const served = article(html)
    const words = plainText(served)
    for (const q of QUESTIONS) {
      expect(served, q.id).toContain(`href="/chapters/${q.chapter}"`)
      for (const option of q.options) expect(words, `${q.id}: "${option}" is not served`).not.toContain(option)
    }
    expect(served).toContain('<a href="/chapters/1"')
    expect(words).not.toMatch(/free|paid|price|member|open|—/i)
    const built = new Set(result.routes.map(r => r.path))
    for (const m of served.matchAll(/href="([^"]+)"/g)) expect(built.has(m[1]), `links to ${m[1]}`).toBe(true)
  })

  it('is in the sitemap, with a WebPage node of its own URL and description', () => {
    expect(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')).toContain(`<loc>${ORIGIN}/quiz</loc>`)
    expect(result.routes.filter(r => r.path === '/quiz')).toHaveLength(1)
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))
    expect(blocks).toHaveLength(1)
    const graph = blocks[0]['@graph']
    expect(graph.map(n => n['@type'])).toEqual(['Organization', 'WebSite', 'WebPage'])
    expect(graph[2].url).toBe(`${ORIGIN}/quiz`)
    expect(graph[2].name).toBe(META.title)
    expect(graph[2].description).toBe(META.description)
    expect(JSON.stringify(graph)).not.toMatch(/"offers"|"price"|isAccessibleForFree|—/)
  })
})
