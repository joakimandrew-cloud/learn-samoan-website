import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useIsTouchPrimary } from '../components/interactive/engine.js'
import T, { Inline } from '../components/T.jsx'
import { useTitle } from '../lib/title.js'
import { STATIC_META } from '@app/seo/meta.js'
import {
  CHAPTERS, chapterEntry, nextChapter,
  makeRound, makeTiles, capitalFirst, sentenceText,
  gameReducer, initialGame, isFrozen, finishedCount,
  loadProgress, saveProgress, progressAfter, startingChapter, chapterBag, dealFromChapter,
} from '@app/games/sentence-tiles/index.js'
import { HOW_TO, ORDER_NOTE, OFF_ORDER_HEAD, OFF_ORDER_LABEL } from '@app/games/sentence-tiles/copy.js'
import { makeRng } from '@app/games/shared/fair.js'
import { multiplierFor } from '@app/games/shared/scoring.js'
import { readStore, writeStore } from '@app/games/shared/store.js'
import { readBests, bestOf, recordBest } from '@app/games/shared/best-scores.js'
import { unlock, play } from '@app/games/shared/sound.js'
import { Sky, Ground, Confetti, Flame, PauseIcon, SoundIcon } from '@app/games/word-balloons/scene.jsx'
import '../styles/source-core.css'
import '../styles/word-balloons.css'
import '../styles/sentence-tiles.css'

/**
 * Sentence Tiles at /games/sentence-tiles. An English sentence from the book's
 * exercises shows; below it, the Sāmoan words of the book's own answer as
 * shuffled tiles. Tap the tiles into the answer line in order. There is no
 * clock: a sentence stays until it is built. There are no lives.
 *
 * The game marks against the order the book prints, and says so. A tap the
 * game does not accept is "not the book's order", shown with the book's
 * sentence; it is not a wrong sentence, so the tile takes no error colour and
 * no miss sound plays. The end card counts these as "Taps off the book's
 * order". An `accept` list on an exercise item would add orders (deck.js).
 *
 * One game is one chapter. A new player starts at the first chapter that has a
 * game; the chapter's sentences come once each, in a shuffled order, and the
 * finish card offers the next chapter. The furthest chapter reached is kept on
 * this device (chapters.js), so a return visit opens there; the title screen's
 * grid starts any chapter that has a game.
 *
 * Help: Fill in (or H) places the next word for the player, the same way a
 * right tap would; a filled word shows lighter and scores nothing.
 *
 * The look is Word Balloons' own (word-balloons.css): the sky, the HUD, the
 * mute button, the sheets and the end card; sentence-tiles.css adds the prompt,
 * the answer line and the tiles. The pure rules live in src/games/sentence-tiles/
 * (deck, rounds, reducer, all tested) and reuse the shared game code (score,
 * streak, bag, sound, best scores). Every word shown is read from
 * src/data/book-exercises.json; nothing is typed or composed here.
 */

const DONE_MS = 1300
const NEXT_MS = 260
// The "Chapter N" banner shows this long before the chapter's first sentence (its ribbon animation's length).
const START_MS = 1800

const MUTE_KEY = 'ls-sentence-tiles-muted'
// Best scores by chapter ({ "chapter:N": { score, level } }, level holding the chapter number).
const BEST_KEY = 'ls-sentence-tiles-best'

function readMuted() { return readStore(MUTE_KEY) === '1' }

// ── reduced motion (read live) ─────────────────────────────────────────
const REDUCED = '(prefers-reduced-motion: reduce)'
function subscribeReduced(cb) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener?.('change', cb)
  return () => mq.removeEventListener?.('change', cb)
}
function getReduced() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED).matches
}
function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false)
}

/** A number that counts up to its value instead of jumping. */
function TickNumber({ value, className, instant }) {
  const ref = useRef(null)
  const shown = useRef(value)
  const [first] = useState(value)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    const to = value
    if (instant || from === to || to < from) {
      shown.current = to
      el.textContent = String(to)
      return
    }
    const start = performance.now()
    let raf = 0
    const step = (now) => {
      const t = Math.min(1, (now - start) / 420)
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))
      shown.current = v
      el.textContent = String(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, instant])
  return <span ref={ref} className={className}>{first}</span>
}

// A tap off the book's order nudges the tile sideways, in the tile's own colours: no error colour, no sound.
const NUDGE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
]

export default function SentenceTiles() {
  useTitle(STATIC_META['/games/sentence-tiles'].title)
  const [progress, setProgress] = useState(loadProgress)
  // The chapter the title screen offers: the furthest reached (the first for a new player), or the one tapped in the grid.
  const [chapterNo, setChapterNo] = useState(() => startingChapter(progress))
  const [muted, setMutedState] = useState(readMuted)
  const [bests, setBests] = useState(() => readBests(BEST_KEY))
  const [result, setResult] = useState(null) // { newBest, best }
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => initialGame())
  // Every action carries the time it was sent (the tap lockouts read it).
  const dispatch = useCallback((action) => rawDispatch({ ...action, now: performance.now() }), [])
  const isTouch = useIsTouchPrimary()
  const reduced = useReducedMotion()

  const choice = useMemo(() => chapterEntry(chapterNo), [chapterNo])
  const best = bestOf(bests, choice.id)

  // The title screen's tiles: a real sentence of the chosen chapter, new on each visit.
  const [titleSeed] = useState(() => Date.now())
  const titleSample = useMemo(() => {
    const rng = makeRng(titleSeed)
    const s = choice.cards[Math.floor(rng() * choice.cards.length)]
    return s ? { sentence: s, tiles: makeTiles(s, rng) } : null
  }, [choice, titleSeed])

  const { phase, paused, round, score, streak, correct } = state
  const frozen = isFrozen(state)
  const mult = multiplierFor(streak)
  const inGame = phase === 'playing'
  // The chapter being played (in a game or on its end card), else the one the title offers.
  const shownChapter = state.chapter ?? choice.chapter
  const played = chapterEntry(shownChapter)
  const after = nextChapter(shownChapter)
  const finished = finishedCount(state)

  const stateRef = useRef(state)
  const settingsRef = useRef({ choice, bests, muted })
  useEffect(() => { stateRef.current = state })
  useEffect(() => { settingsRef.current = { choice, bests, muted } })

  const bagRef = useRef(null)
  // The sentence the last game ended on, so playing the chapter again does not open with it.
  const lastRef = useRef(null)

  const sound = useCallback((name, ...args) => {
    if (!settingsRef.current.muted) play(name, ...args)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !settingsRef.current.muted
    writeStore(MUTE_KEY, next ? '1' : '0')
    if (!next) unlock()
    settingsRef.current = { ...settingsRef.current, muted: next }
    setMutedState(next)
  }, [])

  // Starts a game of one chapter (no countdown: nothing in this game is timed).
  const start = useCallback((chapter) => {
    if (!settingsRef.current.muted) unlock()
    const entry = chapterEntry(chapter ?? settingsRef.current.choice.chapter)
    setResult(null)
    setChapterNo(entry.chapter)
    bagRef.current = chapterBag(entry.chapter, Math.random, { last: lastRef.current })
    dispatch({ type: 'start', chapter: entry.chapter, total: entry.count })
  }, [dispatch])

  // ── the next sentence: the chapter's bag, a beat after the last one ────
  const deal = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || s.paused || s.round || !bagRef.current) return
    const { sentence, bag } = dealFromChapter(bagRef.current, Math.random)
    if (!sentence) return
    bagRef.current = bag
    lastRef.current = sentence.id
    dispatch({ type: 'deal', round: makeRound(sentence, Math.random) })
  }, [dispatch])

  useEffect(() => {
    if (phase !== 'playing' || paused || round) return
    const t = window.setTimeout(deal, state.nextKey === 1 ? START_MS : NEXT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, round, state.nextKey, deal])

  // A finished sentence holds a moment, then the next comes (or the finish card).
  const status = round?.status ?? null
  const roundKey = round?.key ?? null
  useEffect(() => {
    if (paused || status !== 'done') return
    const t = window.setTimeout(() => dispatch({ type: 'next' }), DONE_MS)
    return () => window.clearTimeout(t)
  }, [status, roundKey, paused, dispatch])

  // The chapter is finished: keep its best score, mark it done, and move the title screen on to the next chapter.
  const recorded = useRef(0)
  useEffect(() => {
    if (phase !== 'over' || recorded.current === state.gameId || state.chapter == null) return
    recorded.current = state.gameId
    const { bests: all } = settingsRef.current
    const { next, newBest, prev } = recordBest(BEST_KEY, all, chapterEntry(state.chapter).id, { score: state.score, level: state.chapter })
    setBests(next)
    setResult({ newBest, best: prev })
    setProgress(p => {
      const np = progressAfter(p, state.chapter)
      saveProgress(np)
      return np
    })
    setChapterNo(nextChapter(state.chapter) ?? state.chapter)
  }, [phase, state.gameId, state.score, state.chapter])

  // ── sound and the nudge follow the state ───────────────────────────
  const sceneRef = useRef(null)
  const tileEls = useRef(new Map())
  const placedCount = round?.placed.length ?? 0
  const seen = useRef({ gameId: 0, correct: 0, helped: 0, offOrderTaps: 0, phase: 'title', placed: 0, key: null })
  useEffect(() => {
    let s = seen.current
    if (state.gameId !== s.gameId) s = { gameId: state.gameId, correct: 0, helped: 0, offOrderTaps: 0, phase: 'title', placed: 0, key: null }
    const sameRound = s.key === roundKey
    if (phase === 'playing' && s.phase !== 'playing') sound('tick', true)
    // A finished sentence chimes once; each right tile pops.
    if (correct > s.correct || state.helped > s.helped) sound('chime')
    else if (sameRound && placedCount > s.placed) sound('pop', 1)
    if (state.offOrderTaps > s.offOrderTaps) {
      // Not the book's order is not a mistake: no miss sound, no vibration, no error colour.
      // The tile only nudges sideways (not at all under reduced motion).
      const el = round?.off ? tileEls.current.get(round.off.slot) : null
      if (el && !reduced && typeof el.animate === 'function') el.animate(NUDGE, { duration: 340, easing: 'ease-out', composite: 'add' })
    }
    seen.current = {
      gameId: state.gameId, correct, helped: state.helped, offOrderTaps: state.offOrderTaps, phase, placed: placedCount, key: roundKey,
    }
  }, [phase, state.gameId, state.offOrderTaps, state.helped, correct, placedCount, roundKey, round, reduced, sound])

  // ── input ────────────────────────────────────────────────────────────
  const pick = useCallback((slot) => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'pick', key: r.key, slot })
  }, [dispatch])

  // Fill in: the next word goes into the line for the player (scores nothing).
  const fill = useCallback(() => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'fill', key: r.key })
  }, [dispatch])

  // A tile picked from the keyboard leaves the tray; the focus moves on to the nearest tile left.
  const trayRef = useRef(null)
  const focusTile = useCallback((fromSlot, dir = 1) => {
    const tray = trayRef.current
    if (!tray) return
    const buttons = [...tray.querySelectorAll('button[data-slot]:not(:disabled)')]
    if (!buttons.length) return
    const slots = buttons.map(b => Number(b.dataset.slot))
    let i
    if (fromSlot == null) i = dir > 0 ? 0 : buttons.length - 1
    else {
      const after = slots.findIndex(x => (dir > 0 ? x > fromSlot : x >= fromSlot))
      i = dir > 0 ? (after < 0 ? 0 : after) : (after <= 0 ? buttons.length - 1 : after - 1)
    }
    buttons[i]?.focus({ preventScroll: true })
  }, [])
  const keyPicked = useRef(null)
  const pickByKey = useCallback((slot) => {
    const focused = document.activeElement?.dataset?.slot
    keyPicked.current = focused != null && Number(focused) === slot ? slot : null
    pick(slot)
  }, [pick])
  // After a keyboard pick lands, move the focus off the tile that left.
  useEffect(() => {
    const slot = keyPicked.current
    if (slot == null || !round) return
    if (round.placed.includes(slot)) {
      keyPicked.current = null
      window.requestAnimationFrame(() => focusTile(slot, 1))
    }
  }, [round, focusTile])

  const togglePause = useCallback(() => {
    const s = stateRef.current
    dispatch({ type: s.paused ? 'resume' : 'pause' })
  }, [dispatch])

  // ── the chapter grid on the title screen ────────────────────────────
  // Tapping a chapter only selects it: the saved starting chapter moves when a chapter is finished, never when one is chosen.
  const gridRef = useRef(null)
  const chooseChapter = useCallback((n) => { setChapterNo(n) }, [])
  // Keeps the selected chapter in view inside the grid's own scroll box (the page itself never scrolls).
  const showSelected = useCallback(() => {
    const box = gridRef.current
    const el = box?.querySelector('[aria-checked="true"]')
    if (!box || !el) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop) box.scrollTop = top
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top + el.offsetHeight - box.clientHeight
  }, [])
  useLayoutEffect(() => { if (phase === 'title') showSelected() }, [phase, chapterNo, showSelected])
  // Arrows move the selection (and the focus with it); Enter plays it.
  const moveChapter = useCallback((key) => {
    const box = gridRef.current
    const cols = box ? (getComputedStyle(box).gridTemplateColumns.split(' ').length || 1) : 1
    const step = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : key === 'ArrowUp' ? -cols : cols
    const at = Math.max(0, CHAPTERS.findIndex(c => c.chapter === settingsRef.current.choice.chapter))
    const to = CHAPTERS[Math.min(CHAPTERS.length - 1, Math.max(0, at + step))]
    setChapterNo(to.chapter)
    window.requestAnimationFrame(() => box?.querySelector(`[data-chapter="${to.chapter}"]`)?.focus({ preventScroll: true }))
  }, [])

  // Keys: 1-8 pick a tile, arrows move between tiles and Enter picks the one
  // in focus; Space or P (Escape too) pauses; Enter plays on the title, and
  // on the end card plays the next chapter (or the last one again).
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = stateRef.current
      if (s.phase === 'playing') {
        if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault()
          if (!e.repeat) togglePause()
          return
        }
        const r = s.round
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault()
          // A held key repeats; only the first press fills.
          if (!e.repeat) fill()
          return
        }
        const n = Number(e.key)
        if (r && Number.isInteger(n) && n >= 1 && n <= r.tiles.length) {
          e.preventDefault()
          // A held key repeats; only the first press picks.
          if (!e.repeat) pickByKey(n - 1)
          return
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
          const focused = document.activeElement?.dataset?.slot
          focusTile(focused != null ? Number(focused) : null, dir)
          return
        }
        if (e.key === 'Enter') {
          // Handled here, never as a button click, so a held Enter picks once.
          e.preventDefault()
          if (e.repeat) return
          const focused = document.activeElement?.dataset?.slot
          if (focused != null) pickByKey(Number(focused))
          else focusTile(null, 1)
        }
      } else if (s.phase === 'title' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        moveChapter(e.key)
      } else if (e.key === 'Enter' && (e.target?.closest?.('.tiles-chapter-grid') || (tag !== 'BUTTON' && tag !== 'A'))) {
        e.preventDefault()
        start(s.phase === 'over' && s.chapter != null ? (nextChapter(s.chapter) ?? s.chapter) : undefined)
      }
    }
    const onKeyUp = (e) => {
      const s = stateRef.current
      if (e.key === ' ' && s.phase === 'playing' && e.target?.tagName === 'BUTTON') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [pickByKey, focusTile, fill, start, togglePause, moveChapter])

  // ── render ───────────────────────────────────────────────────────────
  // The sky deepens as the chapters go on (one step every 8 chapters).
  const sky = Math.min(7, Math.max(1, 1 + Math.floor(((shownChapter ?? 1) - 1) / 8)))
  const sentence = round?.sentence ?? null
  const byText = round ? new Map(round.tiles.map(t => [t.slot, t])) : null
  const placedWords = round ? round.placed.map(slot => byText.get(slot).text) : []
  const filledAt = new Set(round?.filled ?? [])
  const lineWords = sentence
    ? sentence.words.map((w, i) => (
      i < placedWords.length
        ? { text: i === 0 && sentence.capital ? capitalFirst(placedWords[i]) : placedWords[i], kind: filledAt.has(i) ? 'placed is-filled' : 'placed' }
        : { text: '', kind: 'empty' }
    ))
    : []
  const filledCount = filledAt.size
  const offNotice = !!round?.off && round.status === 'building' && round.off.placedAt === round.placed.length

  return (
    <section className={`source-drill-shell rain-shell is-${phase}`} data-game="sentence-tiles">
      <div className="premium-core word-rain sentence-tiles">
        <div className="rain-bar">
          <Link to="/games" className="x-frame-back">{'←'} All games</Link>
          <span className="rain-bar-tag">Game · Book sentences</span>
        </div>

        <div
          ref={sceneRef}
          className={`rain-scene rain-sky-${sky}${paused && inGame ? ' is-paused is-frozen' : ''}`}
          data-phase={phase}
          data-chapter={shownChapter ?? ''}
          data-status={status ?? ''}
          data-item={sentence?.id ?? ''}
          data-key={roundKey ?? ''}
        >
          <Sky rate={1 + 0.3 * (sky - 1)} />

          <div className="rain-top">
            {inGame ? (
              <div className="rain-hud" data-score={score} data-streak={streak} data-mult={mult} data-chapter={state.chapter ?? ''} data-done={finished} data-total={state.total} data-off-order={state.offOrderTaps}>
                <div className="rain-hud-left">
                  <span className="rain-pill rain-score-pill">
                    <span className="rain-pill-label">Score</span>
                    <TickNumber value={score} className="rain-score" instant={reduced} />
                  </span>
                </div>
                <div className="rain-hud-mid">
                  <span className="rain-pill rain-level-pill tiles-chapter-pill" aria-label={`Chapter ${state.chapter}, ${finished} of ${state.total} sentences done`}>
                    <span className="rain-pill-label">Chapter</span>
                    <span className="rain-level">{state.chapter}</span>
                    <span className="rain-level-track" aria-hidden="true">
                      {Array.from({ length: state.total }, (_, i) => (
                        <i key={i} className={i < finished ? 'is-on' : ''} />
                      ))}
                    </span>
                  </span>
                </div>
                <span
                  key={mult}
                  className={`rain-streak${streak >= 2 ? ' is-on' : ''} mult-${mult}`}
                  role="img"
                  aria-label={streak >= 2 ? `${streak} in a row${mult > 1 ? `, points times ${mult}` : ''}` : 'No streak'}
                >
                  <Flame />
                  <b className="rain-mult">{mult > 1 ? `×${mult}` : streak}</b>
                  <span className="rain-streak-label">{streak} in a row</span>
                </span>
                <div className="rain-hud-right">
                  <button type="button" className="rain-icon-btn rain-pause" onClick={togglePause} aria-pressed={paused} aria-label={paused ? 'Resume' : 'Pause'}>
                    <PauseIcon paused={paused} />
                  </button>
                  <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                    <SoundIcon muted={muted} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rain-top-title">
                <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                  <SoundIcon muted={muted} />
                </button>
              </div>
            )}
          </div>

          <div className="rain-field tiles-field">
            {phase === 'title' && (
              <div className="rain-title-block">
                {titleSample && (
                  <div className="tiles-idle" aria-hidden="true">
                    {titleSample.tiles.map((t, i) => (
                      <span key={t.slot} className="tiles-tile tiles-idle-tile" style={{ '--i': i }}>
                        <T className="font-samoan" >{t.text}</T>
                      </span>
                    ))}
                  </div>
                )}
                <div className="rain-eyebrow">A sentence game</div>
                <h1 className="rain-title">Sentence Tiles</h1>
                <p className="rain-tagline">Put the words in the book’s order.</p>
                <p className="tiles-howto">{HOW_TO}</p>
              </div>
            )}

            {phase === 'playing' && (
              <div className="tiles-board">
                {sentence && (
                  <div className={`tiles-card is-${status}`} key={roundKey}>
                    <p className="tiles-prompt"><Inline text={sentence.prompt} tClass="font-samoan" /></p>
                    <div className="tiles-line" aria-label="Your answer" data-placed={placedWords.length} data-filled={filledCount}>
                      {lineWords.map((w, i) => (
                        <span key={i} className="tiles-cell">
                          <span className={`tiles-slot is-${w.kind}`}>
                            {w.text ? <T className="font-samoan">{w.text}</T> : <span className="tiles-slot-gap" />}
                          </span>
                        </span>
                      ))}
                      {sentence.end && <span className="tiles-end" aria-hidden="true">{sentence.end}</span>}
                    </div>
                    {offNotice && (
                      <p className="tiles-off" role="status" data-off={round.off.n}>
                        <strong>{OFF_ORDER_HEAD}.</strong>{' '}
                        The book prints <T className="font-samoan">{sentenceText(sentence)}</T>
                        <span className="tiles-off-note"> {ORDER_NOTE}</span>
                      </p>
                    )}
                    {status === 'done' && (
                      <span className="rain-gain tiles-gain" data-gain={round.gain}>
                        +{round.gain}
                        {filledCount > 0
                          ? <small> {filledCount} filled</small>
                          : round.mult > 1 && <small> ×{round.mult}</small>}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {inGame && !round && state.nextKey === 1 && !paused && (
              <div className="rain-banner tiles-start-banner" key={`start-${state.gameId}`} role="status">
                <span className="rain-banner-ribbon">
                  <span className="rain-banner-title">Chapter {state.chapter}</span>
                  <span className="rain-banner-sub">{state.total === 1 ? '1 sentence' : `${state.total} sentences`}</span>
                </span>
              </div>
            )}

            {paused && inGame && (
              <div className="rain-paused">
                <div className="rain-paused-title">Paused</div>
                <button type="button" className="rain-btn rain-btn-primary" onClick={() => dispatch({ type: 'resume' })}>Resume</button>
                <button type="button" className="rain-btn rain-btn-quiet" onClick={() => dispatch({ type: 'quit' })}>End game</button>
              </div>
            )}
          </div>

          <Ground />

          {phase === 'title' && (
            <div className="rain-tray rain-setup tiles-setup">
              <h2 className="tiles-choose" id="tiles-choose">Choose a chapter</h2>
              <ul className="rain-menu-list tiles-chapter-grid" role="radiogroup" aria-labelledby="tiles-choose" ref={gridRef}>
                {CHAPTERS.map(c => {
                  const isDone = progress.done.includes(c.chapter)
                  const on = choice.chapter === c.chapter
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${c.label}, ${c.count} sentences${isDone ? ', finished' : ''}`}
                        className={`rain-menu-item${on ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                        data-chapter={c.chapter}
                        data-count={c.count}
                        onClick={() => chooseChapter(c.chapter)}
                      >
                        <span className="rain-menu-name">{c.label}{isDone && <span className="tiles-chapter-done" aria-hidden="true">✓</span>}</span>
                        <span className="rain-menu-count">{c.count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="rain-go-col">
                <button type="button" className="rain-btn rain-btn-primary rain-play" data-chapter={choice.chapter} onClick={() => start(choice.chapter)}>Play Chapter {choice.chapter}</button>
                <div className="rain-best" data-best={best.score}>
                  {best.score > 0
                    ? <>Best <b>{best.score}</b> for this chapter</>
                    : <>No best score yet for this chapter</>}
                </div>
                {!isTouch && (
                  <span className="rain-keys">
                    Arrows choose a chapter, <kbd>Enter</kbd> plays · <kbd>1</kbd>–<kbd>8</kbd> pick a tile · <kbd>H</kbd> fills in a word · <kbd>Space</kbd> pauses
                  </span>
                )}
              </div>
            </div>
          )}

          {inGame && (
            <div className={`rain-tray tiles-tray${status === 'building' ? ' is-live' : ''}`} ref={trayRef}>
              <div className="tiles-helps">
                <button
                  type="button"
                  className="rain-chip tiles-fill"
                  onClick={fill}
                  disabled={status !== 'building' || frozen}
                  aria-label="Fill in the next word (it scores nothing)"
                >
                  Fill in{!isTouch && <kbd>H</kbd>}
                </button>
              </div>
              <div className="tiles-set" role="group" aria-label="Tiles">
              {round
                ? round.tiles.map(t => {
                  const used = round.placed.includes(t.slot)
                  if (used) {
                    return (
                      <span key={`${roundKey}-${t.slot}`} className="tiles-tile is-used" aria-hidden="true">
                        <T className="font-samoan">{t.text}</T>
                      </span>
                    )
                  }
                  return (
                    <button
                      key={`${roundKey}-${t.slot}`}
                      ref={el => { if (el) tileEls.current.set(t.slot, el); else tileEls.current.delete(t.slot) }}
                      type="button"
                      className="tiles-tile"
                      data-slot={t.slot}
                     
                      disabled={status !== 'building' || frozen}
                      onClick={() => pick(t.slot)}
                    >
                      {!isTouch && <span className="rain-opt-key" aria-hidden="true">{t.slot + 1}</span>}
                      <T className="font-samoan">{t.text}</T>
                    </button>
                  )
                })
                : <span className="tiles-tile is-waiting" aria-hidden="true">&nbsp;</span>}
              </div>
            </div>
          )}

          {phase === 'over' && (
            <div className="rain-over-wrap">
              <section className={`rain-over${result?.newBest ? ' is-new-best' : ''}`} aria-labelledby="tiles-over-title">
                {result?.newBest && !reduced && <Confetti seed={state.gameId} />}
                <div className="rain-over-label" id="tiles-over-title">Chapter {state.chapter} done</div>
                {result?.newBest && <div className="rain-new-best">New best!</div>}
                <div className="rain-final" data-score={score}>
                  <span className="rain-final-num">{score}</span>
                  <span className="rain-final-unit">points</span>
                </div>
                <dl className="rain-stats">
                  <div><dt>Sentences</dt><dd>{correct}</dd></div>
                  <div><dt>Longest streak</dt><dd>{state.bestStreak}</dd></div>
                  <div><dt>{OFF_ORDER_LABEL}</dt><dd>{state.offOrderTaps}</dd></div>
                </dl>
                {state.helped > 0 && (
                  <div className="rain-over-best tiles-over-helped">
                    {state.helped === 1 ? '1 more sentence' : `${state.helped} more sentences`} finished with filled-in words ({state.filledWords} filled)
                  </div>
                )}
                {!result?.newBest && <div className="rain-over-best">Your best for {played.label}: {bestOf(bests, played.id).score}</div>}
                {after == null && <div className="rain-over-best tiles-over-last">That was the last chapter with a game.</div>}
                {state.missed.length > 0 && (
                  <div className="rain-missed">
                    <div className="rain-setting-label">Sentences to look at again</div>
                    <ul className="rain-missed-list">
                      {state.missed.map(s => (
                        <li key={s.id} className="rain-missed-row tiles-missed-row">
                          <span className="rain-missed-en"><Inline text={s.prompt} tClass="font-samoan" /></span>
                          <T className="font-samoan rain-missed-to">{sentenceText(s)}</T>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rain-over-actions">
                  {after != null
                    ? <button type="button" className="rain-btn rain-btn-primary rain-again tiles-next" data-chapter={after} onClick={() => start(after)}>Next: Chapter {after}</button>
                    : <button type="button" className="rain-btn rain-btn-primary rain-again" data-chapter={shownChapter} onClick={() => start(shownChapter)}>Play again</button>}
                  <div className="rain-over-links">
                    {after != null && <button type="button" className="rain-btn rain-btn-quiet tiles-replay" data-chapter={shownChapter} onClick={() => start(shownChapter)}>Play Chapter {shownChapter} again</button>}
                    <button type="button" className="rain-btn rain-btn-quiet tiles-pick" onClick={() => dispatch({ type: 'quit' })}>Pick a chapter</button>
                    <Link to="/games" className="rain-btn rain-btn-quiet">All games</Link>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
