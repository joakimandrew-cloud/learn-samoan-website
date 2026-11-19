import { Link } from 'react-router-dom'
import { Md } from './lesson/Blocks.jsx'
import T from './T.jsx'
import { searchAddress } from '../lib/dictionary-address.js'

// Pieces shared by /dictionary, the word pages and the English pages
// (Build-Spec part f of plans/2026-11-19-samoan-site-search-features.md). Every
// Sāmoan string and meaning shown is the course data's own.

// The chapters that teach an entry, as links.
export function ChapterLinks({ entry, short = false }) {
  return entry.chapters.map((chapter, index) => (
    <span key={chapter.number}>
      {index > 0 && ', '}
      <Link className={short ? 'dictionary-lesson' : undefined} to={chapter.href}>
        {short ? `Chapter ${chapter.number}` : <>Chapter {chapter.number}{chapter.title ? <>: <Md text={chapter.title} /></> : null}</>}
      </Link>
    </span>
  ))
}

// One row of the course dictionary: a search result, a letter's entry or a row
// of an English page. The word opens its own page; the chapter link stays.
export function EntryRow({ entry }) {
  return (
    <li className="dictionary-entry">
      <T as={Link} className="dictionary-samoan dictionary-word-link" to={entry.path}>{entry.display}</T>
      <span className="dictionary-english"><Md text={entry.english} /></span>
      <span className="dictionary-meta">
        {entry.listName && <span className="dictionary-pos">{entry.listName}</span>}
        {entry.chapters.length > 0 && <ChapterLinks entry={entry} short />}
      </span>
    </li>
  )
}

// A wrapping run of links to other word pages.
export function WordLinks({ words, label }) {
  return (
    <ul className="dictionary-word-links" aria-label={label}>
      {words.map(word => (
        <li key={word.path}><T as={Link} to={word.path}>{word.display}</T></li>
      ))}
    </ul>
  )
}

// The word before and after, and the way back to the search.
export function Neighbours({ previous, next, samoan = true }) {
  const name = item => samoan ? <T>{item.display}</T> : <span>{item.display}</span>
  return (
    <nav className="dictionary-neighbours" aria-label="More of the dictionary">
      {previous
        ? <Link className="dictionary-neighbour" to={previous.path}><small>Before</small>{name(previous)}</Link>
        : <span className="dictionary-neighbour is-empty" />}
      <Link className="btn btn-primary" to="/dictionary">Search the dictionary</Link>
      {next
        ? <Link className="dictionary-neighbour is-next" to={next.path}><small>After</small>{name(next)}</Link>
        : <span className="dictionary-neighbour is-empty" />}
    </nav>
  )
}

// An address under /dictionary that holds no entry.
export function DictionaryMissing({ typed }) {
  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow"><Link to="/dictionary">Dictionary</Link><span aria-hidden="true">·</span><span>No entry here</span></p>
          <h1 className="display">Not in the<br />dictionary.</h1>
          <p>This address does not match a word in the dictionary. Search for it in Sāmoan or English, with or without the macrons and the ʻ.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <Link className="btn btn-primary" to={typed ? searchAddress(typed.replace(/-/g, ' ')) : '/dictionary'}>Search the dictionary</Link>
      </div>
    </div>
  )
}
