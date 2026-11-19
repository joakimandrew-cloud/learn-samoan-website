#!/usr/bin/env node
/**
 * The post-build pass that gives every public route a real HTML file.
 *
 * GitHub Pages serves a single-page app's deep routes through the 404.html
 * bounce, so every URL except the home page first answers HTTP 404 (crawlers
 * and link previews stop there). This writes, after `vite build`,
 *
 *   dist/chapters/5.html  and  dist/chapters/5/index.html
 *
 * for every route, so both the plain and the trailing-slash URL answer 200,
 * the same way the Tongan site's scripts/prerender.mjs does. Each file is the
 * built index.html with the route's own <title>, description, canonical link,
 * Open Graph tags and structured data in the head, and an <article> of readable
 * text inside #root (scripts/lib/served-text.mjs). It only adds files; the
 * bundles Vite made are untouched. Also writes dist/sitemap.xml and dist/robots.txt.
 *
 * Everything this script injects sits between markers, so a second run without
 * a rebuild strips what the first wrote and writes it again: one canonical link,
 * one JSON-LD script and one article per page, however often it runs.
 *
 * Titles and descriptions come from src/seo/meta.js, the module the app reads.
 * SITE_ORIGIN (default https://learnsamoan.org) and VITE_BASE (the build's base
 * path) give the absolute URLs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  DEFAULT_DESCRIPTION, SITE_NAME, STATIC_META,
  chapterDescription, chapterTitle, drillDescription, drillTitle, quizDescription, quizTitle, withTail,
} from '../src/seo/meta.js'
import { BOOK_PAGES } from '../src/lib/book-pages.js'
import { DAILY_WORDS_ENTRY, DAILY_WORDS_ID, PRACTICE_KINDS, stripStars } from '../src/premium/lib/drills-catalog.js'
import { esc } from './lib/book-html.mjs'
import { createServed } from './lib/served-text.mjs'
import { createGraphs } from './lib/jsonld.mjs'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const HEAD_OPEN = '<!-- prerender:head -->'
const HEAD_CLOSE = '<!-- /prerender:head -->'
const ROOT_OPEN = '<!-- prerender:root -->'
const ROOT_CLOSE = '<!-- /prerender:root -->'

// Routes that exist only in a development or test build. Search engines are told to stay out.
const TEST_ONLY_PATHS = ['lab/', '__proto/', 'scrub']

const readJson = (...parts) => JSON.parse(fs.readFileSync(path.join(...parts), 'utf8'))

/** Strip what an earlier pass wrote, back to the shape Vite emitted. */
export function cleanTemplate(html) {
  return html
    .replace(new RegExp(`[ \\t]*${HEAD_OPEN}[\\s\\S]*?${HEAD_CLOSE}\\n?`, 'g'), '')
    .replace(new RegExp(`<div id="root">${ROOT_OPEN}[\\s\\S]*?${ROOT_CLOSE}</div>`, 'g'), '<div id="root"></div>')
    .replace(/\n\s*<meta property="og:[^"]+"[^>]*\/>/g, '')
    .replace(/\n\s*<meta name="twitter:[^"]+"[^>]*\/>/g, '')
}

/**
 * Build every route's HTML file into `dist`. Returns the route list (with each
 * route's title, description, kind and sitemap flag) so a test can read it.
 */
export function prerender({ app = APP, dist = path.join(app, 'dist'), origin = process.env.SITE_ORIGIN || 'https://learnsamoan.org', base = process.env.VITE_BASE || '/', quiet = false } = {}) {
  base = base.replace(/\/?$/, '/')
  origin = origin.replace(/\/$/, '')
  const site = `${origin}${base}`
  const socialImage = `${site}social/learn-samoan.png`

  const chapters = readJson(app, 'src', 'data', 'chapters.json')
  const quizzes = readJson(app, 'src', 'data', 'quizzes.json')
  const glossary = readJson(app, 'src', 'data', 'glossary.json')
  const vocabulary = readJson(app, 'src', 'data', 'book-vocabulary.json')
  const drillCatalog = readJson(app, 'src', 'premium', 'data', 'drills-catalog.json')
  const readBook = file => fs.readFileSync(path.join(app, 'book', file), 'utf8')

  const practiceItems = new Map()
  const interactivesDir = path.join(app, 'src', 'data', 'interactives')
  for (const file of fs.readdirSync(interactivesDir).filter(f => /^\d{2}\.json$/.test(f))) {
    for (const item of readJson(interactivesDir, file).items) {
      if (PRACTICE_KINDS.includes(item.kind)) practiceItems.set(item.id, item)
    }
  }

  const served = createServed({ base, chapters, quizzes, glossary, vocabulary, drillCatalog, practiceItems, readBook })
  const graphFor = createGraphs({ site, chapters })

  const routes = []
  const add = (route, rootHtml) => routes.push({ ...route, rootHtml })

  add({ path: '/', kind: 'home', ...STATIC_META['/'] }, served.home())
  add({ path: '/chapters', kind: 'chapters', ...STATIC_META['/chapters'] }, served.chapters())
  add({ path: '/drills', kind: 'page', ...STATIC_META['/drills'] }, served.drills())
  add({ path: '/quizzes', kind: 'page', ...STATIC_META['/quizzes'] }, served.quizzes())
  add({ path: '/cards', kind: 'page', ...STATIC_META['/cards'] }, served.cards())
  add({ path: '/glossary', kind: 'page', ...STATIC_META['/glossary'] }, served.glossary())
  add({ path: '/reference', kind: 'page', ...STATIC_META['/reference'] }, served.reference())
  for (const c of chapters) {
    const file = `Chapter-${String(c.chapter).padStart(2, '0')}.md`
    add({ path: `/chapters/${c.chapter}`, kind: 'chapter', chapter: c.chapter, type: 'article', title: chapterTitle(c.chapter, c.title), description: chapterDescription(c.intro) }, served.chapter(c, readBook(file)))
  }
  // One page per drill: the title and description come from the practice item itself.
  for (const id of drillCatalog.flatMap(g => g.drills)) {
    const item = practiceItems.get(id)
    if (id === DAILY_WORDS_ID) {
      add({ path: `/drill/${id}`, kind: 'drill', name: DAILY_WORDS_ENTRY.title, title: drillTitle(DAILY_WORDS_ENTRY.title), description: DAILY_WORDS_ENTRY.blurb }, served.drill(id))
    } else if (item) {
      add({ path: `/drill/${id}`, kind: 'drill', name: stripStars(item.title), title: drillTitle(item.title), description: drillDescription(item.intro) }, served.drill(id))
    } else throw new Error(`prerender: drill "${id}" has no practice item`)
  }
  for (const n of Object.keys(quizzes).map(Number).sort((a, b) => a - b)) {
    const c = chapters.find(x => x.chapter === n)
    add({ path: `/quizzes/${n}`, kind: 'quiz', chapter: n, title: quizTitle(n, c?.title), description: quizDescription(n, c?.title) }, served.quiz(n))
  }
  for (const [key, meta] of Object.entries(BOOK_PAGES)) {
    add({ path: `/${key}`, kind: 'page', ...STATIC_META[`/${key}`] }, served.book(`/${key}`, meta.file))
  }

  const rawTemplate = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  const template = cleanTemplate(rawTemplate)
  if (!/<title>[^<]*<\/title>/.test(template) || !/<meta name="description"[^>]*>/.test(template) || !template.includes('<div id="root"></div>')) {
    throw new Error('prerender: dist/index.html has no <title>, description or empty #root to fill')
  }

  const urlOf = route => (route === '/' ? site : `${site}${route.slice(1)}`)

  function page(route, { noindex = false, canonicalPath = route.path } = {}) {
    const canonical = urlOf(canonicalPath)
    const url = canonical
    const head = [
      ...(noindex ? ['<meta name="robots" content="noindex" />'] : []),
      `<link rel="canonical" href="${esc(canonical)}" />`,
      `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
      `<meta property="og:type" content="${route.type || 'website'}" />`,
      `<meta property="og:title" content="${esc(route.title)}" />`,
      `<meta property="og:description" content="${esc(route.description)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      `<meta property="og:image" content="${esc(socialImage)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="Learn Sāmoan, a free course in 52 chapters" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(route.title)}" />`,
      `<meta name="twitter:description" content="${esc(route.description)}" />`,
      `<meta name="twitter:image" content="${esc(socialImage)}" />`,
      ...(noindex ? [] : [`<script type="application/ld+json">${JSON.stringify(graphFor(route)).replaceAll('<', '\\u003c')}</script>`]),
    ].join('\n    ')
    let html = template
      .replace(/<title>[^<]*<\/title>/, () => `<title>${esc(route.title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${esc(route.description)}" />`)
      .replace('</head>', () => `    ${HEAD_OPEN}\n    ${head}\n    ${HEAD_CLOSE}\n  </head>`)
    if (route.rootHtml) html = html.replace('<div id="root"></div>', () => `<div id="root">${ROOT_OPEN}${route.rootHtml}${ROOT_CLOSE}</div>`)
    return html
  }

  // The old /lessons addresses: redirect shells so the host answers 200 (no 404
  // before the client redirect). They point at the chapter pages, are marked
  // noindex and are kept out of the sitemap.
  const legacy = [{ path: '/lessons', to: '/chapters' }, ...chapters.map(c => ({ path: `/lessons/${c.chapter}`, to: `/chapters/${c.chapter}` }))]
    .map(r => ({ path: r.path, to: r.to, title: withTail('Chapters'), description: DEFAULT_DESCRIPTION, noindex: true }))

  let written = 0
  const write = (route, html) => {
    if (route.path === '/') { fs.writeFileSync(path.join(dist, 'index.html'), html); written += 1; return }
    const rel = route.path.slice(1)
    const flat = path.join(dist, `${rel}.html`)
    const nested = path.join(dist, rel, 'index.html')
    fs.mkdirSync(path.dirname(flat), { recursive: true })
    fs.mkdirSync(path.dirname(nested), { recursive: true })
    fs.writeFileSync(flat, html)
    fs.writeFileSync(nested, html)
    written += 2
  }
  for (const route of routes) write(route, page(route))
  for (const route of legacy) write(route, page(route, { noindex: true, canonicalPath: route.to }))

  const today = new Date().toISOString().slice(0, 10)
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${esc(urlOf(r.path))}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
  const robots = `User-agent: *\nAllow: /\n${TEST_ONLY_PATHS.map(p => `Disallow: ${base}${p}`).join('\n')}\n\nSitemap: ${site}sitemap.xml\n`
  fs.writeFileSync(path.join(dist, 'robots.txt'), robots)
  if (!quiet) console.log(`prerender: ${routes.length} routes, ${written} files, sitemap.xml and robots.txt for ${site}`)
  return { routes: routes.map(({ rootHtml: _root, ...r }) => r), site, base }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { prerender() } catch (e) { console.error(e.message); process.exit(1) }
}
