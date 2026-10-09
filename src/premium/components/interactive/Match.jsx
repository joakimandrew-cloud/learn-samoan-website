/**
 * Practice: match Samoan and English, a few pairs at a time. The Tongan
 * site's tap-to-match chapter exercise (.match-grid cells) inside the picker
 * card, played in short rounds with a first-time score. Choose a cell on each
 * side, in either order: a right pair locks green, a wrong pair shakes red
 * and counts a miss for both items. The rules live in match-logic.js.
 *
 * data: {
 *   pairs: [{ sm, en }],  printed Samoan and the English printed beside it
 *   rounds?: number       pairs per round (default 5); a single leftover
 *                         pair joins the round before it
 * }
 */
import { useEffect, useReducer, useRef } from 'react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { NextRow } from './Shells.jsx'
import { keepInView, useCardKeys, useIsTouchPrimary } from './engine.js'
import { initMatch, isLastRound, isRoundDone, matchReducer, newPass, roundOf, roundSize } from './match-logic.js'
import '../../styles/ix-match.css'

const SIDES = [{ side: 'sm', label: 'Samoan' }, { side: 'en', label: 'English' }]
// A second tap that lands on whatever replaced the button just pressed
// (Finish, then Go again) is ignored for this long.
const SETTLE_MS = 350

const cellsOf = (card, side) => [...card.querySelectorAll(`.match-cell[data-side="${side}"]`)]

// The open cell nearest to position `at` in a list of cells: looking down
// first, then up (or only one way when `dir` is given).
function nearestOpen(cells, at, dir = 0) {
  const open = i => cells[i] && !cells[i].disabled
  for (let step = 1; step < cells.length + 1; step += 1) {
    if (dir >= 0 && open(at + step)) return cells[at + step]
    if (dir <= 0 && open(at - step)) return cells[at - step]
  }
  return null
}

export default function Match({ data }) {
  const size = roundSize(data.rounds)
  const list = Array.isArray(data.pairs) ? data.pairs : []
  const [state, dispatch] = useReducer(matchReducer, { pairs: list, size }, initMatch)
  const cardRef = useRef(null)
  const focusTo = useRef(null)
  const settleUntil = useRef(0)
  const touch = useIsTouchPrimary()

  const { pairs, score, streak, finished } = state
  const round = roundOf(state)
  const done = isRoundDone(state)
  const lastRound = isLastRound(state)
  const matched = new Set(state.matched)
  const roundCount = state.rounds.length
  const pct = finished ? 100 : pairs.length ? (state.matched.length / pairs.length) * 100 : 0
  const perfect = score.total > 0 && score.right === score.total

  // The red on a wrong pair fades by itself (the shake is CSS, and stills
  // under reduced motion; the colour stays for the same short time).
  useEffect(() => {
    if (!state.wrong) return
    const { n } = state.wrong
    const t = setTimeout(() => dispatch({ type: 'unflash', n }), 750)
    return () => clearTimeout(t)
  }, [state.wrong])

  // Focus follows the learner when the control they used goes away: a
  // matched cell is disabled, and the Next and end buttons leave the card.
  useEffect(() => {
    const want = focusTo.current
    const card = cardRef.current
    if (!want || !card) return
    focusTo.current = null
    let el = null
    if (want.kind === 'first') el = card.querySelector('.match-cell:not(:disabled)')
    else if (want.kind === 'button') el = card.querySelector(want.selector)
    else {
      const cells = cellsOf(card, want.side)
      el = nearestOpen(cells, cells.findIndex(c => c.dataset.id === String(want.id))) || card.querySelector('.match-cell:not(:disabled)')
    }
    if (!el) return
    el.focus({ preventScroll: true })
    if (el.matches(':focus-visible')) el.scrollIntoView({ block: 'nearest' })
  })

  // Times come from the events themselves (event.timeStamp).
  const settling = e => (e?.timeStamp ?? 0) < settleUntil.current
  const settle = e => { settleUntil.current = (e?.timeStamp ?? 0) + SETTLE_MS }
  const focusInCard = () => {
    const active = document.activeElement
    return !active || active === document.body || !!cardRef.current?.contains(active)
  }

  const tap = (e, side, id) => {
    if (settling(e)) return
    const action = { type: 'tap', side, id }
    const after = matchReducer(state, action)
    if (after === state) return
    const active = document.activeElement
    if (after.matched.length > state.matched.length && cardRef.current?.contains(active)) {
      focusTo.current = isRoundDone(after)
        ? { kind: 'button', selector: '.ix-match-foot .pcs-next' }
        : { kind: 'near', side: active.dataset.side ?? side, id: active.dataset.id ?? id }
    }
    dispatch(action)
  }
  const next = e => {
    if (settling(e) || finished || !done) return
    if (focusInCard()) focusTo.current = lastRound ? { kind: 'button', selector: '.ix-match-again' } : { kind: 'first' }
    settle(e)
    dispatch({ type: 'next' })
    keepInView(cardRef)
  }
  const fresh = () => ({ pairs: list, pass: newPass(list.length, size) })
  const again = e => {
    if (settling(e) || !finished) return
    if (focusInCard()) focusTo.current = { kind: 'first' }
    settle(e)
    dispatch({ type: 'again', ...fresh() })
    keepInView(cardRef)
  }
  // The header's reset stays put, so focus stays on it; "start fresh" on the
  // end card leaves with the card, so focus moves to the first cell.
  const reset = (e, { fromEnd = false } = {}) => {
    if (fromEnd && settling(e)) return
    if (fromEnd && focusInCard()) focusTo.current = { kind: 'first' }
    settle(e)
    dispatch({ type: 'reset', ...fresh() })
    keepInView(cardRef)
  }

  useCardKeys(cardRef, e => {
    if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return
    // Only a key pressed with nothing else focused; a focused button or link
    // elsewhere on the page keeps its own Enter.
    if (e.target !== document.body && !cardRef.current?.contains(e.target)) return
    if (finished) { e.preventDefault(); again(e) } else if (done) { e.preventDefault(); next(e) }
  })

  // Arrow keys move between cells: up and down a column, across to the
  // other column at the same height.
  const onCellKey = (e, side) => {
    const card = cardRef.current
    if (!card) return
    const cells = cellsOf(card, side)
    const at = cells.indexOf(e.currentTarget)
    let el = null
    if (e.key === 'ArrowDown') el = nearestOpen(cells, at, 1)
    else if (e.key === 'ArrowUp') el = nearestOpen(cells, at, -1)
    else if ((e.key === 'ArrowRight' && side === 'sm') || (e.key === 'ArrowLeft' && side === 'en')) {
      const other = cellsOf(card, side === 'sm' ? 'en' : 'sm')
      el = other[at] && !other[at].disabled ? other[at] : nearestOpen(other, at)
    }
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    el.focus()
  }

  if (!pairs.length) return null

  const cell = (side, id) => {
    const p = pairs[id]
    const isMatched = matched.has(id)
    const isSelected = state.selected?.side === side && state.selected.id === id
    const isWrong = state.wrong?.[side] === id
    return (
      <button
        key={`${side}-${id}`}
        type="button"
        className={`match-cell${isSelected ? ' is-selected' : ''}${isMatched ? ' is-matched' : ''}${isWrong ? ' is-wrong' : ''}`}
        data-side={side}
        data-id={id}
        disabled={isMatched}
        aria-pressed={isMatched ? undefined : isSelected}
        onClick={e => tap(e, side, id)}
        onKeyDown={e => onCellKey(e, side)}
      >
        <span className="ix-match-text">{side === 'sm' ? <T>{p.sm}</T> : <Md text={p.en} />}</span>
        {isMatched && <span className="ix-match-tick" aria-hidden="true">{'✓'}</span>}
        {isMatched && <span className="visually-hidden"> (matched)</span>}
      </button>
    )
  }

  const verdict = () => {
    const v = state.last
    if (!v) return null
    if (v.kind === 'miss') return <span key={v.n} className="is-wrong">Not a pair.</span>
    const p = pairs[v.id]
    return (
      <span key={v.n} className="is-right">
        Matched: <T>{p.sm}</T> and <span className="ix-match-status-en"><Md text={p.en} /></span>.
        {done && <strong> {lastRound ? 'All pairs matched.' : 'Round complete.'}</strong>}
      </span>
    )
  }

  return (
    <section ref={cardRef} className="pcs-card ix-match">
      <div className="pcs-card-row">
        <div className="pcs-progress-wrap">
          <span className="pcs-progress">Round {Math.min(state.round + 1, roundCount)} / {roundCount}</span>
          <div className="pcs-progress-bar" role="progressbar" aria-label="Pairs matched" aria-valuemin={0} aria-valuemax={pairs.length} aria-valuenow={finished ? pairs.length : state.matched.length}>
            <div className="pcs-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="pcs-stats">
          <span className="ix-match-tally">
            <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
              <span className="pcs-stat-value">{score.right}</span>
              <span className="pcs-stat-label"> / {score.total} matched first time</span>
            </span>
            {streak > 1 && (
              <span className="pcs-stat pcs-streak">
                <span className="pcs-stat-value">{streak}</span>
                <span className="pcs-stat-label"> in a row</span>
              </span>
            )}
          </span>
          <button onClick={e => reset(e)} className="pcs-reset" type="button" aria-label="Start this practice again">reset</button>
        </div>
      </div>

      {finished ? (
        <>
          <div className="pcs-noun-frame" role="status">
            <div className="pcs-prompt-label">Deck complete</div>
            <div className="pcs-noun ix-done-score">{score.right} / {score.total}</div>
            <div className="pcs-noun-gloss">{perfect ? 'Perfect: every pair matched first time.' : 'Pairs matched first time.'}</div>
          </div>
          <div className="pcs-next-container pcs-end-row">
            {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to go again</span>}
            <button onClick={e => reset(e, { fromEnd: true })} className="pcs-reset" type="button">start fresh</button>
            <button onClick={again} className="pcs-next ix-match-again" type="button">Go again {'→'}</button>
          </div>
        </>
      ) : (
        <>
          <div className="pcs-question">Pick one on each side</div>
          <div className="match-grid ix-match-grid" key={`${state.pass}-${state.round}`}>
            {SIDES.map(({ side, label }) => (
              <div key={side} className="ix-match-col" role="group" aria-label={label}>
                <span className="ix-match-head" aria-hidden="true">{label}</span>
                {round[side].map(id => cell(side, id))}
              </div>
            ))}
          </div>
          <div className="ix-match-foot">
            <p className="ix-match-status" role="status">{verdict()}</p>
            {done && <NextRow onNext={next} touch={touch} label={lastRound ? 'Finish' : 'Next round'} />}
          </div>
        </>
      )}
    </section>
  )
}
