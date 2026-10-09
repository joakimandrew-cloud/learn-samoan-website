/**
 * Practice: sort printed words into the piles a chapter defines (the a-words
 * and o-words of possession, respect and everyday words, one verb form and
 * many). The Tongan site's SorterCore (deck, score, streak, number keys and
 * Enter), fed from chapter data, with piles that fill as the learner sorts:
 * each word answered flies into the pile it belongs in, and a word sorted
 * wrongly still lands in its right pile, marked as missed.
 *
 * data: {
 *   bins:  [{ id, label, sm?, hint? }],   two to four piles, in the chapter's terms
 *   items: [{ sm, en, bin, why }]          a printed word, its printed English,
 *                                          the id of its pile, and why it goes there
 * }
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { DeckComplete, DeckHeader, NextRow } from './Shells.jsx'
import { keepInView, useCardKeys, useDeck, useIsTouchPrimary } from './engine.js'
import { binState, pilesFor, recordPick } from './sort-logic.js'
import '../../styles/ix-sort.css'

const SHOWN = 3 // chips a pile shows while sorting; its count covers the rest
const NO_PICKS = {}
const SETTLE_MS = 300 // a second tap this soon after the card changes is ignored

function Chip({ entry }) {
  return (
    <span className={`ix-sort-chip${entry.missed ? ' is-missed' : ''}`} data-chip={entry.item.key}>
      <T>{entry.item.sm}</T>
      {entry.missed && <span className="visually-hidden"> (missed)</span>}
    </span>
  )
}

export default function Sort({ data }) {
  const bins = data.bins
  const items = useMemo(() => data.items.map((x, i) => ({ ...x, key: i })), [data.items])
  const deck = useDeck(items)
  const cardRef = useRef(null)
  const wordRef = useRef(null)
  const flightRef = useRef(null)
  const focusRef = useRef(null)
  const settleRef = useRef(0)
  const touch = useIsTouchPrimary()
  const still = useReducedMotion()
  const uid = useId()

  // The pile chosen at each place in this round's deck. Going again or
  // resetting deals a new deck, which is a new round with empty piles.
  const [round, setRound] = useState({ deck: null, picks: NO_PICKS })
  const picks = round.deck === deck.deck ? round.picks : NO_PICKS

  const current = deck.current
  const guess = deck.answered ? picks[deck.index] ?? null : null
  const isCorrect = guess !== null && guess === current.bin
  const answerBin = bins.find(b => b.id === current.bin)

  const sorted = deck.finished ? deck.total : deck.index + (deck.answered ? 1 : 0)
  const piles = pilesFor(bins, deck.deck, sorted, picks)

  const holdsFocus = () => {
    const el = document.activeElement
    return Boolean(el && el !== document.body && cardRef.current?.contains(el))
  }
  // A double tap on Next or Go again must not land its second tap on a pile of
  // the new card. Only pointer taps arm and meet this guard (a keyboard
  // click has detail 0), so keys are never slowed.
  const settle = e => { if (e?.detail > 0) settleRef.current = e.timeStamp + SETTLE_MS }
  const tap = (e, binId) => { if (!(e.detail > 0 && e.timeStamp < settleRef.current)) choose(binId) }

  const choose = binId => {
    if (deck.answered || deck.finished) return
    const order = deck.deck
    const at = deck.index
    setRound(r => recordPick(r, order, at, binId))
    deck.mark(binId === current.bin)
    flightRef.current = current.key
    if (holdsFocus()) focusRef.current = 'next'
  }
  const next = e => {
    if (holdsFocus()) focusRef.current = deck.index >= deck.total - 1 ? 'next' : 'word'
    settle(e)
    deck.next()
    keepInView(cardRef)
  }
  const again = e => {
    if (holdsFocus()) focusRef.current = 'word'
    settle(e)
    deck.again()
    keepInView(cardRef)
  }
  const reset = e => {
    // The header's reset stays where it is; "start fresh" goes away.
    if (holdsFocus() && !document.activeElement.closest('.pcs-card-row')) focusRef.current = 'word'
    settle(e)
    deck.reset()
    keepInView(cardRef)
  }
  // The shared header and end card call reset and again on the deck they get.
  const view = { ...deck, reset, again }

  useCardKeys(cardRef, e => {
    if (deck.finished) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); again() }
      return
    }
    if (deck.answered) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next() }
      return
    }
    if (/^[1-9]$/.test(e.key)) {
      const k = Number(e.key)
      if (k <= bins.length) { e.preventDefault(); choose(bins[k - 1].id) }
    }
  })

  // The word just answered flies from the prompt into its pile: its chip is
  // already in place, so it starts at the prompt and eases home before paint.
  useLayoutEffect(() => {
    const key = flightRef.current
    if (key == null) return
    flightRef.current = null
    const chip = cardRef.current?.querySelector(`[data-chip="${key}"]`)
    const word = wordRef.current
    if (still || !chip || !word || typeof chip.animate !== 'function') return
    const a = word.getBoundingClientRect()
    const b = chip.getBoundingClientRect()
    if (!a.height || !b.height) return
    const dx = a.left + a.width / 2 - (b.left + b.width / 2)
    const dy = a.top + a.height / 2 - (b.top + b.height / 2)
    const scale = Math.min(2.4, Math.max(1, a.height / b.height))
    const flight = chip.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: 'none' }],
      { duration: 600, easing: 'cubic-bezier(.45, .05, .2, 1)' },
    )
    return () => flight.finish()
  }, [picks, still])

  // Keyboard users keep their place: after answering, focus moves to Next;
  // after Next or Go again, to the new word, where a screen reader reads it,
  // the number keys still work, and Tab reaches the piles.
  useEffect(() => {
    const want = focusRef.current
    if (!want) return
    focusRef.current = null
    if (want === 'next') cardRef.current?.querySelector('.pcs-next')?.focus()
    else wordRef.current?.closest('.pcs-noun-frame')?.focus({ preventScroll: true })
  })

  // While sorting a pile shows its newest words; at the end, all of them in
  // the order sorted. Its count remounts when it changes, so an arrival bumps it.
  const pile = (b, all) => {
    const list = piles[b.id]
    const shown = all ? [...list].reverse() : list.slice(0, SHOWN)
    return (
      <>
        <span key={`count-${list.length}`} className={`ix-sort-count${list.length ? ' is-full' : ''}${list.length && !all ? ' is-bump' : ''}`}>
          {list.length}<span className="visually-hidden"> sorted</span>
        </span>
        {shown.map(entry => <Chip key={entry.item.key} entry={entry} />)}
        {list.length > shown.length && <span className="ix-sort-more">+{list.length - shown.length}</span>}
      </>
    )
  }

  return (
    <section ref={cardRef} className={`pcs-card ix-sort${deck.answered ? ' is-answered' : ''}`}>
      <DeckHeader deck={view} />
      {deck.finished ? (
        <>
          <DeckComplete deck={view} touch={touch} />
          <div className="ix-sort-review">
            <div className="pcs-question">Your piles</div>
            <div className={`ix-sort-bins is-${bins.length}`} style={{ '--n': bins.length }}>
              {bins.map(b => (
                <div key={b.id} className="ix-sort-bin is-static">
                  <span className="ix-sort-head">
                    <span className="ix-sort-label"><Md text={b.label} /></span>
                    {b.sm && <T className="ix-sort-sm">{b.sm}</T>}
                  </span>
                  <span className="ix-sort-pile">{pile(b, true)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="pcs-noun-frame" tabIndex={-1}>
            <div className="pcs-noun"><span ref={wordRef} className="ix-sort-word"><T>{current.sm}</T></span></div>
            <div className="pcs-noun-gloss">{current.en}</div>
          </div>
          <div className="pcs-question" id={`${uid}-q`}>Which pile does it go in?</div>
          <div className={`ix-sort-bins is-${bins.length}`} style={{ '--n': bins.length }} role="group" aria-labelledby={`${uid}-q`}>
            {bins.map((b, i) => {
              const state = binState(b.id, { answered: deck.answered, guess, answer: current.bin })
              const at = `${uid}-${i}`
              return (
                <button
                  key={b.id}
                  type="button"
                  className={`ix-sort-bin${state ? ` ${state}` : ''}`}
                  onClick={e => tap(e, b.id)}
                  disabled={deck.answered}
                  aria-labelledby={b.sm ? `${at}-l ${at}-s` : `${at}-l`}
                  aria-describedby={b.hint ? `${at}-h ${at}-p` : `${at}-p`}
                >
                  {!touch && !deck.answered && <span className="ix-sort-key" aria-hidden="true">{i + 1}</span>}
                  <span className="ix-sort-head">
                    <span className="ix-sort-label" id={`${at}-l`}><Md text={b.label} /></span>
                    {b.sm && <T className="ix-sort-sm" id={`${at}-s`}>{b.sm}</T>}
                    {b.hint && <span className="ix-sort-hint" id={`${at}-h`}><Md text={b.hint} /></span>}
                  </span>
                  <span className="ix-sort-pile" id={`${at}-p`}>{pile(b, false)}</span>
                </button>
              )
            })}
          </div>
          <div className={`ix-sort-feedback${deck.answered ? (isCorrect ? ' is-right' : ' is-wrong') : ''}`} role="status">
            {deck.answered && (
              <>
                <span className="pcs-btn-feedback-icon" aria-hidden="true">{isCorrect ? '✓' : '✕'}</span>
                <span className="pcs-btn-feedback-body">
                  <span className="pcs-btn-verdict">{isCorrect ? 'That’s right.' : <>It goes in <Md text={answerBin.label} />.</>}</span>
                  <span className="pcs-btn-why"><Md text={current.why} /></span>
                </span>
              </>
            )}
          </div>
          {deck.answered && <NextRow onNext={next} touch={touch} />}
        </>
      )}
    </section>
  )
}
