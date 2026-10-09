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
 * built index.html with the route's own <title>, description, canonical link
 * and Open Graph tags. It only adds files; the bundles Vite made are untouched.
 * Also writes dist/sitemap.xml and dist/robots.txt.
 *
 * SITE_ORIGIN (default https://joakimandrew-cloud.github.io) and VITE_BASE
 * (the build's base path) give the absolute URLs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { COURSE, DEFAULT_DESCRIPTION, HOME_TITLE, HUBS } from '../src/lib/site-meta.js'
import { BOOK_PAGES } from '../src/lib/book-pages.js'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(APP, 'dist')
const base = (process.env.VITE_BASE || '/').replace(/\/?$/, '/')
const origin = (process.env.SITE_ORIGIN || 'https://joakimandrew-cloud.github.io').replace(/\/$/, '')
const site = `${origin}${base}`
const socialImage = `${site}social/learn-samoan.png`

const chapters = JSON.parse(fs.readFileSync(path.join(APP, 'src', 'data', 'chapters.json'), 'utf8'))
const quizzes = JSON.parse(fs.readFileSync(path.join(APP, 'src', 'data', 'quizzes.json'), 'utf8'))

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const plain = s => String(s ?? '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim()
function clip(text, max = 158) {
  const t = plain(text)
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`
}

const routes = [{ path: '/', title: HOME_TITLE, description: DEFAULT_DESCRIPTION }]
for (const [route, meta] of Object.entries(HUBS)) routes.push({ path: route, title: `${meta.title} · ${COURSE}`, description: meta.description })
for (const c of chapters) {
  routes.push({ path: `/chapters/${c.chapter}`, title: `Chapter ${c.chapter}: ${plain(c.title)} · ${COURSE}`, description: clip(c.intro) || DEFAULT_DESCRIPTION, type: 'article' })
}
for (const n of Object.keys(quizzes).map(Number).sort((a, b) => a - b)) {
  const c = chapters.find(x => x.chapter === n)
  routes.push({ path: `/quizzes/${n}`, title: `Chapter ${n} quiz · ${COURSE}`, description: `Ten questions on Chapter ${n} of the Samoan course${c ? `, ${plain(c.title)}` : ''}, with every answer explained.` })
}
for (const [key, meta] of Object.entries(BOOK_PAGES)) {
  routes.push({ path: `/${key}`, title: `${meta.title} · ${COURSE}`, description: meta.kicker === 'Appendix' ? `${meta.title}, an appendix of the free Samoan course.` : `${meta.title}: the Introduction to the free Samoan course, read before Chapter 1.` })
}

const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (!/<title>[^<]*<\/title>/.test(template) || !/<meta name="description"[^>]*>/.test(template)) {
  console.error('prerender: dist/index.html has no <title> or description to replace')
  process.exit(1)
}

function page(route) {
  const url = route.path === '/' ? site : `${site}${route.path.slice(1)}`
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${esc(COURSE)}" />`,
    `<meta property="og:type" content="${route.type || 'website'}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(socialImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Learn Samoan, a free course in 51 chapters" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${esc(socialImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(route.type === 'article' ? {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: route.title,
      description: route.description,
      url,
      inLanguage: 'en',
      isAccessibleForFree: true,
    } : {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: COURSE,
      description: DEFAULT_DESCRIPTION,
      url: site,
      inLanguage: 'en',
      isAccessibleForFree: true,
      teaches: 'Samoan language',
    }).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n    ')
  const cleanTemplate = template
    .replace(/\n\s*<meta property="og:[^"]+"[^>]*\/>/g, '')
    .replace(/\n\s*<meta name="twitter:[^"]+"[^>]*\/>/g, '')
  return cleanTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(route.description)}" />\n    ${head}`)
}

let written = 0
for (const route of routes) {
  const html = page(route)
  if (route.path === '/') { fs.writeFileSync(path.join(DIST, 'index.html'), html); written += 1; continue }
  const rel = route.path.slice(1)
  const flat = path.join(DIST, `${rel}.html`)
  const nested = path.join(DIST, rel, 'index.html')
  fs.mkdirSync(path.dirname(flat), { recursive: true })
  fs.mkdirSync(path.dirname(nested), { recursive: true })
  fs.writeFileSync(flat, html)
  fs.writeFileSync(nested, html)
  written += 2
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${esc(r.path === '/' ? site : `${site}${r.path.slice(1)}`)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`)
console.log(`prerender: ${routes.length} routes, ${written} files, sitemap.xml and robots.txt for ${site}`)
