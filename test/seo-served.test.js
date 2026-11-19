// The prerender (Build-Spec parts a to c): readable text inside #root, one title and one
// canonical per page, structured data that parses, nothing stacked by a second run.
// The deploy runs the tests before the build, so this builds what it reads: it runs
// the prerender into a temporary folder from the source index.html and never reads dist/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bookExercises from '../src/data/book-exercises.json'
import chapters from '../src/data/chapters.json'
import quizzes from '../src/data/quizzes.json'
import { prerender } from '../scripts/prerender.mjs'
import { introParagraphs } from '../scripts/lib/book-html.mjs'
import { metaForPath } from '../src/seo/meta.js'
import { withCounter } from '../src/seo/counter.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
let dist
let result

const file = route => (route === '/' ? path.join(dist, 'index.html') : path.join(dist, `${route.slice(1)}.html`))
const read = route => fs.readFileSync(file(route), 'utf8')
const count = (html, re) => (html.match(re) || []).length
const article = html => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(html)?.[1] ?? ''
const textOf = html => html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
const plain = s => String(s).replace(/\*+/g, '').replace(/\s+/g, ' ').trim()
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))

beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-prerender-'))
  // A counter in the template must survive into every page exactly once.
  fs.writeFileSync(path.join(dist, 'index.html'), withCounter(fs.readFileSync(path.join(APP, 'index.html'), 'utf8'), 'testcode'))
  result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
})

afterAll(() => {
  fs.rmSync(dist, { recursive: true, force: true })
})

describe('seo: every sitemap page', () => {
  it('has a title no other page has, and the module and the file agree', () => {
    const titles = new Map()
    for (const r of result.routes) {
      const html = read(r.path)
      expect(count(html, /<title>/g), r.path).toBe(1)
      const title = /<title>([\s\S]*?)<\/title>/.exec(html)[1].replaceAll('&amp;', '&')
      expect(title, r.path).toBe(r.title)
      expect(titles.has(title), `${r.path} repeats the title of ${titles.get(title)}`).toBe(false)
      titles.set(title, r.path)
    }
    expect(titles.size).toBeGreaterThan(170)
  })

  it('lists every route in sitemap.xml', () => {
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
    for (const r of result.routes) expect(sitemap, r.path).toContain(`<loc>${r.path === '/' ? `${ORIGIN}/` : `${ORIGIN}${r.path}`}</loc>`)
    expect(count(sitemap, /<loc>/g)).toBe(result.routes.length)
  })

  it('serves readable text between the markers, and the app would set the same title', () => {
    for (const r of result.routes) {
      const html = read(r.path)
      expect(count(html, /<!-- prerender:root -->/g), r.path).toBe(1)
      expect(count(html, /<article /g), r.path).toBe(1)
      expect(count(html, /<h1[ >]/g), r.path).toBe(1)
      expect(textOf(article(html)).length, r.path).toBeGreaterThan(80)
      const meta = metaForPath(r.path, { chapters })
      if (meta) expect(meta, r.path).toEqual({ title: r.title, description: r.description })
    }
  })

  it('holds no U+2014 and no "Lesson" in a title, description or served article', () => {
    for (const r of result.routes) {
      const html = read(r.path)
      const served = [r.title, r.description, textOf(article(html))].join('\n')
      expect(served, r.path).not.toMatch(/—/)
      expect(served, r.path).not.toMatch(/\bLesson/)
    }
  })

  it('carries the counter line once when the template has one', () => {
    for (const r of result.routes) expect(count(read(r.path), /data-goatcounter="https:\/\/testcode\.goatcounter\.com\/count"/g), r.path).toBe(1)
  })
})

describe('seo: structured data', () => {
  it('parses, as one @graph per page, with the page\'s own URL and no offer or price', () => {
    for (const r of result.routes) {
      const html = read(r.path)
      const blocks = jsonLd(html)
      expect(blocks, r.path).toHaveLength(1)
      const graph = blocks[0]['@graph']
      const own = r.path === '/' ? `${ORIGIN}/` : `${ORIGIN}${r.path}`
      expect(graph.some(n => n.url === own), `${r.path} has a node with its own URL`).toBe(true)
      expect(graph.some(n => n['@type'] === 'Organization'), r.path).toBe(true)
      const raw = JSON.stringify(graph)
      expect(raw, r.path).not.toMatch(/"offers"|"price"|isAccessibleForFree/)
      expect(raw, r.path).not.toMatch(/—/)
    }
  })

  it('gives each route kind the nodes of part (c)', () => {
    const types = route => jsonLd(read(route))[0]['@graph'].map(n => n['@type'])
    expect(types('/')).toEqual(['Organization', 'WebSite', 'Course'])
    expect(types('/chapters')).toEqual(['Organization', 'WebSite', 'Course', 'ItemList', 'BreadcrumbList'])
    expect(types('/chapters/1')).toEqual(['Organization', 'WebSite', 'Course', 'LearningResource', 'BreadcrumbList'])
    expect(types('/quizzes/1')).toEqual(['Organization', 'WebSite', 'Quiz', 'BreadcrumbList'])
    expect(types('/drills')).toEqual(['Organization', 'WebSite', 'WebPage'])
    const drill = result.routes.find(r => r.kind === 'drill')
    expect(types(drill.path)).toEqual(['Organization', 'WebSite', 'LearningResource', 'BreadcrumbList'])
    expect(jsonLd(read(drill.path))[0]['@graph'][2].learningResourceType).toBe('Practice drill')
  })
})

describe('seo: a chapter is served as its heading and opening paragraphs only', () => {
  it('holds the heading, at most two opening paragraphs and none of the chapter\'s exercise answers', () => {
    for (const c of chapters) {
      const n = c.chapter
      const md = fs.readFileSync(path.join(APP, 'book', `Chapter-${String(n).padStart(2, '0')}.md`), 'utf8')
      const opening = introParagraphs(md, 2)
      expect(opening.length, `chapter ${n} opening`).toBeGreaterThan(0)
      expect(opening.length, `chapter ${n} opening`).toBeLessThanOrEqual(2)
      const html = article(read(`/chapters/${n}`))
      expect(textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1])).toBe(`Chapter ${n}: ${plain(c.title)}`)
      const served = textOf(html)
      const openingText = opening.map(plain).join(' ')
      for (const exercise of bookExercises[String(n)] || []) {
        for (const item of exercise.items || []) {
          const answer = plain(item.answer)
          if (answer.length < 8) continue
          // An answer may be quoted in the opening paragraphs themselves; it may not appear anywhere else.
          if (served.includes(answer)) expect(openingText, `chapter ${n} serves the answer "${answer}" outside its opening`).toContain(answer)
        }
      }
      // The opening paragraphs are the only running prose: the rest is crumb, section names, links.
      expect(count(html, /<p /g), `chapter ${n} paragraphs`).toBeLessThanOrEqual(opening.length + 3)
    }
  })

  it('serves a quiz as one sentence and a link, never its questions', () => {
    for (const [n, quiz] of Object.entries(quizzes)) {
      const served = textOf(article(read(`/quizzes/${n}`)))
      expect(served).toContain(`${quiz.questions.length} questions on Chapter ${n}`)
      for (const q of quiz.questions) expect(served, `quiz ${n}`).not.toContain(plain(q.prompt))
    }
  })
})

describe('seo: a second run without a rebuild stacks nothing', () => {
  it('leaves one canonical link, one JSON-LD script and one article per page', () => {
    const before = read('/chapters/1')
    prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
    const after = read('/chapters/1')
    expect(after).toBe(before)
    for (const route of ['/', '/chapters/1', '/drills', '/pronunciation']) {
      const html = read(route)
      expect(count(html, /<link rel="canonical"/g), route).toBe(1)
      expect(count(html, /application\/ld\+json/g), route).toBe(1)
      expect(count(html, /<article /g), route).toBe(1)
      expect(count(html, /<title>/g), route).toBe(1)
    }
  })

  it('writes robots.txt with the test-only routes disallowed', () => {
    const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8')
    for (const p of ['/lab/', '/__proto/', '/scrub']) expect(robots).toContain(`Disallow: ${p}`)
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`)
  })
})
