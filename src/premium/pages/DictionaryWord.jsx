import { Link, useParams } from 'react-router-dom'
import { dictionaryPageMeta, STATIC_META } from '@app/seo/meta.js'
import { Md } from '../components/lesson/Blocks.jsx'
import T from '../components/T.jsx'
import { ChapterLinks, DictionaryMissing, Neighbours, WordLinks } from '../components/DictionaryBits.jsx'
import { DICTIONARY } from '../lib/dictionary-data.js'
import { usePageMeta } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary/<slug>: one page per folded spelling. Words that are typed the
// same share the page, each shown separately with its own marks, meaning and
// chapter. Every Sāmoan string and every meaning is the course data's own; the
// sentences are lines printed in the chapters, with the English printed beside
// them, and nothing is written for this page.

// The printed sentence with the entry's word picked out.
function Sentence({ pair }) {
  const [start, end] = pair.at
  return (
    <T className="dictionary-pair-to">
      {pair.display.slice(0, start)}<b>{pair.display.slice(start, end)}</b>{pair.display.slice(end)}
    </T>
  )
}

function Entry({ entry, heading }) {
  return (
    <article className="dictionary-word-entry" aria-label={heading ? undefined : entry.display}>
      {heading && <T as="h2" className="dictionary-word-heading">{entry.display}</T>}
      {heading && <p className="dictionary-word-meaning"><Md text={entry.english} /></p>}
      <dl className="dictionary-facts">
        {entry.chapters.length > 0 && <div><dt>Taught in</dt><dd><ChapterLinks entry={entry} /></dd></div>}
        {entry.listName && <div><dt>Word list</dt><dd>{entry.listName}</dd></div>}
        {entry.alsoTyped && <div><dt>Also typed</dt><dd><T>{entry.alsoTyped}</T></dd></div>}
        {entry.englishPages.length > 0 && (
          <div><dt>English to Sāmoan</dt><dd>{entry.englishPages.map((page, index) => <span key={page.path}>{index > 0 && ', '}<Link to={page.path}>{page.headword}</Link></span>)}</dd></div>
        )}
      </dl>
      {entry.examples.length > 0 && (
        <section className="dictionary-examples" aria-label="Sentences from the book">
          <h3 className="catalog-kicker">From the book</h3>
          <ul>
            {entry.examples.map(pair => (
              <li key={`${pair.chapter}-${pair.line}`} className="dictionary-pair">
                <Sentence pair={pair} />
                <span className="dictionary-pair-en">{pair.englishDisplay}</span>
                <Link className="dictionary-pair-from" to={`/chapters/${pair.chapter}`}>Chapter {pair.chapter}</Link>
              </li>
            ))}
          </ul>
          <p className="dictionary-examples-note">Printed in the chapters, as the book has them.</p>
        </section>
      )}
    </article>
  )
}

const MISSING_META = { title: 'Not in the dictionary · Sāmoan Dictionary', description: STATIC_META['/dictionary'].description }

export default function DictionaryWord() {
  const { slug } = useParams()
  const page = DICTIONARY.pageBySlug.get(slug)
  usePageMeta(page ? dictionaryPageMeta(page) : MISSING_META)
  if (!page) return <DictionaryMissing typed={slug} />
  const several = page.entries.length > 1

  return (
    <div className="catalog-page dictionary-catalog dictionary-word-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow"><Link to="/dictionary">Dictionary</Link><span aria-hidden="true">·</span><span>Sāmoan word</span></p>
          <h1 className="display dictionary-word-title">
            {page.words.map((word, index) => (
              <span key={word}>{index > 0 && <span className="dictionary-word-sep" aria-hidden="true"> · </span>}<T>{word}</T></span>
            ))}
          </h1>
          {several
            ? (page.typed
              ? <p>{page.entries.length} entries are typed <T>{page.typed}</T>. Each is shown with its own marks, meaning and chapter.</p>
              : <p>{page.entries.length} entries share this page. Each is shown with its own marks, meaning and chapter.</p>)
            : <p className="dictionary-word-lead"><Md text={page.entries[0].english} /></p>}
        </div>
      </header>
      <div className="wrap catalog-body">
        {page.entries.map(entry => <Entry key={entry.id} entry={entry} heading={several} />)}
        {page.sameChapter.map(group => (
          <section key={group.chapter.number} className="catalog-group dictionary-related" aria-labelledby={`same-chapter-${group.chapter.number}`}>
            <header>
              <div>
                <p className="catalog-kicker">Taught in the same chapter</p>
                <h2 id={`same-chapter-${group.chapter.number}`}>Chapter {group.chapter.number}</h2>
                <p>The other words this chapter teaches. <Link to={group.chapter.href}>Open Chapter {group.chapter.number}</Link></p>
              </div>
            </header>
            <WordLinks words={group.words} label={`Other words of Chapter ${group.chapter.number}`} />
          </section>
        ))}
        <Neighbours previous={page.previous} next={page.next} />
      </div>
    </div>
  )
}
