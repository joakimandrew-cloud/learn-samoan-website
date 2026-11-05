/**
 * The chapter page, /chapters/:n (plan 2026-11-06-chapter-page-simplify; the design is
 * reviews/lesson-simplify-2026-11-06/Direction.md, the Quiet page with stepped practice, and
 * the Lea-Faka-Tonga lesson page it was copied from, rid of everything Tongan).
 *
 * One scroll for the reading and one Contents control in place of the rail and the phone
 * compass; quieter headings; no motion at load; exercises one set at a time with one button
 * showing; the chapter's Interactive blocks working in place, in the same figure panel as the
 * new moving figures, under one figure-number sequence. Each chapter's figures are read from
 * its own file, src/premium/figures/NN.js, loaded with the chapter; a chapter with no file
 * shows its reading with none. Saved progress is unchanged: ls-progress-v2, ls-exercises-v1,
 * quiz and done state, every section anchor, #exercises, every exercise anchor and #finish.
 *
 * The capture flags (?still, ?solo) and the /__proto/chapter route exist only in a test build
 * (__TEST_BUILD__ in vite.config.js), so a production build drops them.
 *
 * BookPage.jsx reads RenderBlock, Rail, Section and groupSections from here; they keep their
 * shapes, and Rail and MobileCompass stay in the tree for it.
 */
import EntryMotif from '../components/EntryMotif.jsx'
import LessonFish from '../components/LessonFish.jsx'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import bookExercises from '@app/data/book-exercises.json'
import { lessonLevel } from '@app/lib/lesson-browser.js'
import { loadLesson } from '../lib/book.js'
import { markLessonDone, markLessonOpened, useProgress } from '../lib/progress.js'
import { Examples, Pairs, Table, Note, Para, List, WordCards, Md, RevealOff } from '../components/lesson/Blocks.jsx'
import { ExerciseSet } from '../components/lesson/Exercises.jsx'
import { SteppedExercises, SteppedSet } from '../components/lesson/SteppedExercises.jsx'
import Contents from '../components/lesson/Contents.jsx'
import quickPractice from '@app/data/quick-practice.json'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import { Tile } from '../components/Tile.jsx'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import { exerciseAnchor, readExerciseState } from '../lib/exercise-progress.js'
import { figureNumbers, figurePlaces, groupSections as groupChapterSections, lengthLine, readingMinutes, vocabularyCount } from '../lib/chapter-page.js'
import Interactive from '../components/interactive/Interactive.jsx'
import Figure from '../figure-engine/Figure.jsx'
import LoadFailure from '../components/LoadFailure.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'
import '../styles/chapter-page.css'

const COLOURS = lessonColours(chapters, lessonLevel)

const LEVEL_NAME = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

// One file per chapter: src/premium/figures/NN.js. Adding a chapter's file touches no shared file.
const FIGURE_FILES = import.meta.glob('../figures/[0-9][0-9].js')

// Capture tools, in a test build only. A production build drops this branch whole.
const TestVariant = __TEST_BUILD__ ? lazy(() => import('../test-tools/Variants.jsx')) : null

/** The chapter's figure file, or an empty one when it has none yet. */
async function loadFigureFile(n) {
  const load = FIGURE_FILES[`../figures/${String(n).padStart(2, '0')}.js`]
  if (!load) return { figures: [], replaces: [] }
  const mod = await load()
  return { figures: mod.FIGURES || [], replaces: mod.REPLACES || [] }
}

// eslint-disable-next-line react-refresh/only-export-components
export const groupSections = groupChapterSections

/**
 * One block of book text, or a practice block in its place. ctx.stepped (the chapter page)
 * steps every exercise set; ctx.replaces names Interactive items a figure has replaced; the
 * book pages pass neither and render as they always have.
 */
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
    if (!qp) return null
    return ctx.stepped ? <SteppedSet ex={qp} compact /> : <ExerciseSet ex={qp} compact />
  }
  if (block.type === 'exercise') {
    const ex = (bookExercises[String(n)] || []).find(e => e.id === block.id)
    if (!ex) return null
    return ctx.stepped ? <SteppedSet ex={ex} onProgress={ctx.onProgress} /> : <ExerciseSet ex={ex} onProgress={ctx.onProgress} />
  }
  if (block.type === 'interactive') {
    if (ctx.replaces?.includes(block.id)) return null
    const item = ctx.interactives?.get(block.id)
    return item ? <Interactive item={item} figure={ctx.figures?.get(block.id)} /> : null
  }
  if (block.type === 'hr') return <hr className="ls-rule" />
  return null
}

// Figures are numbered in reading order: Figure 7.1, 7.2... (the book pages, which have no new figures).
// eslint-disable-next-line react-refresh/only-export-components
export function interactiveContext(lesson, n, { figures = [], replaces = [] } = {}) {
  const interactives = new Map((lesson?.interactives || []).map(item => [item.id, item]))
  const sections = lesson ? groupChapterSections(lesson.blocks) : []
  const numbers = figureNumbers({ n, sections, interactives, figures, replaces })
  return { interactives, figures: numbers.interactive, figureNumbers: numbers.figure, replaces }
}

/** The Words to Learn section: the word table as flip-card groups. Also used by the book pages. */
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

/** A teaching section's blocks, each followed by the figures its chapter file places after it. */
export function ChapterBlocks({ s, n, ctx, figures }) {
  const places = useMemo(() => figurePlaces(s, figures), [s, figures])
  return s.blocks.map((block, i) => {
    const el = <RenderBlock block={block} n={n} ctx={ctx} />
    const here = places.get(i) || []
    if (!here.length) return <div key={i} className="blk">{el}</div>
    return (
      <div key={i} className="blk">
        {el}
        {here.map(def => <Figure key={def.id} def={def} number={ctx.figureNumbers?.get(def.id)} />)}
      </div>
    )
  })
}

/** The desktop rail. The chapter page no longer shows it; the book pages still do. */
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

/** The ask and its one primary; the done state with its tiles at rest, the fish, and one recommended move. */
function Finish({ n, meta, next, exStats, vocabCount, firstUnfinishedHref }) {
  const { done } = useProgress()
  const [pressed, setPressed] = useState(false)
  const isDone = done.has(n)
  const hasQuiz = Boolean(meta.quiz)
  const finish = () => { markLessonDone(n); setPressed(true) }

  return (
    <section className={`finish band grain ${isDone ? 'is-done' : ''}`} id="finish">
      <AnimatePresence mode="wait" initial={false}>
        {!isDone ? (
          <Motion.div key="ask" className="finish-ask" exit={{ opacity: 0 }} transition={{ duration: .2 }}>
            <p className="finish-k">End of Chapter {n}</p>
            <h2 className="finish-h display">Ready to mark it done?</h2>
            {exStats.total > 0 && (
              <p className="finish-p">You have answered {exStats.answered} of {exStats.total} exercise items{exStats.answered < exStats.total ? '. You can finish now and come back to the rest.' : '.'}</p>
            )}
            <button type="button" className="btn btn-primary finish-b" onClick={finish}>Finish Chapter {n} <span className="arr">✓</span></button>
          </Motion.div>
        ) : (
          <div key="done" className="finish-done">
            <div className="finish-burst" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <span key={i} style={{ '--a': `${i * 30}deg`, transform: `rotate(${(i % 2 ? 1 : -1) * 90}deg)` }}>
                  <Tile {...lessonTile(n, i)} framed style={{ color: COLOURS[n] }} />
                </span>
              ))}
              {/* The check keeps a short fade as feedback to the press; the tiles never move. */}
              <Motion.span className="finish-check" initial={pressed ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: .25 }}>✓</Motion.span>
            </div>
            <LessonFish className="finish-fish" />
            <p className="finish-k">Chapter {n} complete</p>
            <h2 className="finish-h display"><Md text={meta.title} />. Done.</h2>
            <p className="finish-p">
              {exStats.answered > 0 ? `You got ${exStats.right} of ${exStats.answered} right first time. ` : ''}
              That is {done.size} of {CHAPTER_COUNT} chapters.
            </p>
            <FinishActions n={n} next={next} hasQuiz={hasQuiz} vocabCount={vocabCount} exStats={exStats} firstUnfinishedHref={firstUnfinishedHref} />
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** The hero: where the chapter sits in the course, the title, the intro and one length line. No art, no motion. */
function Hero({ n, meta, lesson, ctx, length }) {
  return (
    <header className="ls-hero pl-hero">
      <div className="pl-col">
        <p className="pl-kicker">{`Chapter ${n} of ${CHAPTER_COUNT}`}</p>
        <h1 className="ls-h1 display"><Md text={meta.title} /></h1>
        {lesson && lesson.intro.map((block, i) => (block.type === 'p'
          ? <p key={i} className="ls-intro"><Md text={block.text} /></p>
          : block.type === 'hr' ? <hr key={i} className="ls-intro-rule" /> : <div key={i} className="ls-intro-block"><RenderBlock block={block} n={n} ctx={ctx} /></div>))}
        {length && <p className="pl-length">{length}</p>}
      </div>
    </header>
  )
}

/** The flag on <html> for this page only: the Contents control appears once the hero has passed. */
function usePastHero(heroRef) {
  useEffect(() => {
    const root = document.documentElement
    const onScroll = () => {
      const hero = heroRef.current
      const bottom = hero ? hero.offsetTop + hero.offsetHeight - 40 : 600
      root.dataset.pastHero = window.scrollY > bottom ? 'true' : 'false'
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      delete root.dataset.pastHero
    }
  }, [heroRef])
}

export default function Lesson() {
  const { num } = useParams()
  const [params] = useSearchParams()
  const n = Number(num)
  const meta = chapters.find(c => c.chapter === n)
  useTitle(meta ? `Chapter ${n}: ${meta.title.replace(/\*/g, '')}` : 'Chapter not found')
  const solo = __TEST_BUILD__ ? params.get('solo') : null
  const [loaded, setLoaded] = useState(null)
  const [loadError, setLoadError] = useState(false)
  const [active, setActive] = useState(null)
  const [exerciseProgress, setExerciseProgress] = useState({})
  const heroRef = useRef(null)
  usePastHero(heroRef)

  useEffect(() => {
    let live = true
    Promise.all([loadLesson(n), loadFigureFile(n)])
      .then(([lesson, file]) => { if (live) setLoaded({ n, lesson, file }) })
      .catch(() => { if (live) setLoadError(true) })
    if (meta) markLessonOpened(n)
    return () => { live = false }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLesson = loaded?.n === n ? loaded.lesson : null
  const file = loaded?.n === n ? loaded.file : null
  const figures = useMemo(() => file?.figures || [], [file])
  const replaces = useMemo(() => file?.replaces || [], [file])
  const sections = useMemo(() => (currentLesson ? groupChapterSections(currentLesson.blocks) : []), [currentLesson])
  const exercises = useMemo(() => bookExercises[String(n)] || [], [n])
  const storedExerciseProgress = useMemo(() => readLessonExerciseProgress(bookExercises[String(n)] || []), [n])

  useEffect(() => {
    if (!sections.length) return undefined
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
  const placed = useMemo(() => interactiveContext(currentLesson, n, { figures, replaces }), [currentLesson, n, figures, replaces])
  const ctx = { onProgress, stepped: true, ...placed }

  if (!meta) return <div className="wrap" style={{ padding: '160px 0' }}><h1 className="display">No Chapter {num}</h1><Link to="/chapters" className="link">All chapters</Link></div>
  if (loadError) return <LoadFailure message={`Chapter ${n} did not load.`} />
  if (TestVariant && solo) return <Suspense fallback={null}><TestVariant which="solo" figures={figures} id={solo} /></Suspense>

  const prev = chapters.find(c => c.chapter === n - 1)
  const next = chapters.find(c => c.chapter === n + 1)
  const vocabCount = currentLesson ? vocabularyCount(sections) : 0
  const length = currentLesson ? lengthLine({ mins: readingMinutes(currentLesson), exercises: exercises.length, words: vocabCount }) : null

  return (
    <RevealOff.Provider value>
      <article className="lesson pl">
        <div ref={heroRef}><Hero n={n} meta={meta} lesson={currentLesson} ctx={ctx} length={length} /></div>
        {currentLesson && (
          <Contents n={n} level={LEVEL_NAME[lessonLevel(meta)]} sections={sections} active={active} exStats={exStats} prev={prev} next={next} />
        )}
        <div className="pl-col ls-body pl-body">
          {!currentLesson && <div className="ls-skel" aria-busy="true">{[...Array(6)].map((_, i) => <i key={i} />)}</div>}
          {sections.map((s, si) => (
            <section key={s.id} id={s.id} className={`ls-sec ${s.exercises ? 'is-ex' : ''}`}>
              <div className="ls-sec-head">
                <span className="ls-sec-n">{String(si + 1).padStart(2, '0')}</span>
                <h2 className="ls-h2 display" tabIndex={-1}><Md text={s.title} /></h2>
              </div>
              {s.exercises
                ? <SteppedExercises exercises={slotExercises} onProgress={onProgress} stored={storedExerciseProgress} />
                : /^words-to-learn/.test(s.id)
                  ? <Section s={s} n={n} ctx={ctx} />
                  : <ChapterBlocks s={s} n={n} ctx={ctx} figures={figures} />}
            </section>
          ))}
        </div>
        {currentLesson && <Finish n={n} meta={meta} next={next} exStats={exStats} vocabCount={vocabCount} firstUnfinishedHref={firstUnfinishedHref} />}
      </article>
    </RevealOff.Provider>
  )
}
