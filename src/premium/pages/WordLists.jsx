import { Link } from 'react-router-dom'
import vocabulary from '@app/data/book-vocabulary.json'
import { STATIC_META } from '@app/seo/meta.js'
import wordListData from '../data/word-lists.json'
import { EntryRow } from '../components/DictionaryBits.jsx'
import { COPY, WORD_LISTS_PATH, buildWordLists, countWords } from '../lib/word-lists.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /word-lists: words the course teaches, one section per theme. The data file
// names vocabulary rows by id and types no word: every word and every meaning
// shown is its row of book-vocabulary.json, drawn with the dictionary's own row,
// which links the word to its dictionary page and the chapter to /chapters/N.
// The English is in ../lib/word-lists.js, which the prerender reads too.
const THEMES = buildWordLists(wordListData, vocabulary)
const TOTAL = countWords(THEMES)

export default function WordLists() {
  useTitle(STATIC_META[WORD_LISTS_PATH].title)

  return (
    <div className="catalog-page dictionary-catalog word-lists-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">{COPY.eyebrow}</p>
          <h1 className="display">{COPY.h1[0]}<br />{COPY.h1[1]}</h1>
          <p>{COPY.lead}</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <nav className="word-list-index" aria-label={COPY.indexLabel}>
          <p className="catalog-count">{COPY.count(THEMES.length, TOTAL)}</p>
          <ul>
            {THEMES.map(theme => <li key={theme.id}><a href={`#${theme.id}`}>{theme.label}</a></li>)}
          </ul>
        </nav>
        {THEMES.map(theme => (
          <section key={theme.id} id={theme.id} className="catalog-group word-list-group" aria-labelledby={`${theme.id}-title`}>
            <header>
              <div>
                <p className="catalog-kicker">{COPY.themeCount(theme.rows.length)}</p>
                <h2 id={`${theme.id}-title`}>{theme.label}</h2>
                {theme.note && <p>{theme.note}</p>}
              </div>
            </header>
            <ul className="dictionary-list">
              {theme.rows.map(row => <EntryRow key={row.id} entry={row} />)}
            </ul>
          </section>
        ))}
        <div className="word-list-notes">
          <p className="dictionary-pointer">{COPY.closing} <Link to="/dictionary">{COPY.dictionaryLink}</Link>.</p>
          <p className="dictionary-pointer">{COPY.greetingsLead} <Link to="/greetings">{COPY.greetingsLink}</Link>.</p>
        </div>
      </div>
    </div>
  )
}
