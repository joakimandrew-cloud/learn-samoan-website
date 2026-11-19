// The text a crawler reads inside <div id="root"> before any script runs.
// Build-Spec part (a): every sitemap route gets an <article> of readable text,
// written by scripts/prerender.mjs between markers. React replaces it on mount.
//
// No Sāmoan and no gloss is typed in this file: everything shown is read from
// src/data/*.json and book/*.md by the caller and passed in.
//   - A chapter is served as its heading, at most two opening paragraphs, its
//     section names and links. No quiz question and no exercise answer is served.
//   - The three book pages (Introduction, Pronunciation, Charts) are served whole.
import { DAILY_WORDS_ENTRY, DAILY_WORDS_ID, drillChapter, stripStars } from '../../src/premium/lib/drills-catalog.js'
import { SITE_NAME, STATIC_META, DEFAULT_DESCRIPTION, headingFor, plain } from '../../src/seo/meta.js'
import { esc, inlineMarkdownToHtml, introParagraphs, markdownToHtml } from './book-html.mjs'

// The article sits outside the app's own stylesheet scope for the moment before
// the app mounts, so it carries a little style of its own, written in the site's
// tokens (src/premium/styles/base.css) with plain fallbacks.
const BLOCK_STYLE =
  'max-width:44rem;margin:0 auto;padding:3rem 1.25rem;' +
  'color:var(--ink,#121212);background:var(--paper,#fff);' +
  "font-family:var(--f-serif,'Source Serif 4',Georgia,serif);line-height:1.65;font-size:1.05rem"
const H1_STYLE = 'font-size:2rem;line-height:1.2;margin:0 0 1.25rem;font-weight:700'
const H2_STYLE = 'font-size:1.35rem;line-height:1.25;margin:2rem 0 .6rem;font-weight:700'
const P_STYLE = 'margin:0 0 1rem'
const LIST_STYLE = 'margin:0 0 1.25rem;padding-left:1.35rem'
const LINK_STYLE = 'color:var(--red,#1e449c);text-decoration:underline'
const TABLE_CSS = 'article table{border-collapse:collapse;margin:0 0 1.25rem}article th,article td{border:1px solid var(--line-strong,#d3cdc4);padding:.3rem .6rem;text-align:left}'

export function createServed({ base, chapters, quizzes, glossary, vocabulary, drillCatalog, practiceItems, readBook }) {
  const href = route => (route === '/' ? base : `${base}${route.slice(1)}`)
  const link = (route, labelHtml) => `<a href="${esc(href(route))}" style="${LINK_STYLE}">${labelHtml}</a>`
  const textLink = (route, label) => link(route, esc(label))
  const wrap = inner => `<article style="${BLOCK_STYLE}"><style>${TABLE_CSS}</style>${inner}</article>`
  const p = html => `<p style="${P_STYLE}">${html}</p>`
  const h1 = html => `<h1 style="${H1_STYLE}">${html}</h1>`
  const h2 = html => `<h2 style="${H2_STYLE}">${html}</h2>`
  const ul = items => `<ul style="${LIST_STYLE}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
  const sm = word => `<span lang="sm">${esc(word)}</span>`
  const crumbs = (...trail) => p([textLink('/', SITE_NAME), ...trail].join(' &middot; '))
  const chapterRow = c => `${link(`/chapters/${c.chapter}`, `Chapter ${c.chapter}: ${inlineMarkdownToHtml(c.title)}`)}`
  const byChapter = n => chapters.find(c => c.chapter === n)

  return {
    home() {
      const hubs = ['/chapters', '/quizzes', '/drills', '/cards', '/glossary', '/reference']
      return wrap(
        h1(esc(SITE_NAME)) +
        p(esc(DEFAULT_DESCRIPTION)) +
        ul(hubs.map(r => `${textLink(r, headingFor(r))}`)),
      )
    },

    chapters() {
      return wrap(
        crumbs() +
        h1(esc(headingFor('/chapters'))) +
        p(esc(STATIC_META['/chapters'].description)) +
        ul(chapters.map(chapterRow)),
      )
    },

    chapter(c, md) {
      const n = c.chapter
      const prev = byChapter(n - 1)
      const next = byChapter(n + 1)
      const nav = [
        prev ? textLink(`/chapters/${prev.chapter}`, `Chapter ${prev.chapter}`) : '',
        textLink('/chapters', `All ${chapters.length} chapters`),
        next ? textLink(`/chapters/${next.chapter}`, `Chapter ${next.chapter}`) : '',
      ].filter(Boolean).join(' &middot; ')
      return wrap(
        crumbs(textLink('/chapters', 'Chapters')) +
        h1(`Chapter ${n}: ${inlineMarkdownToHtml(c.title)}`) +
        introParagraphs(md, 2).map(t => p(inlineMarkdownToHtml(t))).join('') +
        (c.sections?.length ? h2('In this chapter') + ul(c.sections.map(s => inlineMarkdownToHtml(s))) : '') +
        (quizzes[String(n)] ? p(textLink(`/quizzes/${n}`, `Take the Chapter ${n} quiz`)) : '') +
        p(nav),
      )
    },

    quizzes() {
      return wrap(
        crumbs() +
        h1(esc(headingFor('/quizzes'))) +
        p(esc(STATIC_META['/quizzes'].description)) +
        ul(Object.keys(quizzes).map(Number).sort((a, b) => a - b).map(n => {
          const c = byChapter(n)
          return link(`/quizzes/${n}`, `Chapter ${n} Quiz${c ? `: ${inlineMarkdownToHtml(c.title)}` : ''}`)
        })),
      )
    },

    quiz(n) {
      const c = byChapter(n)
      const count = quizzes[String(n)].questions.length
      return wrap(
        crumbs(textLink('/quizzes', 'Quizzes')) +
        h1(`Chapter ${n} Quiz${c ? `: ${inlineMarkdownToHtml(c.title)}` : ''}`) +
        p(`${count} questions on Chapter ${n}${c ? `, ${inlineMarkdownToHtml(c.title)}` : ''}, with every answer explained.`) +
        p(textLink(`/chapters/${n}`, `Read Chapter ${n}`)),
      )
    },

    drills() {
      const groups = drillCatalog.map(g => (
        h2(esc(g.name)) +
        (g.note ? p(esc(g.note)) : '') +
        ul(g.drills.map(id => {
          const title = id === DAILY_WORDS_ID ? DAILY_WORDS_ENTRY.title : stripStars(practiceItems.get(id)?.title)
          return textLink(`/drill/${id}`, title)
        }))
      )).join('')
      return wrap(
        crumbs() +
        h1(esc(headingFor('/drills'))) +
        p(esc(STATIC_META['/drills'].description)) +
        groups,
      )
    },

    drill(id) {
      if (id === DAILY_WORDS_ID) {
        return wrap(
          crumbs(textLink('/drills', 'Drills')) +
          h1(esc(DAILY_WORDS_ENTRY.title)) +
          p(esc(DAILY_WORDS_ENTRY.blurb)) +
          p(textLink('/cards', 'Flip the same words as cards')),
        )
      }
      const item = practiceItems.get(id)
      const n = drillChapter(id)
      const c = n == null ? null : byChapter(n)
      return wrap(
        crumbs(textLink('/drills', 'Drills')) +
        h1(esc(stripStars(item.title))) +
        (item.intro ? p(inlineMarkdownToHtml(item.intro)) : '') +
        (c ? p(`From ${link(`/chapters/${c.chapter}`, `Chapter ${c.chapter}: ${inlineMarkdownToHtml(c.title)}`)}`) : ''),
      )
    },

    cards() {
      const lists = [...new Set(vocabulary.map(r => r.listName))]
      const names = lists.length > 1 ? `${lists.slice(0, -1).join(', ')} and ${lists.at(-1)}` : lists.join('')
      return wrap(
        crumbs() +
        h1(esc(headingFor('/cards'))) +
        p(esc(STATIC_META['/cards'].description)) +
        p(`${vocabulary.length} cards from ${lists.length} lists of the course: ${esc(names)}.`),
      )
    },

    reference() {
      return wrap(
        crumbs() +
        h1(esc(headingFor('/reference'))) +
        p(esc(STATIC_META['/reference'].description)) +
        ul(['/introduction', '/pronunciation', '/charts', '/glossary'].map(r => textLink(r, headingFor(r)))),
      )
    },

    // The Introduction and the two appendices, whole.
    book(route, file) {
      return wrap(crumbs() + h1(esc(headingFor(route))) + markdownToHtml(readBook(file)))
    },

    // Until the dictionary replaces it: every headword with its meaning and chapter.
    glossary() {
      const groups = []
      for (const row of glossary) {
        if (groups.at(-1)?.letter !== row.letter) groups.push({ letter: row.letter, rows: [] })
        groups.at(-1).rows.push(row)
      }
      return wrap(
        crumbs() +
        h1(esc(headingFor('/glossary'))) +
        p(esc(STATIC_META['/glossary'].description)) +
        groups.map(g => (
          h2(esc(g.letter)) +
          `<dl style="margin:0 0 1rem">${g.rows.map(r => `<dt style="font-weight:700;margin:.5rem 0 0">${sm(r.samoan)}</dt><dd style="margin:0">${esc(plain(r.english))} (Chapter ${esc(r.chapter)})</dd>`).join('')}</dl>`
        )).join(''),
      )
    },
  }
}
