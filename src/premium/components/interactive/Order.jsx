/**
 * Practice: build the Samoan for an English sentence by tapping its words
 * into order. The Tongan site's tile builders (SentenceBuilderCore and
 * AdjectiveFlipCore: a dashed answer row over a pool of word tiles, some of
 * them traps) on the chapter deck, fed from chapter data. The checking lives
 * in order-logic.js.
 *
 * data: {
 *   prompt?,   the label over the English (default "Say this in Samoan")
 *   items: [{
 *     en,       the printed English to say
 *     sm,       the printed Samoan sentence
 *     tiles?,   its tiles in order, when one tile should hold several words
 *     extra?,   printed words that do not belong, mixed into the pool
 *     accept?,  other printed sentences that are also right
 *     why,      shown once the card is checked
 *   }]
 * }
 */
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { DeckComplete, DeckHeader, NextRow } from './Shells.jsx'
import { changedWords, keepInView, shuffle, useCardKeys, useDeck, useIsTouchPrimary } from './engine.js'
import { checkOrder, finalStop, shuffledPool, targetTiles } from './order-logic.js'
import '../../styles/ix-order.css'

// A fresh shuffle of every card's pool, once per pass through the deck.
const freshPools = items => Object.fromEntries(items.map(x => [x.key, shuffledPool(x, shuffle)]))
// A tile flies between the pool and the answer row; under reduced motion
// (MotionConfig reducedMotion="user" at the root) it simply lands.
const FLIGHT = { duration: .3, ease: [.16, 1, .3, 1] }

export default function Order({ data }) {
  const items = useMemo(() => (data.items || []).map((x, i) => ({ ...x, key: i, tiles: targetTiles(x) })), [data.items])
  const deck = useDeck(items)
  const [pools, setPools] = useState(() => freshPools(items))
  const [placed, setPlaced] = useState([])
  const [pass, setPass] = useState(0)
  const cardRef = useRef(null)
  // Where keyboard focus goes after the render a control's own click causes.
  const focusNext = useRef(null)
  // The last pointer tap on a tile, to tell a double tap from two taps.
  const lastTap = useRef({ at: -Infinity, x: 0, y: 0 })
  const touch = useIsTouchPrimary()
  const uid = useId()

  const current = deck.current
  const pool = (current && pools[current.key]) || []
  const byId = new Map(pool.map(t => [t.id, t]))
  const placedTiles = placed.map(id => byId.get(id)).filter(Boolean)
  const placedTexts = placedTiles.map(t => t.text)
  const answered = deck.answered
  const right = answered && deck.marked === true
  const shown = answered ? checkOrder(current, placedTexts).shown : placedTexts
  const stop = current ? finalStop(current.sm) : ''
  const prompt = data.prompt || 'Say this in Samoan'
  // Cards reuse tile ids, so a flight is named for this widget, pass and card.
  const flightId = id => `${uid}-${pass}-${deck.index}-${id}`
  const byKeyboard = event => event?.detail === 0
  // A tile that leaves a spot is replaced there at once, by the tile sliding
  // in behind it or by itself flying back to the pool. A second tap on the
  // same spot within a moment is the same tap, so it does nothing.
  const sameTap = event => {
    if (!event || byKeyboard(event)) return false
    const { timeStamp: at, clientX: x, clientY: y } = event
    const last = lastTap.current
    if (at - last.at < 350 && Math.abs(x - last.x) < 24 && Math.abs(y - last.y) < 24) return true
    lastTap.current = { at, x, y }
    return false
  }

  const place = (id, event) => {
    if (answered || placed.includes(id) || sameTap(event)) return
    setPlaced(p => (p.includes(id) ? p : [...p, id]))
    if (byKeyboard(event)) focusNext.current = { to: 'pool-after', id }
  }
  const takeBack = (id, event) => {
    if (answered || sameTap(event)) return
    setPlaced(p => p.filter(x => x !== id))
    if (byKeyboard(event)) focusNext.current = { to: 'placed-at', index: placed.indexOf(id), id }
  }
  const takeBackLast = () => {
    if (!answered) setPlaced(p => p.slice(0, -1))
  }
  const clear = event => {
    if (answered) return
    setPlaced([])
    if (byKeyboard(event)) focusNext.current = { to: 'pool-first' }
  }
  const check = event => {
    if (answered || !placed.length) return
    deck.mark(checkOrder(current, placedTexts).right)
    if (byKeyboard(event)) focusNext.current = { to: 'next' }
  }
  const next = event => {
    const last = deck.index >= deck.total - 1
    deck.next()
    setPlaced([])
    if (byKeyboard(event)) focusNext.current = { to: last ? 'again' : 'prompt' }
    keepInView(cardRef)
  }
  // Going again or starting fresh deals a new deck: new pools, empty answer.
  const startOver = deal => event => {
    deal()
    setPools(freshPools(items))
    setPlaced([])
    setPass(n => n + 1)
    if (byKeyboard(event)) focusNext.current = { to: 'prompt' }
    keepInView(cardRef)
  }
  const ui = { ...deck, again: startOver(deck.again), reset: startOver(deck.reset) }

  useCardKeys(cardRef, e => {
    // A link or button elsewhere on the page keeps its own keys.
    const target = e.target
    if (target instanceof Element && !cardRef.current?.contains(target) && target.closest('a, button, summary, [role="button"]')) return
    if (e.key === 'Enter' && e.repeat) return
    if (deck.finished) {
      if (e.key === 'Enter') { e.preventDefault(); ui.again() }
      return
    }
    if (answered) {
      if (e.key === 'Enter') { e.preventDefault(); next() }
      return
    }
    if (/^[1-9]$/.test(e.key)) {
      const tile = pool[Number(e.key) - 1]
      if (tile && !placed.includes(tile.id)) { e.preventDefault(); place(tile.id) }
      return
    }
    if (e.key === 'Backspace' && placed.length) { e.preventDefault(); takeBackLast(); return }
    if (e.key === 'Enter' && placed.length) { e.preventDefault(); check() }
  })

  useEffect(() => {
    const intent = focusNext.current
    const card = cardRef.current
    if (!intent || !card) return
    focusNext.current = null
    const enabled = el => el && !el.disabled
    let el = null
    if (intent.to === 'pool-after') {
      const tiles = [...card.querySelectorAll('[data-pool-tile]')]
      const at = tiles.findIndex(t => t.dataset.poolTile === intent.id)
      el = tiles.slice(at + 1).find(enabled) || tiles.slice(0, Math.max(at, 0)).reverse().find(enabled) || card.querySelector('[data-ix-check]')
    } else if (intent.to === 'placed-at') {
      const chips = [...card.querySelectorAll('[data-placed]')]
      el = chips[intent.index] || chips[intent.index - 1] || card.querySelector(`[data-pool-tile="${intent.id}"]`)
    } else if (intent.to === 'pool-first') {
      el = [...card.querySelectorAll('[data-pool-tile]')].find(enabled)
    } else if (intent.to === 'next') {
      el = card.querySelector('.ix-order-next .pcs-next')
    } else if (intent.to === 'again') {
      el = card.querySelector('.pcs-end-row .pcs-next')
    } else if (intent.to === 'prompt') {
      el = card.querySelector('[data-ix-prompt]')
    }
    el?.focus({ preventScroll: intent.to === 'prompt' })
  })

  if (!current) return null

  const status = answered
    ? (right
      ? <>That’s right. <Md text={current.why} /></>
      : <>Not quite. The chapter’s sentence: <T>{current.sm}</T> <Md text={current.why} /></>)
    : placedTexts.length
      ? <>Your sentence: <T>{placedTexts.join(' ')}</T></>
      : `${deck.index + 1} of ${deck.total}. ${String(prompt).replace(/\*/g, '')}: ${current.en}`

  return (
    <section ref={cardRef} className={`pcs-card ix-order${answered ? ' is-answered' : ''}`}>
      <DeckHeader deck={ui} />
      {deck.finished ? <DeckComplete deck={ui} touch={touch} /> : (
        <>
          <div className="pcs-prompt-label ix-order-label"><Md text={prompt} /></div>
          <p className="ix-order-en" tabIndex={-1} data-ix-prompt="">{current.en}</p>

          <div className={`afl-answer-row ix-order-answer${answered ? (right ? ' is-right' : ' is-wrong') : ''}`} role="group" aria-labelledby={`${uid}-answer`}>
            <span className="afl-answer-label" id={`${uid}-answer`}>Your sentence</span>
            {placedTiles.length === 0 && <span className="afl-answer-placeholder ix-order-placeholder">Tap the words below in order.</span>}
            {placedTiles.map((tile, i) => (
              <Motion.button
                key={tile.id}
                layoutId={flightId(tile.id)}
                layout="position"
                transition={FLIGHT}
                type="button"
                className={`afl-tile ix-order-tile${answered ? (right ? ' is-correct' : ' is-wrong') : ''}`}
                onClick={event => takeBack(tile.id, event)}
                disabled={answered}
                data-placed={i}
                aria-describedby={answered ? undefined : `${uid}-back`}
              >
                <T>{shown[i]}</T>
              </Motion.button>
            ))}
            {right && stop && <span className="ix-order-stop">{stop}</span>}
            <span id={`${uid}-back`} hidden>Sends the word back to the pool.</span>
          </div>

          <div className="skf-pool-label" id={`${uid}-pool`}>Word pool</div>
          <div className="skf-pool ix-order-pool" role="group" aria-labelledby={`${uid}-pool`}>
            {pool.map((tile, k) => {
              const key = !touch && !answered && k < 9 ? <span className="pcs-btn-key" aria-hidden="true">{k + 1}</span> : null
              if (placed.includes(tile.id)) {
                return (
                  <button key={`${tile.id}-used`} type="button" className="skf-pool-word ix-order-word is-used" disabled data-pool-tile={tile.id}>
                    {key}<T>{tile.text}</T>
                  </button>
                )
              }
              return (
                <Motion.button
                  key={tile.id}
                  layoutId={flightId(tile.id)}
                  layout="position"
                  transition={FLIGHT}
                  animate={{ opacity: answered ? .6 : 1 }}
                  type="button"
                  className="skf-pool-word ix-order-word"
                  onClick={event => place(tile.id, event)}
                  disabled={answered}
                  data-pool-tile={tile.id}
                >
                  {key}<T>{tile.text}</T>
                </Motion.button>
              )
            })}
          </div>

          {!answered ? (
            <div className="pcs-next-container ix-order-actions">
              {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'⌫'}</kbd> to take back, <kbd>{'↵'}</kbd> to check</span>}
              <span className="ix-order-buttons">
                {placed.length > 0 && <button type="button" className="afl-clear ix-order-clear" onClick={clear} aria-label="Clear your sentence">clear</button>}
                <button type="button" className="pcs-next ix-order-check" onClick={check} disabled={!placed.length} data-ix-check="">Check</button>
              </span>
            </div>
          ) : (
            <>
              <div className={`ix-order-feedback ${right ? 'is-right' : 'is-wrong'}`}>
                <span className="pcs-btn-feedback-icon" aria-hidden="true">{right ? '✓' : '✕'}</span>
                <div className="pcs-btn-feedback-body">
                  <span className="pcs-btn-verdict">{right ? 'That’s right.' : 'Not quite.'}</span>
                  {!right && (
                    <span className="ix-order-model">
                      <span className="ix-order-model-label">The chapter’s sentence:</span>{' '}
                      <T>
                        {changedWords(placedTexts.join(' '), current.sm).map((w, i, all) => {
                          // The words not where the learner had them are marked;
                          // the final stop stays outside the mark.
                          const end = i === all.length - 1 ? finalStop(w.word) : ''
                          const word = end ? w.word.slice(0, -end.length) : w.word
                          return <Fragment key={i}>{i > 0 && ' '}{w.changed ? <mark className="ix-order-mark">{word}</mark> : word}{end}</Fragment>
                        })}
                      </T>
                    </span>
                  )}
                  <span className="pcs-btn-why"><Md text={current.why} /></span>
                </div>
              </div>
              <div className="ix-order-next"><NextRow onNext={next} touch={touch} /></div>
            </>
          )}
          <p className="ix-order-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        </>
      )}
    </section>
  )
}
