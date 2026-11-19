import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GOATCOUNTER_CODE, STATIC_META } from '@app/seo/meta.js'
import { EntryRow } from '../components/DictionaryBits.jsx'
import { browseDictionary, searchDictionaryDetailed } from '../lib/course-dictionary.js'
import { readSearchAddress, searchAddressHash } from '../lib/dictionary-address.js'
import { DICTIONARY, ENTRIES, LETTERS } from '../lib/dictionary-data.js'
import { FAILED_SEARCH_NOTICE, FAILED_SEARCH_SETTLE_MS, countFailedSearch } from '../lib/dictionary-failed-search.js'
import { englishSlug, normaliseSense } from '../lib/dictionary-text.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary: the words the course teaches, searchable in Sāmoan or English,
// with the glossary's own letter groups. Every result opens its own word page,
// and the search lives in the address so it can be linked and Back returns to
// it. It lives in the fragment (#q=, #letter=) and never in the query string:
// the visit counter sends the query string with every count, and a fragment
// is sent nowhere. See ../lib/dictionary-address.js.
//
// A search that has settled and found nothing at all is counted once, through
// ../lib/dictionary-failed-search.js, when the page has a counter.
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const quoted = (words, joiner) => words.map(word => `“${word}”`).join(` ${joiner} `)

export default function Dictionary() {
  useTitle(STATIC_META['/dictionary'].title)
  const searchRef = useRef(null)
  const location = useLocation()
  const address = readSearchAddress(location.hash, LETTERS)
  const [query, setQuery] = useState(address.q)
  const [letter, setLetter] = useState(address.letter)
  // The router's location changes only when something navigates: Back,
  // Forward, a link, a fragment pasted or edited in the address bar. Then the
  // page follows the address. Its own writes below go straight to the history
  // entry and never pass through the router, so they cannot feed back into the
  // box while someone is typing.
  const arrival = `${location.key} ${location.hash}`
  const [followed, setFollowed] = useState(arrival)
  if (followed !== arrival) {
    setFollowed(arrival)
    setQuery(address.q)
    setLetter(address.letter)
  }

  // Shows a search or a letter and writes it into the fragment of the current
  // history entry. The path is written without any query string, so nothing
  // typed here is ever in location.search.
  const show = (nextQuery, nextLetter) => {
    setQuery(nextQuery)
    setLetter(nextLetter)
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${searchAddressHash(nextQuery, nextLetter)}`)
  }

  const deferredQuery = useDeferredValue(query)
  const typed = deferredQuery.trim()
  const searching = !letter && typed.length > 0
  const found = useMemo(() => searchDictionaryDetailed(ENTRIES, typed), [typed])
  const browsed = useMemo(() => letter ? browseDictionary(ENTRIES, letter) : ENTRIES, [letter])
  const matches = searching ? found.matches : browsed
  const partial = searching ? found.partial : []
  const suggestions = searching ? found.suggestions : []
  const fallback = searching ? found.fallback : null
  // Longer entries that hold every word typed: offered first under their own
  // heading, never as a match.
  const containing = searching ? found.containing : []
  const containingWords = searching ? found.containingWords : []
  const nothing = matches.length === 0 && partial.length === 0 && containing.length === 0
  const englishPage = searching && matches.length > 0 ? DICTIONARY.englishBySlug.get(englishSlug(normaliseSense(typed))) : null
  const clear = () => { show('', ''); requestAnimationFrame(() => searchRef.current?.focus()) }

  // A search has settled when the box has been still for a second and a half,
  // when it loses focus, or on Enter. The text in the box is searched afresh
  // here, so a count never rests on a result that is a keystroke behind.
  const settle = text => {
    if (!letter && text.trim()) countFailedSearch(text, searchDictionaryDetailed(ENTRIES, text.trim()))
  }
  useEffect(() => {
    if (letter || !query.trim()) return undefined
    const timer = window.setTimeout(() => countFailedSearch(query, searchDictionaryDetailed(ENTRIES, query.trim())), FAILED_SEARCH_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [query, letter])

  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Dictionary · The words the course teaches</p>
          <h1 className="display">Sāmoan<br />dictionary</h1>
          <p>The words the course teaches. Search in Sāmoan or English, or browse by letter. You can type a word without its macrons or the ʻ. Each word opens its own page, with its meaning and the chapter that teaches it.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search the dictionary</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={event => show(event.target.value, '')}
              onBlur={() => settle(query)}
              onKeyDown={event => { if (event.key === 'Enter') settle(query) }}
              placeholder="Sāmoan or English word"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              aria-describedby={GOATCOUNTER_CODE ? 'dictionary-search-note' : undefined}
            />
          </label>
        </div>
        {GOATCOUNTER_CODE && <p id="dictionary-search-note" className="dictionary-search-note">{FAILED_SEARCH_NOTICE}</p>}
        <div className="dictionary-browse">
          <p id="dictionary-alphabet-label">Browse by letter</p>
          <div className="dictionary-alphabet" role="group" aria-labelledby="dictionary-alphabet-label">
            <button type="button" aria-pressed={!letter} aria-controls="dictionary-results" onClick={() => show('', '')}>All</button>
            {LETTERS.map(initial => (
              <button key={initial} type="button" lang={initial.length === 1 ? 'sm' : undefined} aria-pressed={letter === initial} aria-controls="dictionary-results" onClick={() => show('', initial)}>{initial}</button>
            ))}
          </div>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">
          {letter
            ? `${plural(matches.length, 'entry', 'entries')} under ${letter}`
            : !searching
            ? `${matches.length} entries`
            : containing.length
            ? `No entry is exactly “${typed}”. ${plural(containing.length, 'longer entry has', 'longer entries have')} ${quoted(containingWords, 'and')} in it, in that order.${fallback && matches.length
              ? ` ${plural(matches.length, 'entry has', 'entries have')} ${quoted(fallback.words, 'or')} alone.`
              : partial.length ? ` ${plural(partial.length, 'word begins', 'words begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} what you typed.` : ''}`
            : fallback
            ? `No entry has all of “${typed}”. ${fallback.phrase
              ? `${plural(matches.length, 'entry matches', 'entries match')} “${fallback.phrase}”.`
              : `${plural(matches.length, 'entry has', 'entries have')} ${quoted(fallback.words, 'or')}.`}`
            : matches.length
            ? `${plural(matches.length, 'entry matches', 'entries match')}${partial.length ? `, and ${plural(partial.length, 'more begins', 'more begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} “${typed}”` : ''}`
            : partial.length
            ? `No word is exactly “${typed}”. ${plural(partial.length, 'word begins', 'words begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} it.`
            : suggestions.length
            ? `Nothing in the dictionary is spelled “${typed}”.`
            : 'No words match.'}
        </p>
        {englishPage && (
          <p className="dictionary-pointer">Every word with this meaning is on one page: <Link to={englishPage.path}>How to say {englishPage.headword} in Sāmoan</Link>.</p>
        )}
        <div id="dictionary-results">
          {nothing && suggestions.length > 0 ? (
            <section className="dictionary-group is-suggestions" aria-labelledby="dictionary-suggestions-title">
              <h2 id="dictionary-suggestions-title" className="dictionary-group-title">Did you mean</h2>
              <ul className="dictionary-list">{suggestions.map(entry => <EntryRow key={entry.id} entry={entry} />)}</ul>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Clear search</button>
            </section>
          ) : nothing ? (
            <div className="catalog-empty">
              <h2>No words match.</h2>
              <p>{letter
                ? 'Choose another letter, or search in Sāmoan or English.'
                : 'Try another spelling, or search in English. The dictionary holds the words the course teaches.'}</p>
              <button type="button" className="btn btn-primary" onClick={clear}>{letter ? 'Show all words' : 'Clear search'}</button>
            </div>
          ) : (
            <>
              {containing.length > 0 && (
                <section className="dictionary-group is-containing" aria-labelledby="dictionary-containing-title">
                  <h2 id="dictionary-containing-title" className="dictionary-group-title">{containing.length === 1 ? 'A longer entry' : 'Longer entries'} with {quoted(containingWords, 'and')}</h2>
                  <ul className="dictionary-list">{containing.map(entry => <EntryRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
              {matches.length > 0 && containing.length > 0 && (
                <section className="dictionary-group" aria-labelledby="dictionary-single-title">
                  <h2 id="dictionary-single-title" className="dictionary-group-title">Entries with {quoted(fallback ? fallback.words : containingWords, 'or')} alone</h2>
                  <ul className="dictionary-list">{matches.map(entry => <EntryRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
              {matches.length > 0 && containing.length === 0 && <ul className="dictionary-list">{matches.map(entry => <EntryRow key={entry.id} entry={entry} />)}</ul>}
              {partial.length > 0 && (
                <section className="dictionary-group" aria-labelledby="dictionary-partial-title">
                  <h2 id="dictionary-partial-title" className="dictionary-group-title">Words that begin with or contain {`“${typed}”`}</h2>
                  <ul className="dictionary-list">{partial.map(entry => <EntryRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
