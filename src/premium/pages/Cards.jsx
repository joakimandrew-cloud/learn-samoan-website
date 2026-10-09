import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import vocabulary from '@app/data/book-vocabulary.json'
import { loadLesson } from '../lib/book.js'
import {
  advanceDeck,
  cardsLeft,
  lessonCards,
  lessonDeckKey,
  restartDeck,
  shuffleDeck,
  useDeckProgress,
} from '../lib/card-progress.js'
import Card from '../components/practice/PracticeCard.jsx'
import { Md } from '../components/lesson/Blocks.jsx'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import '../styles/cards.css'

// Every Words to Learn row in the book, as a card. The collections are the
// book's own: its three list names, and the three bands of the course.
const ALL_CARDS = vocabulary.map(row => ({
  id: row.id,
  to: row.samoan,
  en: row.english.replace(/[*_]/g, ''),
  type: `Chapter ${row.chapter}`,
  chapter: row.chapter,
  list: row.list,
}))
const BAND = Object.fromEntries(chapters.map(c => [c.chapter, c.level]))
const COLLECTIONS = [
  { id: 'all', label: 'All course words', group: 'All', test: () => true },
  { id: 'vocabulary', label: 'Vocabulary', group: 'By list', test: card => card.list === 'vocabulary' },
  { id: 'grammar', label: 'Grammar words', group: 'By list', test: card => card.list === 'grammar' },
  { id: 'carry', label: 'Words to carry', group: 'By list', test: card => card.list === 'carry' },
  { id: 'beginner', label: 'Beginner (Chapters 1 to 23)', group: 'By band', test: card => BAND[card.chapter] === 'beginner' },
  { id: 'intermediate', label: 'Intermediate (Chapters 24 to 41)', group: 'By band', test: card => BAND[card.chapter] === 'intermediate' },
  { id: 'advanced', label: 'Advanced (Chapters 42 to 51)', group: 'By band', test: card => BAND[card.chapter] === 'advanced' },
]

// Same Samoan word, another card in the course with a different meaning.
const BY_WORD = new Map()
for (const card of ALL_CARDS) BY_WORD.set(card.to, [...(BY_WORD.get(card.to) || []), card])
function meaningOf(card) {
  const others = (BY_WORD.get(card.to) || []).filter(other => other.id !== card.id && other.en !== card.en)
  return others.length ? { count: others.length + 1, also: others.map(other => other.en) } : undefined
}

function wordsOf(lesson, number) {
  if (!lesson) return []
  const tables = []
  let inWords = false
  for (const block of lesson.blocks) {
    if (block.type === 'h2') inWords = /^words-to-learn/.test(block.id)
    else if (inWords && block.type === 'table') tables.push(block)
  }
  return lessonCards(tables, number)
}


function Deck({ deckKey, words, mode, lessonNumber, meaningFor }) {
  const [state, setState] = useDeckProgress(deckKey, words)
  const [flipped, setFlipped] = useState(false)
  const [exitDirection, setExitDirection] = useState(0)
  const byId = useMemo(() => new Map(words.map(word => [word.id, word])), [words])
  const queue = state.order.slice(state.position).map(id => byId.get(id)).filter(Boolean)
  const currentId = state.order[state.position]
  const progress = state.order.length ? state.position / state.order.length * 100 : 0
  const left = cardsLeft(state)

  const swipe = useCallback((pile) => {
    if (!currentId) return
    setExitDirection(pile === 'known' ? 1 : -1)
    setState(previous => advanceDeck(previous, pile))
    setFlipped(false)
  }, [currentId, setState])

  useEffect(() => {
    const onKey = event => {
      if (!currentId || state.finished) return
      const interactive = event.target instanceof Element
        ? event.target.closest('a, button, input, select, textarea, summary, [role="button"]')
        : null
      if ((interactive && !interactive.classList.contains('fc')) || event.metaKey || event.ctrlKey || event.altKey) return
      // Enter on the focused card is the card's own tap (PracticeCard onTap),
      // so it is not toggled a second time here.
      if (event.key === 'Enter' && event.target instanceof Element && event.target.closest('.fc')) return
      if (event.key === 'ArrowLeft') swipe('again')
      else if (event.key === 'ArrowRight') swipe('known')
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setFlipped(value => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentId, state.finished, swipe])

  if (!words.length) {
    return (
      <div className="deck-empty" role="status">
        <strong>No words in this deck.</strong>
        <span>{mode === 'lesson' ? 'Choose another chapter.' : 'Choose another collection.'}</span>
      </div>
    )
  }

  return (
    <>
      {!state.finished && (
        <p className="cards-left" aria-live="polite">{left} of {state.order.length} {state.order.length === 1 ? 'card' : 'cards'} left</p>
      )}
      <div className="cards-progress" aria-hidden="true"><Motion.i animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} /></div>
      <div className="cards-main">
        <div className="pile pile-again"><span className="pile-n display">{state.again.length}</span><span className="pile-l">Again</span></div>
        <div className="deck">
          <AnimatePresence custom={exitDirection}>
            {!state.finished && queue.slice(0, 3).map((card, index) => (
              <Card
                key={card.id}
                word={card}
                depth={index}
                flipped={index === 0 && flipped}
                onFlip={() => setFlipped(value => !value)}
                onSwipe={swipe}
                front={state.direction}
                meaning={meaningFor?.(card)}
              />
            ))}
          </AnimatePresence>
          {state.finished && (
            <Motion.div className="deck-done" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}>
              <p className="deck-done-k">Deck finished</p>
              <p className="deck-done-h display">{state.known.length} of {state.order.length}<br />known</p>
              <div className="deck-done-a">
                {state.again.length > 0 && <button className="btn btn-primary" onClick={() => setState(previous => restartDeck(previous, words, previous.again))}>Practise {state.again.length} again <span className="arr">↻</span></button>}
                <button className="btn btn-ghost" onClick={() => setState(previous => restartDeck(previous, words))}>Restart this deck</button>
                {mode === 'lesson' && lessonNumber < CHAPTER_COUNT && <Link className="btn btn-ghost" to={`/cards?chapter=${lessonNumber + 1}`}>Chapter {lessonNumber + 1} words</Link>}
              </div>
            </Motion.div>
          )}
        </div>
        <div className="pile pile-known"><span className="pile-n display">{state.known.length}</span><span className="pile-l">Got it</span></div>
      </div>
      {!state.finished && (
        <div className="cards-actions">
          <button className="ca again" onClick={() => swipe('again')}><span aria-hidden="true">←</span> Again</button>
          <button className="ca flip" onClick={() => setFlipped(value => !value)}>Turn <kbd className="kbd-only">Space</kbd></button>
          <button className="ca known" onClick={() => swipe('known')}>Got it <span aria-hidden="true">→</span></button>
        </div>
      )}
      <div className="cards-deck-tools">
        <button type="button" aria-pressed={state.direction === 'en'} onClick={() => { setFlipped(false); setState(previous => ({ ...previous, direction: previous.direction === 'to' ? 'en' : 'to' })) }}>
          {state.direction === 'to' ? 'Samoan → English' : 'English → Samoan'}
        </button>
        <button type="button" onClick={() => { setFlipped(false); setState(previous => shuffleDeck(previous, words)) }}>⇄ Shuffle and restart</button>
      </div>
      <p className="cards-foot"><span className="touch-only">Swipe a card left or right. </span><span className="kbd-only">Drag a card, or use the arrow keys. </span>{mode === 'lesson' && <Link to={`/chapters/${lessonNumber}`} className="link">Back to Chapter {lessonNumber}</Link>}</p>
    </>
  )
}

function LessonDeck({ lessonNumber }) {
  const [lesson, setLesson] = useState(null)
  useEffect(() => {
    let active = true
    loadLesson(lessonNumber).then(value => { if (active) setLesson(value) })
    return () => { active = false }
  }, [lessonNumber])
  const words = useMemo(() => wordsOf(lesson, lessonNumber), [lesson, lessonNumber])
  if (!lesson) return <div className="cards-loading" aria-busy="true">Loading chapter words…</div>
  return <Deck key={lessonDeckKey(lessonNumber)} deckKey={lessonDeckKey(lessonNumber)} words={words} mode="lesson" lessonNumber={lessonNumber} />
}

export default function Cards() {
  const [params, setParams] = useSearchParams()
  const chapterParam = params.get('chapter') || params.get('lesson')
  const mode = chapterParam ? 'lesson' : 'global'
  const lessonNumber = Math.min(CHAPTER_COUNT, Math.max(1, Number(chapterParam) || 1))
  const [collection, setCollection] = useState('all')
  const chosen = COLLECTIONS.find(entry => entry.id === collection) || COLLECTIONS[0]
  const globalWords = useMemo(() => ALL_CARDS.filter(chosen.test), [chosen])
  const globalKey = `collection:${chosen.id}`
  const lesson = chapters.find(chapter => chapter.chapter === lessonNumber)
  useTitle(mode === 'global' ? 'Vocabulary flip cards' : `Flip cards: Chapter ${lessonNumber}`)
  const groups = [...new Set(COLLECTIONS.map(entry => entry.group))]

  return (
    <div className="cards">
      <div className="cards-in">
        <header className="cards-head">
          <div>
            <p className="eyebrow">Flip cards · {mode === 'global' ? `${vocabulary.length} book words` : 'Chapter deck'}</p>
            <h1 className="cards-h1 display">{mode === 'global' ? <>Build a useful<br />Samoan vocabulary.</> : `Words from Chapter ${lessonNumber}`}</h1>
            <p className="cards-sub">{mode === 'global' ? 'Every word from the Words to Learn tables. Choose a list or a band, then work through it in either direction.' : <><Md text={lesson?.title} /> · words from the chapter’s Words to Learn</>}</p>
          </div>
          <div className="cards-mode" role="tablist" aria-label="Card collection">
            <button type="button" role="tab" aria-selected={mode === 'global'} onClick={() => setParams({})}>Book vocabulary</button>
            <button type="button" role="tab" aria-selected={mode === 'lesson'} onClick={() => setParams({ chapter: String(lessonNumber) })}>Chapter words</button>
          </div>
        </header>

        {mode === 'global' ? (
          <>
            <div className="cards-controls global-controls">
              <label className="cards-select">
                <span>Collection</span>
                <select value={collection} onChange={event => setCollection(event.target.value)}>
                  {groups.map(group => (
                    <optgroup key={group} label={group}>
                      {COLLECTIONS.filter(entry => entry.group === group).map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <span className="cards-filter-count" role="status">{globalWords.length} cards</span>
            </div>
            <Deck key={globalKey} deckKey={globalKey} words={globalWords} mode="global" meaningFor={meaningOf} />
          </>
        ) : (
          <>
            <div className="cards-controls">
              <label className="cards-select">
                <span>Chapter</span>
                <select value={lessonNumber} onChange={event => setParams({ chapter: event.target.value })}>
                  {chapters.map(chapter => <option key={chapter.chapter} value={chapter.chapter}>Chapter {chapter.chapter}: {chapter.title.replace(/\*/g, '')}</option>)}
                </select>
              </label>
            </div>
            <LessonDeck key={lessonNumber} lessonNumber={lessonNumber} />
          </>
        )}
      </div>
    </div>
  )
}
