import EntryMotif from '../components/EntryMotif.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import { LESSON_TIERS, LESSON_GROUPS, filterLessons, lessonLevel } from '@app/lib/lesson-browser.js'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import { Md } from '../components/lesson/Blocks.jsx'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import T from '../components/T.jsx'
import { Tile } from '../components/Tile.jsx'
import { useProgress } from '../lib/progress.js'
import '../styles/lessons.css'

const LEVELS = [{ key: 'all', name: 'All' }, ...LESSON_TIERS.map(t => ({ key: t.key, name: t.name }))]
// Same tile, flip and shade as the lesson's square on the homepage map.
const COLOURS = lessonColours(chapters, lessonLevel)


function ResumeCard() {
  const { done, last } = useProgress()
  // Resume the last chapter opened; once it is finished, offer the next one.
  const target = last ? (done.has(last) ? Math.min(CHAPTER_COUNT, last + 1) : last) : 1
  const lesson = chapters.find(c => c.chapter === target)
  const resuming = Boolean(last)
  const complete = done.size >= CHAPTER_COUNT
  const upNext = resuming && done.has(last) && target !== last
  return (
    <Motion.aside className="resume band grain" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .2, ease: [.16, 1, .3, 1] }}>
      <div className="resume-top">
        <span className="resume-k">{complete ? 'Course complete' : upNext ? 'Up next' : resuming ? 'Pick up where you left off' : 'Your first chapter'}</span>
        <span className="resume-n display">{String(lesson.chapter).padStart(2, '0')}</span>
      </div>
      <h2 className="resume-title display"><Md text={lesson.title} /></h2>
      {lesson.example && (
        <p className="resume-ex"><T>{lesson.example.samoan}</T> <span><Md text={lesson.example.english} /></span></p>
      )}
      <Link to={`/chapters/${lesson.chapter}`} className="btn btn-primary">
        {complete ? `Review Chapter ${lesson.chapter}` : upNext ? `Start Chapter ${lesson.chapter}` : resuming ? `Continue Chapter ${lesson.chapter}` : "Start Chapter 1, it's free"} <EntryMotif size={20} />
      </Link>
      <div className="resume-meter" aria-label={`${done.size} of ${CHAPTER_COUNT} chapters complete`}>
        <div className="resume-bars" style={{ '--bars': chapters.length }}>
          {chapters.map(c => <i key={c.chapter} className={done.has(c.chapter) ? 'on' : ''} />)}
        </div>
        <span>{done.size} of {CHAPTER_COUNT} complete</span>
      </div>
    </Motion.aside>
  )
}

// The sticky left column of a band: how many chapters it holds, what it
// covers, and how far the learner has come in it. (The Tongan catalog splits
// each level into named groups; the Samoan book's spine is three bands.)
function BandHead({ band, lead, done, shown }) {
  const finished = band.filter(c => done.has(c.chapter)).length
  return (
    <div className="grp-head">
      <h3><span>{band.length} chapters</span></h3>
      <p><Md text={lead} /></p>
      <div className="grp-progress" aria-label={`${finished} of ${band.length} chapters in this band complete`}>
        <div className="resume-bars" style={{ '--bars': band.length }}>
          {band.map(c => <i key={c.chapter} className={done.has(c.chapter) ? 'on' : ''} />)}
        </div>
        <span>{finished} of {band.length} complete</span>
      </div>
      {shown < band.length && <p className="grp-shown">Showing {shown} of {band.length}</p>}
    </div>
  )
}

function Row({ c, i, done }) {
  // Each chapter's own sample sentence (scripts/sync-course.mjs picks one no
  // earlier chapter shows).
  const ex = c.example
  return (
    <Motion.li
      layout="position"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      viewport={{ once: true, margin: '-6% 0px' }}
      transition={{ duration: .6, delay: (i % 6) * .04, ease: [.16, 1, .3, 1] }}
    >
      <Link to={`/chapters/${c.chapter}`} className={`row ${done ? 'is-done' : ''}`}>
        <span className="row-tile" aria-hidden="true"><Tile {...lessonTile(c.chapter)} framed style={{ color: COLOURS[c.chapter] }} /></span>
        <span className="row-n display">{String(c.chapter).padStart(2, '0')}</span>
        <span className="row-main">
          <span className="row-title"><Md text={c.title} /></span>
          <span className="row-topics"><Md text={c.sections.filter(section => normalizeForDisplay(section) !== normalizeForDisplay(c.title)).slice(0, 2).join(' · ')} /></span>
        </span>
        {ex && (
          <span className="row-ex">
            <T className="row-ex-to">{ex.samoan}</T>
            <span className="row-ex-en"><Md text={ex.english} /></span>
          </span>
        )}
        <span className="row-end" aria-hidden="true">
          {done ? <span className="row-check">✓</span> : <EntryMotif className="entry-row" />}
        </span>
      </Link>
    </Motion.li>
  )
}

function normalizeForDisplay(value) {
  return String(value ?? '').replace(/\*+/g, '').trim().toLocaleLowerCase()
}

export default function Lessons() {
  useTitle(`All ${CHAPTER_COUNT} chapters`)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const { done } = useProgress()
  const results = useMemo(() => filterLessons(chapters, { query, level }), [query, level])

  useEffect(() => {
    if (!query && level === 'all') return
    const list = listRef.current
    if (!list) return
    const top = list.getBoundingClientRect().top + window.scrollY - 150
    if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [query, level])

  const tiers = LESSON_TIERS
    .filter(t => level === 'all' || t.key === level)
    .map(t => ({
      ...t,
      groups: LESSON_GROUPS.filter(g => t.groupKeys.includes(g.key)).map(g => ({ ...g, lessons: results.filter(r => r.group === g.key) })).filter(g => g.lessons.length),
      total: chapters.filter(c => lessonLevel(c) === t.key),
    }))
    .filter(t => t.groups.length)

  return (
    <div className="lessons">
      <section className="lx-hero">
        <div className="wrap lx-hero-grid">
          <div>
            <Motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .05 }}>The full course · Beginner to advanced</Motion.p>
            <h1 className="lx-h1 display">
              {[`${CHAPTER_COUNT} chapters.`, 'One clear path.'].map((l, i) => (
                <span className="lx-line" key={l}>
                  <Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .08 + i * .08, ease: [.16, 1, .3, 1] }}>{l}</Motion.span>
                </span>
              ))}
            </h1>
            <Motion.p className="lx-lead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .8 }}>
              Every chapter has worked examples, exercises with answers and a 10-question quiz. Start at the beginning or find the chapter you need.
            </Motion.p>
          </div>
          <ResumeCard />
        </div>
      </section>

      <div className="lx-bar">
        <div className="wrap lx-bar-in">
          <label className="lx-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <span className="visually-hidden">Search chapters</span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search chapters" />
            {query && <button className="lx-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search">×</button>}
          </label>
          <label className="lx-level-sel">
            <span className="visually-hidden">Level</span>
            <select value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l.key} value={l.key}>{l.key === 'all' ? 'All levels' : l.name}</option>)}
            </select>
          </label>
          <div className="seg" role="radiogroup" aria-label="Level">
            {LEVELS.map(l => (
              <button key={l.key} role="radio" aria-checked={level === l.key} className={`seg-b ${level === l.key ? 'is-on' : ''}`} onClick={() => setLevel(l.key)}>
                {level === l.key && <Motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="seg-t">{l.name}</span>
              </button>
            ))}
          </div>
          <span className="lx-count" aria-live="polite">{results.length} {results.length === 1 ? 'chapter' : 'chapters'}</span>
        </div>
      </div>

      <div className="wrap lx-list" ref={listRef}>
        <AnimatePresence mode="popLayout">
          {tiers.length === 0 && (
            <Motion.div className="lx-empty" key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="lx-empty-t">{query ? <>No chapter matches “{query}”.</> : `No ${LEVELS.find(item => item.key === level)?.name || ''} chapters match.`}</p>
              <p>Try a topic like <button onClick={() => { setLevel('all'); setQuery('possessives') }}>possessives</button> or a Samoan word like <button onClick={() => { setLevel('all'); setQuery('faʻa') }} lang="sm" className="to">faʻa</button>.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setLevel('all') }}>Show all {CHAPTER_COUNT} chapters</button>
            </Motion.div>
          )}
          {tiers.map(t => (
            <Motion.section key={t.key} className={`tier-block lvl-${t.key}`} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <header className="tier-head">
                <h2 className="display">{t.name}</h2>
                <p className="tier-blurb">{t.blurb}</p>
                <span className="tier-meta">Chapters {t.total[0].chapter} to {t.total[t.total.length - 1].chapter}</span>
              </header>
              {t.groups.map(g => (
                <div key={g.key} className="grp">
                  <BandHead band={t.total} lead={g.lead} done={done} shown={g.lessons.length} />
                  <ol className="rows">
                    {g.lessons.map((c, i) => <Row key={c.chapter} c={c} i={i} done={done.has(c.chapter)} />)}
                  </ol>
                </div>
              ))}
            </Motion.section>
          ))}
        </AnimatePresence>
      </div>

    </div>
  )
}
