import EntryMotif from '../components/EntryMotif.jsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import bookExercises from '@app/data/book-exercises.json'
import { lessonLevel } from '@app/lib/lesson-browser.js'
import { loadLesson } from '../lib/book.js'
import { markLessonDone, markLessonOpened, useProgress } from '../lib/progress.js'
import { Examples, Pairs, Table, Note, Para, List, WordCards, Md } from '../components/lesson/Blocks.jsx'
import { ExerciseSet } from '../components/lesson/Exercises.jsx'
import MobileCompass from '../components/lesson/MobileCompass.jsx'
import quickPractice from '@app/data/quick-practice.json'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import { Tile } from '../components/Tile.jsx'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import { exerciseAnchor, readExerciseState } from '../lib/exercise-progress.js'
import Interactive from '../components/interactive/Interactive.jsx'
import LoadFailure from '../components/LoadFailure.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'

const COLOURS = lessonColours(chapters, lessonLevel)

const LEVEL_NAME = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// eslint-disable-next-line react-refresh/only-export-components
export function groupSections(blocks) {
  const sections = []
  let cur = null
  for (const b of blocks) {
    if (b.type === 'h2') { cur = { id: b.id, title: b.text, blocks: [] }; sections.push(cur); continue }
    if (b.type === 'exercises-slot') { sections.push({ id: 'exercises', title: 'Exercises', exercises: true, blocks: [] }); continue }
    if (b.type === 'hr') continue
    if (cur) cur.blocks.push(b)
  }
  return sections
}

function wordCount(lesson) {
  const txt = JSON.stringify(lesson.blocks) + JSON.stringify(lesson.intro)
  return txt.split(/\s+/).length
}

export function RenderBlock({ block, n, ctx = {} }) {
  if (block.type === 'h3') return <h3 className="ls-h3" id={block.id}><Md text={block.text} /></h3>
  if (block.type === 'p') return <Para text={block.text} />
  if (block.type === 'examples') return <Examples pairs={block.pairs} />
  if (block.type === 'pairs') return <Pairs pairs={block.pairs} />
  if (block.type === 'table') return <Table head={block.head} body={block.body} />
  if (block.type === 'note') return <Note label={block.label} text={block.text} />
  if (block.type === 'list') return <List ordered={block.ordered} items={block.items} />
  if (block.type === 'quick-practice') {
    const qp = (quickPractice[String(n)] || []).find(q => q.id === block.id)
    return qp ? <ExerciseSet ex={qp} compact /> : null
  }
  if (block.type === 'exercise') {
    const ex = (bookExercises[String(n)] || []).find(e => e.id === block.id)
    return ex ? <ExerciseSet ex={ex} onProgress={ctx.onProgress} /> : null
  }
  if (block.type === 'interactive') {
    const item = ctx.interactives?.get(block.id)
    return item ? <Interactive item={item} figure={ctx.figures?.get(block.id)} /> : null
  }
  if (block.type === 'hr') return <hr className="ls-rule" />
  return null
}

const FIGURE_KINDS = new Set(['anatomy', 'builder', 'contrast', 'grid', 'scale', 'dialogue'])

// Figures are numbered in reading order: Figure 7.1, 7.2...
// eslint-disable-next-line react-refresh/only-export-components
export function interactiveContext(lesson, n) {
  const interactives = new Map((lesson?.interactives || []).map(item => [item.id, item]))
  const figures = new Map()
  let k = 0
  for (const block of lesson?.blocks || []) {
    if (block.type !== 'interactive') continue
    const item = interactives.get(block.id)
    if (item && FIGURE_KINDS.has(item.kind)) figures.set(block.id, `${n}.${k += 1}`)
  }
  return { interactives, figures }
}

export function Section({ s, n, ctx }) {
  const vocabulary = /^words-to-learn/.test(s.id)
  const vocabGroups = []
  const groupedIndexes = new Set()
  if (vocabulary) {
    s.blocks.forEach((block, index) => {
      if (block.type !== 'table') return
      const labelIndexes = []
      for (let cursor = index - 1; cursor >= 0 && s.blocks[cursor].type === 'p'; cursor -= 1) labelIndexes.unshift(cursor)
      const rawLabels = labelIndexes.map(labelIndex => s.blocks[labelIndex].text)
      const leadIndex = rawLabels.findIndex(text => /^\*\*/.test(text))
      const lead = leadIndex >= 0 ? rawLabels[leadIndex] : rawLabels[0] || ''
      const labelMatch = lead.match(/^(\*\*[^*]+\*\*(?:\s*\([^)]*\))?\s*:?)\s*([\s\S]*)$/)
      const notes = rawLabels.filter((_, partIndex) => partIndex !== (leadIndex >= 0 ? leadIndex : 0))
      if (labelMatch?.[2]) notes.unshift(labelMatch[2])
      vocabGroups.push({
        label: labelMatch?.[1] || lead || null,
        note: notes.join(' ').trim() || null,
        table: block,
      })
      groupedIndexes.add(index)
      labelIndexes.forEach(labelIndex => groupedIndexes.add(labelIndex))
    })
  }
  const firstGroup = groupedIndexes.size ? Math.min(...groupedIndexes) : -1
  return s.blocks.map((b, i) => {
    if (vocabulary && groupedIndexes.has(i) && i !== firstGroup) return null
    const el = vocabulary && i === firstGroup
      ? <WordCards groups={vocabGroups} lesson={n} />
      : <RenderBlock block={b} n={n} ctx={ctx} />
    return <div key={i} className="blk">{el}</div>
  })
}

export function Rail({ sections, active, prev, next, exStats, label = 'In this chapter' }) {
  return (
    <nav className="rail" aria-label={label}>
      <p className="rail-k">{label}</p>
      <ol className="rail-list">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className={`rail-a ${active === s.id ? 'is-on' : ''} ${sections.findIndex(x => x.id === active) > i ? 'is-past' : ''}`}>
              <span className="rail-dot" />
              <span className="rail-t"><Md text={s.title} /></span>
              {s.exercises && exStats.total > 0 && <span className="rail-c">{exStats.answered}/{exStats.total}</span>}
            </a>
          </li>
        ))}
      </ol>
      <div className="rail-nav">
        {prev && <Link to={`/chapters/${prev.chapter}`} className="rail-pn"><span className="rail-pn-k">← Chapter {prev.chapter}</span><em><Md text={prev.title} /></em></Link>}
        {next && <Link to={`/chapters/${next.chapter}`} className="rail-pn is-next"><span className="rail-pn-k">Chapter {next.chapter} →</span><em><Md text={next.title} /></em></Link>}
      </div>
    </nav>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function firstUnfinishedExerciseHref(exercises, progress) {
  const unfinished = exercises.find(exercise => {
    const answered = Object.keys(progress[exercise.id]?.state || {}).length
    return answered < exercise.items.filter(item => !item.given).length
  })
  if (!unfinished) return null
  return `#${exerciseAnchor(unfinished)}`
}

// eslint-disable-next-line react-refresh/only-export-components
export function readLessonExerciseProgress(exercises, storage) {
  return Object.fromEntries(exercises.map(exercise => [exercise.id, readExerciseState(exercise, storage)]))
}

export function FinishActions({ n, next, hasQuiz, vocabCount, exStats, firstUnfinishedHref }) {
  const remaining = Math.max(0, exStats.total - exStats.answered)
  const continueExercises = remaining > 0 ? (firstUnfinishedHref || '#exercises') : null
  const quizIsPrimary = !continueExercises && !next && hasQuiz
  const cardsArePrimary = !continueExercises && !next && !hasQuiz && vocabCount > 0

  return (
    <div className="finish-next">
      {continueExercises && (
        <a href={continueExercises} className="nx nx-main">
          <span className="nx-k">Recommended · {remaining} {remaining === 1 ? 'item' : 'items'} left</span>
          <span className="nx-t display">Continue exercises</span>
          <span className="nx-arr">↓</span>
        </a>
      )}
      {next && (
        <Link to={`/chapters/${next.chapter}`} className={`nx ${continueExercises ? '' : 'nx-main'}`}>
          <span className="nx-k">{continueExercises ? 'Continue the course' : `Up next · Chapter ${next.chapter}`}</span>
          <span className={`nx-t ${continueExercises ? '' : 'display'}`}>{continueExercises ? <>Chapter {next.chapter} · <Md text={next.title} /></> : <Md text={next.title} />}</span>
          {!continueExercises && <EntryMotif className="nx-entry" />}
        </Link>
      )}
      {hasQuiz && (
        <Link to={`/quizzes/${n}`} className={`nx ${quizIsPrimary ? 'nx-main' : ''}`}>
          <span className="nx-k">Check yourself</span>
          <span className={`nx-t ${quizIsPrimary ? 'display' : ''}`}>Chapter {n} quiz · 10 questions</span>
          {quizIsPrimary && <EntryMotif className="nx-entry" />}
        </Link>
      )}
      {vocabCount > 0 && (
        <Link to={`/cards?chapter=${n}`} className={`nx ${cardsArePrimary ? 'nx-main' : ''}`}>
          <span className="nx-k">Keep the words</span>
          <span className={`nx-t ${cardsArePrimary ? 'display' : ''}`}>Flip cards for Chapter {n}</span>
          {cardsArePrimary && <EntryMotif className="nx-entry" />}
        </Link>
      )}
      {!continueExercises && !next && !hasQuiz && vocabCount === 0 && (
        <Link to="/chapters" className="nx nx-main">
          <span className="nx-k">Keep learning</span>
          <span className="nx-t display">All chapters</span>
          <EntryMotif className="nx-entry" />
        </Link>
      )}
    </div>
  )
}

function Finish({ n, meta, next, exStats, vocabCount, firstUnfinishedHref }) {
  const { done } = useProgress()
  const [celebrate, setCelebrate] = useState(false)
  const isDone = done.has(n)
  const hasQuiz = Boolean(meta.quiz)
  const finish = () => { markLessonDone(n); setCelebrate(true) }

  return (
    <section className={`finish band grain ${isDone ? 'is-done' : ''}`} id="finish">
      <AnimatePresence mode="wait">
        {!isDone ? (
          <Motion.div key="ask" className="finish-ask" exit={{ opacity: 0, y: -10 }}>
            <p className="finish-k">End of Chapter {n}</p>
            <h2 className="finish-h display">Ready to mark it done?</h2>
            {exStats.total > 0 && (
              <p className="finish-p">You have answered {exStats.answered} of {exStats.total} exercise items{exStats.answered < exStats.total ? '. You can finish now and come back to the rest.' : '.'}</p>
            )}
            <button className="btn btn-primary finish-b" onClick={finish}>Finish Chapter {n} <span className="arr">✓</span></button>
          </Motion.div>
        ) : (
          <Motion.div key="done" className="finish-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="finish-burst" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <Motion.span
                  key={i}
                  initial={celebrate ? { scale: 0, rotate: 0, opacity: 0 } : false}
                  animate={{ scale: 1, rotate: (i % 2 ? 1 : -1) * 90, opacity: 1 }}
                  transition={{ delay: .05 * i, duration: .9, ease: [.16, 1, .3, 1] }}
                  style={{ '--a': `${i * 30}deg` }}
                >
                  <Tile {...lessonTile(n, i)} framed style={{ color: COLOURS[n] }} />
                </Motion.span>
              ))}
              <Motion.span className="finish-check" initial={celebrate ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16, delay: .2 }}>✓</Motion.span>
            </div>
            <p className="finish-k">Chapter {n} complete</p>
            <h2 className="finish-h display"><Md text={meta.title} />. Done.</h2>
            <p className="finish-p">
              {exStats.answered > 0 ? `You got ${exStats.right} of ${exStats.answered} right first time. ` : ''}
              That is {done.size} of {CHAPTER_COUNT} chapters.
            </p>
            <FinishActions
              n={n}
              next={next}
              hasQuiz={hasQuiz}
              vocabCount={vocabCount}
              exStats={exStats}
              firstUnfinishedHref={firstUnfinishedHref}
            />
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default function Lesson() {
  const { num } = useParams()
  const n = Number(num)
  const meta = chapters.find(c => c.chapter === n)
  useTitle(meta ? `Chapter ${n}: ${meta.title.replace(/\*/g, '')}` : 'Chapter not found')
  const [lesson, setLesson] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [active, setActive] = useState(null)
  const [exerciseProgress, setExerciseProgress] = useState({})
  const bodyRef = useRef(null)

  useEffect(() => {
    let live = true
    loadLesson(n).then(l => { if (live) setLesson(l) }).catch(() => { if (live) setLoadError(true) })
    if (meta) markLessonOpened(n)
    return () => { live = false }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLesson = lesson?.chapter === n ? lesson : null
  const sections = useMemo(() => (currentLesson ? groupSections(currentLesson.blocks) : []), [currentLesson])
  const exercises = useMemo(() => bookExercises[String(n)] || [], [n])
  const storedExerciseProgress = useMemo(() => readLessonExerciseProgress(bookExercises[String(n)] || []), [n])

  useEffect(() => {
    if (!sections.length) return
    const els = [...sections.map(s => document.getElementById(s.id)), document.getElementById('finish')].filter(Boolean)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-30% 0px -60% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  const ex = useMemo(() => ({ ...storedExerciseProgress, ...(exerciseProgress[n] || {}) }), [exerciseProgress, n, storedExerciseProgress])
  const onProgress = (id, state, total) => setExerciseProgress(all => ({
    ...all,
    [n]: { ...(all[n] || {}), [id]: { state, total } },
  }))
  const exStats = useMemo(() => {
    const total = exercises.reduce((a, e) => a + e.items.filter(item => !item.given).length, 0)
    const vals = Object.values(ex).flatMap(e => Object.values(e.state))
    return { total, answered: vals.length, right: vals.filter(Boolean).length }
  }, [ex, exercises])
  const firstUnfinishedHref = useMemo(() => firstUnfinishedExerciseHref(exercises, ex), [ex, exercises])
  const slotExercises = currentLesson?.slotExercises || []
  const placed = useMemo(() => interactiveContext(currentLesson, n), [currentLesson, n])
  const ctx = { onProgress, ...placed }

  if (!meta) return <div className="wrap" style={{ padding: '160px 0' }}><h1 className="display">No Chapter {num}</h1><Link to="/chapters" className="link">All chapters</Link></div>
  if (loadError) return <LoadFailure message={`Chapter ${n} did not load.`} />

  const prev = chapters.find(c => c.chapter === n - 1)
  const next = chapters.find(c => c.chapter === n + 1)
  const mins = currentLesson ? Math.max(3, Math.round(wordCount(currentLesson) / 200)) : null
  const vocabCount = currentLesson ? sections.filter(s => /^words-to-learn/.test(s.id)).flatMap(s => s.blocks.filter(b => b.type === 'table')).reduce((a, t) => a + t.body.length, 0) : 0

  return (
    <article className="lesson">
      <header className="ls-hero">
        <div className="wrap ls-hero-grid">
          <div className="ls-hero-copy">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/chapters">Chapters</Link><span aria-hidden="true">/</span>
              <span>{LEVEL_NAME[lessonLevel(meta)]}</span>
            </nav>
            <Motion.p className="ls-num" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6 }}>Chapter {String(n).padStart(2, '0')}</Motion.p>
            <h1 className="ls-h1 display">
              <span className="ls-line"><Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: [.16, 1, .3, 1] }}><Md text={meta.title} /></Motion.span></span>
            </h1>
            {currentLesson && currentLesson.intro.map((block, i) => block.type === 'p' ? (
              <Motion.p key={i} className="ls-intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .8 }}><Md text={block.text} /></Motion.p>
            ) : block.type === 'hr' ? (
              <hr key={i} className="ls-intro-rule" />
            ) : (
              <div key={i} className="ls-intro-block"><RenderBlock block={block} n={n} ctx={ctx} /></div>
            ))}
            <Motion.ul className="ls-meta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .4 }}>
              {mins && <li><strong>{mins} min</strong> read</li>}
              {exercises.length > 0 && <li><strong>{exercises.length}</strong> exercises</li>}
              {vocabCount > 0 && <li><strong>{vocabCount}</strong> new words</li>}
            </Motion.ul>
          </div>
          <Motion.div className="ls-hero-art" aria-hidden="true" initial={{ opacity: 0, scale: .9, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease: [.16, 1, .3, 1] }}>
            <div className="ls-art-tiles">
              {/* The lesson's own square first, then the rhythm that follows it, in the lesson's shade. */}
              {[...Array(9)].map((_, i) => <Tile key={i} {...lessonTile(n, i)} framed style={{ '--i': i, color: COLOURS[n] }} />)}
            </div>
            <span className="ls-art-n display">{String(n).padStart(2, '0')}</span>
          </Motion.div>
        </div>
      </header>

      {currentLesson && <MobileCompass lessonNumber={n} sections={sections} active={active} />}

      <div className="wrap ls-grid">
        <aside className="ls-rail-wrap">
          {currentLesson && <Rail sections={sections} active={active} prev={prev} next={next} exStats={exStats} />}
        </aside>

        <div className="ls-body" ref={bodyRef}>
          {!currentLesson && <div className="ls-skel" aria-busy="true">{[...Array(6)].map((_, i) => <i key={i} />)}</div>}
          {sections.map((s, si) => (
            <section key={s.id} id={s.id} className={`ls-sec ${s.exercises ? 'is-ex' : ''}`}>
              <div className="ls-sec-head">
                <span className="ls-sec-n">{String(si + 1).padStart(2, '0')}</span>
                <h2 className="ls-h2 display" tabIndex={-1}><Md text={s.title} /></h2>
              </div>
              {s.exercises
                ? slotExercises.map(e => <ExerciseSet key={e.id} ex={e} onProgress={onProgress} />)
                : <Section s={s} n={n} ctx={ctx} />}
            </section>
          ))}
        </div>
      </div>

      {currentLesson && <Finish n={n} meta={meta} next={next} exStats={exStats} vocabCount={vocabCount} firstUnfinishedHref={firstUnfinishedHref} />}
    </article>
  )
}
