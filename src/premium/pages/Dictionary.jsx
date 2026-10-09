import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import glossary from '@app/data/glossary.json'
import { browseDictionary, buildDictionary, dictionaryGroups, searchDictionary } from '../lib/course-dictionary.js'
import { useTitle } from '../lib/title.js'
import { Md } from '../components/lesson/Blocks.jsx'
import T from '../components/T.jsx'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /glossary: every headword taught in the Words to Learn tables, from the
// book's Glossary appendix, with the chapter that first teaches it.
const ENTRIES = buildDictionary(glossary)
const GROUPS = dictionaryGroups(ENTRIES)

export default function Dictionary() {
  useTitle('Glossary')
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('')
  const deferredQuery = useDeferredValue(query)
  const results = useMemo(() => letter ? browseDictionary(ENTRIES, letter) : searchDictionary(ENTRIES, deferredQuery), [deferredQuery, letter])
  const searching = !letter && deferredQuery.trim().length > 0
  const chooseLetter = next => { setLetter(next); setQuery('') }

  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Glossary · Every word the course teaches</p>
          <h1 className="display">Look up<br />a word.</h1>
          <p>Search in Samoan or English, or browse by letter. Each word shows its meaning and the chapter that first teaches it. Diacritics are folded and interfiled, as in the book’s glossary.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search the glossary</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={event => { setQuery(event.target.value); setLetter('') }}
              placeholder="Samoan or English word"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
        </div>
        <div className="dictionary-browse">
          <p id="dictionary-alphabet-label">Browse by letter</p>
          <div className="dictionary-alphabet" role="group" aria-labelledby="dictionary-alphabet-label">
            <button type="button" aria-pressed={!letter} aria-controls="dictionary-results" onClick={() => chooseLetter('')}>All</button>
            {GROUPS.map(initial => (
              <button key={initial} type="button" lang={initial.length === 1 ? 'sm' : undefined} aria-pressed={letter === initial} aria-controls="dictionary-results" onClick={() => chooseLetter(initial)}>{initial}</button>
            ))}
          </div>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">
          {letter
            ? `${results.length} ${results.length === 1 ? 'entry' : 'entries'} under ${letter}`
            : searching
            ? `${results.length} ${results.length === 1 ? 'entry matches' : 'entries match'}`
            : `${results.length} entries`}
        </p>
        <div id="dictionary-results">
        {results.length === 0 ? (
          <div className="catalog-empty">
            <h2>No words match.</h2>
            <p>Try another spelling, or search in English.</p>
            <button type="button" className="btn btn-primary" onClick={() => { chooseLetter(''); requestAnimationFrame(() => searchRef.current?.focus()) }}>Clear search</button>
          </div>
        ) : (
          <ul className="dictionary-list">
            {results.map(entry => (
              <li key={entry.id} className="dictionary-entry">
                <T className="dictionary-samoan">{entry.samoan}</T>
                <span className="dictionary-english"><Md text={entry.english} /></span>
                <span className="dictionary-meta">
                  {entry.lesson && <Link className="dictionary-lesson" to={`/chapters/${entry.lesson}`}>Chapter {entry.lesson}</Link>}
                </span>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </div>
  )
}
