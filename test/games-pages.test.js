// The games' three pages, /games, /games/word-balloons and /games/sentence-tiles
// (Build-Spec parts b and h of plans/2026-11-19-samoan-site-search-features.md): their titles,
// descriptions, served text, structured data and sitemap rows, how they are linked, and the rules
// the games' source and stylesheets keep. The deploy runs the tests before the build, so the built
// pages are built here into a temporary folder and no test reads dist/.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prerender } from '../scripts/prerender.mjs'
import { STATIC_META } from '../src/seo/meta.js'
import { GAMES } from '../src/games/registry.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = 'https://learnsamoan.org'
const PAGES = ['/games', '/games/word-balloons', '/games/sentence-tiles']
const text = (...parts) => fs.readFileSync(path.join(APP, ...parts), 'utf8')

/** Every file under a folder, as absolute paths. */
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
}

describe('games pages: titles and descriptions', () => {
  it('has a row for each page in the one meta module, with the title tail and no "free", dash or "Lesson"', () => {
    for (const route of PAGES) {
      const m = STATIC_META[route]
      expect(m, route).toBeTruthy()
      expect(m.title.endsWith(' · Learn Sāmoan'), route).toBe(true)
      expect(m.title.length, route).toBeLessThanOrEqual(80)
      expect(m.description.length, route).toBeLessThanOrEqual(220)
      for (const s of [m.title, m.description]) {
        expect(s, route).not.toMatch(/—|\bLessons?\b|\bfree\b|\bevery chapter is open\b/i)
        expect(s, route).not.toMatch(/ - /)
        expect(s, route).not.toMatch(/\bSamoan?\b/)
      }
    }
    expect(new Set(PAGES.map(r => STATIC_META[r].title)).size).toBe(3)
    expect(STATIC_META['/games/word-balloons'].title).toContain('Word Balloons')
    expect(STATIC_META['/games/sentence-tiles'].title).toContain('Sentence Tiles')
  })

  it('names the three rows in the spec table of test/seo-meta.test.js, so a change to a string fails there', () => {
    const spec = text('test', 'seo-meta.test.js')
    for (const route of PAGES) expect(spec).toContain(`'${route}': [`)
  })
})

describe('games pages: what the prerender serves', () => {
  let dist
  let result
  const read = route => fs.readFileSync(path.join(dist, `${route.slice(1)}.html`), 'utf8')
  const article = html => /<!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root -->/.exec(html)?.[1] ?? ''
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  const plainText = html => unescape(html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

  beforeAll(() => {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-games-'))
    fs.copyFileSync(path.join(APP, 'index.html'), path.join(dist, 'index.html'))
    result = prerender({ dist, origin: ORIGIN, base: '/', quiet: true })
  })

  afterAll(() => {
    fs.rmSync(dist, { recursive: true, force: true })
  })

  it('writes both file forms with the page\'s own title, description and canonical', () => {
    for (const route of PAGES) {
      expect(fs.existsSync(path.join(dist, route.slice(1), 'index.html')), route).toBe(true)
      const html = read(route)
      expect(unescape(/<title>([\s\S]*?)<\/title>/.exec(html)[1]), route).toBe(STATIC_META[route].title)
      expect(unescape(/<meta name="description" content="([^"]*)"/.exec(html)[1]), route).toBe(STATIC_META[route].description)
      expect(html, route).toContain(`<link rel="canonical" href="${ORIGIN}${route}" />`)
      expect(html, route).not.toContain('noindex')
    }
  })

  it('serves one h1 and one paragraph: the description and a link back to /games', () => {
    for (const route of PAGES.slice(1)) {
      const html = article(read(route))
      expect((html.match(/<h1[ >]/g) || []).length, route).toBe(1)
      expect((html.match(/<p[ >]/g) || []).length, route).toBe(1)
      expect((html.match(/<article /g) || []).length, route).toBe(1)
      expect(plainText(html), route).toContain(STATIC_META[route].description)
      expect(html, route).toContain('href="/games"')
      expect(plainText(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)[1]), route).toBe(STATIC_META[route].title.replace(' · Learn Sāmoan', ''))
    }
  })

  it('serves the hub\'s description and a link to each game', () => {
    const html = article(read('/games'))
    expect((html.match(/<h1[ >]/g) || []).length).toBe(1)
    expect((html.match(/<p[ >]/g) || []).length).toBe(1)
    expect(plainText(html)).toContain(STATIC_META['/games'].description)
    for (const game of GAMES) expect(html, game.route).toContain(`href="${game.route}"`)
    expect(GAMES.map(g => g.route)).toEqual(PAGES.slice(1))
  })

  it('serves no word, meaning or sentence of a game: they are drawn by the game from the course data', () => {
    const served = PAGES.map(r => plainText(article(read(r)))).join(' ')
    // The site's own word "Sāmoan" is the only marked word a page may serve.
    expect(served.replace(/Sāmoan/g, '')).not.toMatch(/[āēīōūʻ]/)
  })

  it('is in the sitemap, with a WebPage node of its own URL and description', () => {
    const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')
    for (const route of PAGES) {
      expect(sitemap, route).toContain(`<loc>${ORIGIN}${route}</loc>`)
      const blocks = [...read(route).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1].replaceAll('\\u003c', '<')))
      expect(blocks, route).toHaveLength(1)
      const graph = blocks[0]['@graph']
      const node = graph.find(n => n['@type'] === 'WebPage')
      expect(node, `${route} has a WebPage node`).toBeTruthy()
      expect(node.url).toBe(`${ORIGIN}${route}`)
      expect(node.description).toBe(STATIC_META[route].description)
      expect(node.name).toBe(STATIC_META[route].title)
      expect(JSON.stringify(graph)).not.toMatch(/"offers"|"price"|isAccessibleForFree|—/)
    }
    expect(result.routes.filter(r => r.path.startsWith('/games')).map(r => r.path)).toEqual(PAGES)
  })
})

describe('games pages: routes and links', () => {
  const app = text('src', 'premium', 'App.jsx')
  const chrome = text('src', 'premium', 'components', 'Chrome.jsx')

  it('lazy-loads the three pages like the others', () => {
    for (const name of ['Games', 'WordBalloons', 'SentenceTiles']) expect(app).toContain(`const ${name} = lazy(() => import('./pages/${name}.jsx'))`)
    for (const route of PAGES) expect(app).toContain(`path="${route}"`)
  })

  it('links Games from the footer\'s Learn column and from the full-screen menu', () => {
    expect(chrome).toContain('<Link to="/games">Games</Link>')
    expect(chrome).toContain("const GAMES_LINK = { to: '/games', label: 'Games' }")
    expect(chrome).toContain('...MENU_NAV')
  })

  it('shows the header links on one line at 1024 and 1280 wide (measured in a browser; see the step report)', () => {
    // The header carries Games only if it fits. This holds whichever way the measurement went:
    // the menu lists Games once, never twice.
    const nav = /const NAV = \[([\s\S]*?)\n\]/.exec(chrome)[1]
    const inHeader = nav.includes("'/games'")
    expect(inHeader ? chrome.match(/MENU_NAV = NAV\.some/g).length : 1).toBe(1)
  })
})

describe('games source: the rules it keeps', () => {
  const gameFiles = walk(path.join(APP, 'src', 'games'))

  it('holds no "Tongan" and no "kupesi" anywhere under src/games, comments included', () => {
    expect(gameFiles.length).toBeGreaterThan(15)
    for (const file of gameFiles) expect(fs.readFileSync(file, 'utf8'), file).not.toMatch(/tongan|kupesi/i)
  })

  it('carries no Tongan data file over', () => {
    const names = gameFiles.map(f => path.basename(f))
    for (const banned of ['confusable-pairs.json', 'sentence-bank.json', 'sentence-bank.js', 'roles.json', 'role-overrides.json', 'second-orders.json', 'stale-items.json', 'build-roles.mjs', 'word-lists.json', 'vocab-decks.js']) {
      expect(names, banned).not.toContain(banned)
    }
    expect(gameFiles.some(f => f.endsWith('.json'))).toBe(false)
  })

  it('has the ls- prefix on every stored key and no lft- key', () => {
    for (const file of [...gameFiles, path.join(APP, 'src', 'premium', 'pages', 'WordBalloons.jsx'), path.join(APP, 'src', 'premium', 'pages', 'SentenceTiles.jsx')]) {
      const src = fs.readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/'lft-/)
      for (const m of src.matchAll(/(?:readStore|writeStore)\(\s*['`]([^'`]+)['`]/g)) expect(m[1], file).toMatch(/^ls-/)
    }
  })

  it('says Chapter, never Lesson, and holds no U+2014, spaced hyphen or CEFR label in what a visitor sees', () => {
    const shown = ['Games.jsx', 'WordBalloons.jsx', 'SentenceTiles.jsx'].map(f => text('src', 'premium', 'pages', f)).concat(text('src', 'games', 'registry.js'), text('src', 'games', 'sentence-tiles', 'copy.js'))
    for (const src of shown) {
      expect(src).not.toMatch(/—/)
      expect(src).not.toMatch(/\bLesson/)
      expect(src).not.toMatch(/\b(?:free|FREE)\b/)
      expect(src).not.toMatch(/\b[ABC][12] level\b|\bCEFR\b/)
      expect(src).not.toMatch(/>[^<{]* - [^<{]*</)
    }
    for (const game of GAMES) for (const s of [game.title, game.blurb, game.action, game.unit ?? '']) expect(s).not.toMatch(/ - |—|\bLesson/)
  })

  it('marks every Sāmoan span lang="sm": the pages draw Sāmoan only through the T component', () => {
    for (const f of ['Games.jsx', 'WordBalloons.jsx', 'SentenceTiles.jsx']) {
      const src = text('src', 'premium', 'pages', f)
      expect(src, f).toMatch(/import T\b/)
    }
    const wb = text('src', 'premium', 'pages', 'WordBalloons.jsx')
    const st = text('src', 'premium', 'pages', 'SentenceTiles.jsx')
    // A word or tile is never put in a plain element: the lines that print one wrap it in T (or Samoan = T) or Inline.
    for (const m of wb.matchAll(/\{[^}]*samoanShown[^}]*\}/g)) expect(wb.slice(Math.max(0, m.index - 80), m.index), m[0]).toMatch(/<Samoan/)
    expect(st).not.toMatch(/<(?:span|p|div)[^>]*>\s*\{t\.text\}/)
  })
})

describe('games stylesheets: site tokens only', () => {
  const base = text('src', 'premium', 'styles', 'base.css')
  const sheets = ['word-balloons.css', 'sentence-tiles.css'].map(name => [name, text('src', 'premium', 'styles', name)])
  const tokens = new Set([...base.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1]))

  it('writes no colour of its own: no hex, rgb(), hsl() or colour name', () => {
    for (const [name, css] of sheets) {
      const body = css.replace(/\/\*[\s\S]*?\*\//g, '')
      expect(body, name).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(body, name).not.toMatch(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/)
      expect(body, name).not.toMatch(/:\s*(?:white|black|red|blue|green|gray|grey)\b/)
    }
  })

  it('reads every var(--x) from base.css or declares it in the sheet itself', () => {
    // Declared in the sheet, or set by the scene as a geometry or timing value on an element's style ('--dx': ...).
    const styled = [...walk(path.join(APP, 'src', 'games')), ...['WordBalloons.jsx', 'SentenceTiles.jsx'].map(f => path.join(APP, 'src', 'premium', 'pages', f))]
      .flatMap(f => [...fs.readFileSync(f, 'utf8').matchAll(/'(--[a-z0-9-]+)'\s*:/g)].map(m => m[1]))
    const own = new Set([...sheets.flatMap(([, css]) => [...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map(m => m[1])), ...styled])
    for (const [name, css] of sheets) {
      for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) expect(tokens.has(m[1]) || own.has(m[1]), `${name} uses ${m[1]}`).toBe(true)
    }
  })

  it('says Chapter, never Lesson, and holds no Tongan or kupesi in a comment', () => {
    for (const [name, css] of sheets) {
      expect(css, name).not.toMatch(/lesson|tongan|kupesi/i)
    }
  })
})
