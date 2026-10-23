/**
 * The drills hub at /drills (the Tongan Drills page). The groups come from
 * data/drills-catalog.json; every card is derived at run time from the
 * practice item it opens (lib/drills-catalog.js), so a card shows only strings
 * the honesty gate has already checked.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import T from '../components/T.jsx'
import { Md } from '../components/lesson/InlineMarkdown.jsx'
import catalog from '../data/drills-catalog.json'
import chapters from '@app/data/chapters.json'
import VOCAB from '@app/data/book-vocabulary.json'
import { loadInteractives } from '../lib/book.js'
import { filterDrillGroups } from '../lib/catalog-query.js'
import { buildDeck } from '../lib/daily-words.js'
import { LEVELS, LEVEL_FILTERS, buildDrillGroups, catalogIds, drillChapter, practiceItemsById } from '../lib/drills-catalog.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'

const DECK = buildDeck(VOCAB)
const CHAPTERS_NEEDED = [...new Set(catalogIds(catalog).map(drillChapter).filter(n => n != null))].sort((a, b) => a - b)
const TOTAL = catalogIds(catalog).length

function DrillCard({ drill }) {
  return (
    <Link className="catalog-card" to={`/drill/${drill.id}`}>
      <span className="catalog-card-top">
        <span>{drill.ch == null ? 'Every chapter' : `Chapter ${drill.ch}`}</span>
        <span>{LEVELS[drill.level]}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        {drill.sample.q && <span>{drill.sample.q}</span>}
        {drill.sample.sm && <T>{drill.sample.sm}</T>}
      </span>
      <strong><Md text={drill.title} /></strong>
      <span className="catalog-card-copy"><Md text={drill.blurb} /></span>
      <span className="catalog-card-action">{drill.action} <EntryMotif size={20} /></span>
    </Link>
  )
}

function DrillGroup({ section, filtering }) {
  const { visible } = section
  if (filtering && visible.length === 0) return null
  return (
    <section className="catalog-group" aria-labelledby={`drill-group-${section.key}`}>
      <header>
        <div>
          <p className="catalog-kicker">{visible.length} {visible.length === 1 ? 'drill' : 'drills'}</p>
          <h2 id={`drill-group-${section.key}`}>{section.name}</h2>
          <p>{section.note}</p>
        </div>
      </header>
      <div className="catalog-grid">
        {visible.map(drill => <DrillCard key={drill.id} drill={drill} />)}
      </div>
    </section>
  )
}

export default function Drills() {
  useTitle('Practice drills')
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [groups, setGroups] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    Promise.all(CHAPTERS_NEEDED.map(async n => ({ chapter: n, items: await loadInteractives(n) })))
      .then(files => { if (live) setGroups(buildDrillGroups(catalog, practiceItemsById(files), chapters, DECK)) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [])

  const sections = useMemo(() => (groups ? filterDrillGroups(groups, query, level) : []), [groups, query, level])
  const shown = sections.reduce((sum, group) => sum + group.visible.length, 0)
  const filtering = query.trim() !== '' || level !== 'all'

  const clear = () => {
    setQuery('')
    setLevel('all')
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <div className="catalog-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Drills · Practise at your pace</p>
          <h1 className="display">Practise one<br />pattern.</h1>
          <p>{TOTAL} drills, grouped by skill. Each one uses only Sāmoan printed in the course.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search drills</span>
            <input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try question, tense, chapter 4" />
          </label>
          <div className="catalog-filters" role="group" aria-label="Filter drills by level">
            {LEVEL_FILTERS.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={level === key} onClick={() => setLevel(key)}>{label}</button>
            ))}
          </div>
        </div>
        {failed ? (
          <p className="catalog-count" role="status">The drills could not be loaded. Reload the page to try again.</p>
        ) : !groups ? (
          <p className="catalog-count" role="status" style={{ minHeight: '100vh' }}>Loading the drills.</p>
        ) : (
          <>
            <p className="catalog-count" role="status" aria-live="polite">{shown} of {TOTAL} drills{filtering ? ' match your filters' : ''}</p>
            {shown === 0 ? (
              <div className="catalog-empty">
                <h2>No drills match.</h2>
                <p>Try a different word or clear the level filter.</p>
                <button type="button" className="btn btn-primary" onClick={clear}>Clear search and filters</button>
              </div>
            ) : sections.map(section => <DrillGroup key={section.key} section={section} filtering={filtering} />)}
          </>
        )}
      </div>
    </div>
  )
}
