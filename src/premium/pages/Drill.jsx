/**
 * One drill at /drill/:id (the Tongan SourceDrill page). A drill is a practice
 * item from a chapter's src/data/interactives/NN.json, found by id and shown
 * in the Tongan DrillFrame, or the Daily words deck. The item is read at run
 * time from the same file the chapter page reads; nothing is copied.
 */
import { lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import { Md } from '../components/lesson/InlineMarkdown.jsx'
import Pick from '../components/interactive/Pick.jsx'
import Order from '../components/interactive/Order.jsx'
import Match from '../components/interactive/Match.jsx'
import Sort from '../components/interactive/Sort.jsx'
import Type from '../components/interactive/Type.jsx'
import { InteractiveBoundary } from '../components/interactive/Shells.jsx'
import { keepControlKeysLocal } from '../components/interactive/engine.js'
import DrillFrame from '../drills/DrillFrame.jsx'
import { DrillEndLinks } from '../drills/drill-end-links.js'
import { loadInteractives } from '../lib/book.js'
import { DAILY_WORDS_ENTRY, DAILY_WORDS_ID, PRACTICE_KINDS, drillChapter, drillEyebrow, stripStars } from '../lib/drills-catalog.js'
import { useTitle } from '../lib/title.js'
import chapters from '@app/data/chapters.json'
import '../styles/interactive.css'
import '../styles/source-core.css'
import '../styles/catalog.css'

const DailyWords = lazy(() => import('../drills/DailyWords.jsx'))
const WIDGETS = { pick: Pick, order: Order, match: Match, sort: Sort, type: Type }

// Match keeps its own end card (components/interactive/Match.jsx), which does not
// read DrillEndLinks. Until it uses the shared DeckComplete, this puts the same
// two exits into its end row when the deck finishes, the way DeckComplete does.
function MatchExits({ children }) {
  const links = useContext(DrillEndLinks)
  const wrap = useRef(null)
  const [host, setHost] = useState(null)
  useEffect(() => {
    const root = wrap.current
    if (!root) return undefined
    const sync = () => {
      const row = root.querySelector('.pcs-end-row')
      if (!row) { setHost(null); return }
      if (row.querySelector('.pcs-end-link')) return
      const slot = document.createElement('span')
      slot.style.display = 'contents'
      row.insertBefore(slot, row.querySelector('.pcs-reset'))
      setHost(slot)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={wrap}>
      {children}
      {host && links && createPortal(
        <>
          {links.chapterNum && <Link to={`/chapters/${links.chapterNum}`} className="pcs-end-link">Back to Chapter {links.chapterNum}</Link>}
          {links.backTo && <Link to={links.backTo} className="pcs-end-link">All drills</Link>}
        </>, host)}
    </div>
  )
}

function Missing() {
  return (
    <section className="source-missing band grain">
      <div className="wrap">
        <p className="eyebrow">Drill not found</p>
        <h1 className="display">That practice<br />isn’t here.</h1>
        <p>The drill address may have changed. The complete practice catalogue is one step back.</p>
        <Link className="btn btn-primary" to="/drills">All drills <EntryMotif size={20} /></Link>
      </div>
    </section>
  )
}

export default function Drill() {
  const { id } = useParams()
  const daily = id === DAILY_WORDS_ID
  const chapter = drillChapter(id)
  // The loaded item is kept with the id it was loaded for, so a fast move to
  // another drill never shows the previous one.
  const [loaded, setLoaded] = useState({ id: null, item: null })
  useEffect(() => {
    if (daily || chapter == null) return undefined
    let live = true
    loadInteractives(chapter).then(items => {
      if (live) setLoaded({ id, item: items.find(x => x.id === id && PRACTICE_KINDS.includes(x.kind)) || null })
    }).catch(() => { if (live) setLoaded({ id, item: null }) })
    return () => { live = false }
  }, [id, daily, chapter])

  const settled = daily || chapter == null || loaded.id === id
  const item = daily || !settled ? null : loaded.item
  const missing = !daily && settled && !item
  const title = daily ? DAILY_WORDS_ENTRY.title : item ? stripStars(item.title) : missing ? 'Drill not found' : ''
  useTitle(title)
  const eyebrow = useMemo(() => drillEyebrow(id, chapters), [id])

  if (missing) return <Missing />
  if (!daily && !item) return <section className="source-drill-shell"><div className="premium-core" /></section>

  const Widget = item ? WIDGETS[item.kind] : null
  return (
    <section className="source-drill-shell" data-drill-id={id}>
      <div className="premium-core ix-practice" onKeyDown={keepControlKeysLocal}>
        <DrillFrame
          backTo="/drills"
          chapterNum={daily ? null : chapter}
          eyebrow={eyebrow}
          title={daily ? DAILY_WORDS_ENTRY.title : <Md text={item.title} />}
          blurb={daily ? DAILY_WORDS_ENTRY.blurb : item.intro ? <Md text={item.intro} /> : null}
        >
          <InteractiveBoundary id={id}>
            {daily
              ? <Suspense fallback={null}><DailyWords /></Suspense>
              : item.kind === 'match'
                ? <MatchExits><Widget key={id} data={item.data} id={item.id} /></MatchExits>
                : <Widget key={id} data={item.data} id={item.id} />}
          </InteractiveBoundary>
        </DrillFrame>
      </div>
    </section>
  )
}
