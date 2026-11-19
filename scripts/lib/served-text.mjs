// The text a crawler reads inside <div id="root"> before any script runs.
// Build-Spec part (a): every sitemap route gets an <article> of readable text,
// written by scripts/prerender.mjs between markers. React replaces it on mount.
//
// No Sāmoan and no gloss is typed in this file: everything shown is read from
// src/data/*.json and book/*.md by the caller and passed in.
//   - A chapter is served as its heading, at most two opening paragraphs, its
//     section names and links. No quiz question and no exercise answer is served.
//   - The three book pages (Introduction, Pronunciation, Charts) are served whole.
//   - The dictionary hub links every word page; a word page serves its entries,
//     printed meanings, chapters and up to three printed sentences (Build-Spec part f).
//   - A topic page (src/seo/pages/) is served whole, from the same blocks the app
//     renders (Build-Spec part g). Its Sāmoan is typed there and held to the book
//     by test/topic-pages.test.js.
import { DAILY_WORDS_ENTRY, DAILY_WORDS_ID, drillChapter, stripStars } from '../../src/premium/lib/drills-catalog.js'
import { SITE_NAME, STATIC_META, DEFAULT_DESCRIPTION, headingFor } from '../../src/seo/meta.js'
import { englishPageLead } from '../../src/premium/lib/dictionary-pages.js'
import { tokenizeInline } from '../../src/seo/inline.js'
import { TOPIC_PAGES } from '../../src/seo/pages/index.js'
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
const H3_STYLE = 'font-size:1.1rem;line-height:1.3;margin:1.5rem 0 .5rem;font-weight:700'
const DT_STYLE = 'font-weight:700;margin:.5rem 0 0'
const P_STYLE = 'margin:0 0 1rem'
const LIST_STYLE = 'margin:0 0 1.25rem;padding-left:1.35rem'
const LINK_STYLE = 'color:var(--red,#1e449c);text-decoration:underline'
const NOTE_STYLE = 'margin:0 0 1rem;padding:.4rem 0 .4rem 1rem;border-left:3px solid var(--line-strong,#d3cdc4)'
const EX_STYLE = 'margin:0 0 1rem;padding-left:1rem;border-left:3px solid var(--line-strong,#d3cdc4)'
const TABLE_CSS = 'article table{border-collapse:collapse;margin:0 0 1.25rem}article th,article td{border:1px solid var(--line-strong,#d3cdc4);padding:.3rem .6rem;text-align:left}'

export function createServed({ base, chapters, quizzes, dictionary, vocabulary, drillCatalog, practiceItems, readBook }) {
  const href = route => (route === '/' ? base : `${base}${route.slice(1)}`)
  const link = (route, labelHtml) => `<a href="${esc(href(route))}" style="${LINK_STYLE}">${labelHtml}</a>`
  const textLink = (route, label) => link(route, esc(label))
  const wrap = inner => `<article style="${BLOCK_STYLE}"><style>${TABLE_CSS}</style>${inner}</article>`
  const p = html => `<p style="${P_STYLE}">${html}</p>`
  const h1 = html => `<h1 style="${H1_STYLE}">${html}</h1>`
  const h2 = html => `<h2 style="${H2_STYLE}">${html}</h2>`
  const ul = items => `<ul style="${LIST_STYLE}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`
  const sm = word => `<span lang="sm">${esc(word)}</span>`
  const smLink = (route, label) => `<a href="${esc(href(route))}" lang="sm" style="${LINK_STYLE}">${esc(label)}</a>`
  const h3 = html => `<h3 style="${H3_STYLE}">${html}</h3>`
  const crumbs = (...trail) => p([textLink('/', SITE_NAME), ...trail].join(' &middot; '))
  const chapterRow = c => `${link(`/chapters/${c.chapter}`, `Chapter ${c.chapter}: ${inlineMarkdownToHtml(c.title)}`)}`
  const byChapter = n => chapters.find(c => c.chapter === n)
  // A string of a topic page (src/seo/inline.js): `*…*` is Sāmoan, `**…**` bold.
  const inl = text => tokenizeInline(text).map(tok => (
    tok.t === 'strong' ? `<strong>${esc(tok.v)}</strong>` : tok.t === 'em' ? `<em lang="sm">${esc(tok.v)}</em>` : esc(tok.v)
  )).join('')

  return {
    home() {
      const hubs = ['/chapters', '/quizzes', '/drills', '/cards', '/dictionary', '/reference']
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
        ul([
          ...['/introduction', '/pronunciation', '/charts', '/dictionary'].map(r => textLink(r, headingFor(r))),
          ...TOPIC_PAGES.map(doc => link(doc.path, inl(doc.h1))),
        ]),
      )
    },

    // The Introduction and the two appendices, whole.
    book(route, file) {
      return wrap(crumbs() + h1(esc(headingFor(route))) + markdownToHtml(readBook(file)))
    },

    // /greetings and /alphabet: one of the documents in src/seo/pages/, block for
    // block as src/premium/components/ArticlePage.jsx renders it. `*…*` is Sāmoan.
    topic(doc) {
      const blockHtml = block => {
        switch (block.k) {
          case 'h2': return h2(inl(block.text))
          case 'h3': return h3(inl(block.text))
          case 'p': return p(inl(block.text))
          case 'note': return `<blockquote style="${NOTE_STYLE}">${inl(block.text)}</blockquote>`
          case 'ex': return `<div style="${EX_STYLE}">${block.items.map(item => p(`<em lang="sm">${esc(item.sm)}</em><br>${esc(item.en)}`)).join('')}</div>`
          case 'table': return `<table><thead><tr>${block.headers.map(c => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row => `<tr>${row.map(c => `<td>${inl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
          case 'next': return ul(block.items.map(item => link(item.to, inl(item.label))))
          default: throw new Error(`served-text: no renderer for topic block "${block.k}"`)
        }
      }
      return wrap(
        crumbs(textLink('/reference', 'Reference')) +
        (doc.eyebrow ? p(esc(doc.eyebrow)) : '') +
        h1(inl(doc.h1)) +
        (doc.chips?.length ? p(doc.chips.map(inl).join(' &middot; ')) : '') +
        doc.blocks.map(blockHtml).join(''),
      )
    },

    // /dictionary: the hub's opening words, then a link to every word page under
    // the glossary's own letters (a page with entries under two letters stands
    // under both).
    dictionaryHub() {
      const groups = new Map(dictionary.letters.map(l => [l, []]))
      for (const page of dictionary.pages) {
        const shown = new Map()
        for (const entry of page.entries) shown.set(entry.letter, [...(shown.get(entry.letter) || []), entry.display])
        for (const [letter, words] of shown) groups.get(letter).push(smLink(page.path, [...new Set(words)].join(', ')))
      }
      return wrap(
        crumbs() +
        h1(esc(headingFor('/dictionary').split(':')[0])) +
        p(esc(STATIC_META['/dictionary'].description)) +
        p('The dictionary holds the words the course teaches, in the order of the book\u2019s Glossary.') +
        [...groups].filter(([, links]) => links.length).map(([letter, links]) => (
          h2(letter.length === 1 ? sm(letter) : esc(letter)) + p(links.join(' &middot; '))
        )).join(''),
      )
    },

    dictionaryWord(page) {
      const several = page.entries.length > 1
      const lead = several
        ? (page.typed
          ? `${page.entries.length} entries are typed ${sm(page.typed)}. Each is shown with its own marks, meaning and chapter.`
          : `${page.entries.length} entries share this page. Each is shown with its own marks, meaning and chapter.`)
        : inlineMarkdownToHtml(page.entries[0].english)
      const entryHtml = entry => {
        const facts = []
        const add = (term, html) => facts.push(`<dt style="${DT_STYLE}">${term}</dt><dd style="margin:0">${html}</dd>`)
        if (entry.chapters.length) add('Taught in', entry.chapters.map(c => link(c.href, `Chapter ${c.number}${c.title ? `: ${inlineMarkdownToHtml(c.title)}` : ''}`)).join(', '))
        if (entry.listName) add('Word list', esc(entry.listName))
        if (entry.alsoTyped) add('Also typed', sm(entry.alsoTyped))
        if (entry.englishPages.length) add('English to Sāmoan', entry.englishPages.map(e => link(e.path, esc(e.headword))).join(', '))
        const examples = entry.examples.length
          ? h3('From the book') +
            `<ul style="${LIST_STYLE}">${entry.examples.map(pair => {
              const [start, end] = pair.at
              const d = pair.display
              return `<li><span lang="sm">${esc(d.slice(0, start))}<b>${esc(d.slice(start, end))}</b>${esc(d.slice(end))}</span><br>${esc(pair.englishDisplay)} ${textLink(`/chapters/${pair.chapter}`, `Chapter ${pair.chapter}`)}</li>`
            }).join('')}</ul>` +
            p('Printed in the chapters, as the book has them.')
          : ''
        return (several ? h2(sm(entry.display)) + p(inlineMarkdownToHtml(entry.english)) : '') +
          `<dl style="margin:0 0 1rem">${facts.join('')}</dl>` + examples
      }
      const related = page.sameChapter.map(g => (
        p('Taught in the same chapter') + h2(`Chapter ${g.chapter.number}`) +
        p(g.words.map(w => smLink(w.path, w.display)).join(' &middot; ')) +
        p(textLink(g.chapter.href, `Open Chapter ${g.chapter.number}`))
      )).join('')
      const nav = [
        page.previous ? `Before: ${smLink(page.previous.path, page.previous.display)}` : '',
        textLink('/dictionary', 'Search the dictionary'),
        page.next ? `After: ${smLink(page.next.path, page.next.display)}` : '',
      ].filter(Boolean).join(' &middot; ')
      return wrap(
        crumbs(textLink('/dictionary', 'Dictionary')) +
        h1(page.words.map(sm).join(' &middot; ')) +
        p(lead) +
        page.entries.map(entryHtml).join('') +
        related +
        p(nav),
      )
    },

    dictionaryEnglish(page, before, after) {
      const items = page.entries.map(entry => (
        `<li>${smLink(entry.path, entry.display)}: ${inlineMarkdownToHtml(entry.english)}${entry.chapters.length ? ` ${entry.chapters.map(c => textLink(c.href, `Chapter ${c.number}`)).join(', ')}` : ''}</li>`
      )).join('')
      const nav = [
        before ? `Before: ${textLink(before.path, before.headword)}` : '',
        textLink('/dictionary', 'Search the dictionary'),
        after ? `After: ${textLink(after.path, after.headword)}` : '',
      ].filter(Boolean).join(' &middot; ')
      return wrap(
        crumbs(textLink('/dictionary', 'Dictionary')) +
        h1(`How to say ${esc(page.headword)} in Sāmoan`) +
        p(esc(englishPageLead(page))) +
        `<ul style="${LIST_STYLE}">${items}</ul>` +
        p('Open a word for its own page: the chapter that teaches it and sentences from the book.') +
        p(nav),
      )
    },
  }
}
