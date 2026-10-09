/**
 * Figure: a printed conversation, three ways. "Read" shows every line, the
 * Samoan with its English underneath. "Step through" brings the lines in one
 * at a time. "Take a part" lets the learner be one speaker: the other
 * speaker's lines are shown, and each of the learner's own lines waits behind
 * a "Say it, then show" button, revealed one at a time, in order. A switch
 * hides or shows every English line in any mode. All Samoan comes from the
 * data; nothing here composes a line.
 *
 * data: {
 *   speakers: { <key>: "English label" | { sm: "<printed Samoan name>" } },
 *   lines: [{ who: <speaker key>, sm, en }]
 * }
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { motion as Motion, useReducedMotion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { keepControlKeysLocal } from './engine.js'
import { range, rolePlay, speakingParts, toneOf } from './dialogue-logic.js'
import '../../styles/ix-dialogue.css'

const MODES = [
  { id: 'read', label: 'Read' },
  { id: 'step', label: 'Step through' },
  { id: 'part', label: 'Take a part' },
]
// A restart this soon after a step is the second half of a double tap.
const SETTLE_MS = 500
const EASE = [.16, 1, .3, 1]

function Speaker({ value }) {
  if (value && typeof value === 'object') return <T>{value.sm}</T>
  return <Md text={String(value ?? '')} />
}

// Buttons that behave as a radio group: one tab stop, and the arrow keys move
// the choice and the focus together.
function Radios({ label, labelledBy, options, value, onChange, className, itemClass = '', children }) {
  const refs = useRef([])
  const onKeyDown = event => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    const at = refs.current.indexOf(event.target)
    const from = at >= 0 ? at : Math.max(0, options.findIndex(o => o.id === value))
    let to
    if (step) to = (from + step + options.length) % options.length
    else if (event.key === 'Home') to = 0
    else if (event.key === 'End') to = options.length - 1
    else return
    event.preventDefault()
    onChange(options[to].id)
    refs.current[to]?.focus()
  }
  const anyOn = options.some(o => o.id === value)
  return (
    <div className={className} role="radiogroup" aria-label={label} aria-labelledby={labelledBy} onKeyDown={onKeyDown}>
      {options.map((o, i) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            ref={el => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!anyOn && i === 0) ? 0 : -1}
            className={`${itemClass}${on ? ' is-on' : ''}`}
            onClick={() => onChange(o.id)}
          >
            {children(o)}
          </button>
        )
      })}
    </div>
  )
}

// One mark per line, in the speaker's colour once the line is on the page.
function Ticks({ lines, speakers, visible, due }) {
  return (
    <span className="ix-dlg-ticks" aria-hidden="true">
      {lines.map((l, i) => (
        <i key={i} className={`is-s${toneOf(speakers, l.who)}${i === due ? ' is-due' : i < visible ? ' is-on' : ''}`} />
      ))}
    </span>
  )
}

// What the status line says after a step: the lines that just came in.
function News({ news, lines, speakers }) {
  return (
    <>
      {news.lead ? `${news.lead} ` : null}
      {news.items.map(i => (
        <span key={i}>
          <Speaker value={speakers[lines[i].who] ?? lines[i].who} />: <T>{lines[i].sm}</T>{news.en ? ` ${lines[i].en}` : ''}{' '}
        </span>
      ))}
      {news.tail === 'turn' ? 'Your turn.' : news.tail === 'end' ? 'End of the conversation.' : null}
    </>
  )
}

export default function Dialogue({ data }) {
  const speakers = data.speakers || {}
  const lines = data.lines || []
  const total = lines.length
  const parts = speakingParts(speakers, lines)
  const uid = useId()
  const still = useReducedMotion()

  const [mode, setMode] = useState('read')
  const [showEn, setShowEn] = useState(true)
  const [shown, setShown] = useState(1)
  const [me, setMe] = useState(null)
  const [said, setSaid] = useState(0)
  const [news, setNews] = useState(null)

  const footRef = useRef(null)
  const stepRef = useRef(null)
  const dueRef = useRef(null)
  const endRef = useRef(null)
  const hold = useRef(null)
  const held = useRef(null)
  const focusNext = useRef(null)
  const movedAt = useRef(0)

  const play = rolePlay(lines, me, said)
  const stepAt = Math.min(Math.max(shown, 1), total)
  const choosing = mode === 'part' && me == null
  const visible = mode === 'read' ? total : mode === 'step' ? stepAt : choosing ? 0 : play.upTo
  const due = mode === 'part' && !choosing ? play.next : null

  // While lines come and go above the button just pressed, keep its row where
  // it is on screen, so the next tap lands on the button again.
  useLayoutEffect(() => {
    const h = hold.current
    if (!h) return
    hold.current = null
    if (!h.el.isConnected) return
    const shift = h.el.getBoundingClientRect().top - h.top
    if (Math.abs(shift) > .5) window.scrollBy({ top: shift, behavior: 'instant' })
    held.current = h
  })
  // A reveal or a restart can remove the button that was pressed: hand the
  // focus to the next thing to press, and bring it into view.
  useEffect(() => {
    const want = focusNext.current
    if (!want) return
    focusNext.current = null
    const el = want === 'due' ? dueRef.current : want === 'end' ? endRef.current : stepRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    const r = el.getBoundingClientRect()
    if (r.bottom > window.innerHeight - 12 || r.top < 80) el.scrollIntoView({ block: 'nearest', behavior: still ? 'instant' : 'smooth' })
  })

  // Scrolling moves in whole pixels: tap after tap, aim for the first spot
  // rather than wherever the last rounding left the row.
  const keepStill = el => {
    if (!el) return
    const top = el.getBoundingClientRect().top
    const last = held.current
    hold.current = { el, top: last && last.el === el && Math.abs(last.top - top) < 1.5 ? last.top : top }
  }
  // Clicks carry their own time: a restart too soon after a step is ignored.
  const settled = event => event.timeStamp - movedAt.current > SETTLE_MS
  const announce = (items, tail, lead = null) => setNews({ items, tail, lead, en: showEn })

  const pickMode = id => {
    if (id === mode) return
    setMode(id)
    setNews(null)
  }

  // Step through: one button, "Next line" until the end, then "Start over".
  const restartSteps = (event, moveFocus) => {
    if (!settled(event)) return
    keepStill(footRef.current)
    if (moveFocus) focusNext.current = 'step'
    setShown(1)
    announce([0], null, `Line 1 of ${total}.`)
  }
  const stepOn = event => {
    if (stepAt >= total) { restartSteps(event, false); return }
    keepStill(footRef.current)
    movedAt.current = event.timeStamp
    setShown(stepAt + 1)
    announce([stepAt], stepAt + 1 === total ? 'end' : null)
  }

  // Take a part.
  const startPart = (who, focus) => {
    const p = rolePlay(lines, who, 0)
    focusNext.current = focus
    setMe(who)
    setSaid(0)
    announce(range(0, p.next ?? total), p.done ? 'end' : 'turn')
  }
  const choose = who => { if (who !== me) startPart(who, null) }
  const reveal = event => {
    if (play.next == null) return
    const after = rolePlay(lines, me, said + 1)
    movedAt.current = event.timeStamp
    focusNext.current = after.done ? 'end' : 'due'
    setSaid(said + 1)
    announce(range(play.next, after.next ?? total), after.done ? 'end' : 'turn')
  }
  const restartPart = event => { if (settled(event)) startPart(me, 'due') }
  const swap = event => { if (settled(event)) startPart(parts.find(k => k !== me), 'due') }
  const canSwap = parts.length === 2

  const renderLine = (l, i) => {
    const mine = mode === 'part' && l.who === me
    const enId = `${uid}-en-${i}`
    return (
      <Motion.li
        key={i}
        className={`ix-dlg-line is-s${toneOf(speakers, l.who)}${i === due ? ' is-due' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .45, ease: EASE }}
      >
        <span className="ix-dlg-who">
          <span className="ix-dlg-name"><Speaker value={speakers[l.who] ?? l.who} /></span>
          {mine && <span className="ix-dlg-you">you</span>}
        </span>
        {i === due ? (
          <button ref={dueRef} type="button" className="reveal-b ix-dlg-reveal" onClick={reveal} aria-describedby={showEn ? enId : undefined}>
            Say it, then show
          </button>
        ) : mine ? (
          <Motion.span className="ix-dlg-said" initial={{ opacity: 0, filter: 'blur(6px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} transition={{ duration: .45 }}>
            <T className="ix-dlg-sm">{l.sm}</T>
          </Motion.span>
        ) : (
          <T className="ix-dlg-sm">{l.sm}</T>
        )}
        {showEn && <span className="ix-dlg-en" id={enId}>{l.en}</span>}
      </Motion.li>
    )
  }

  let foot = null
  if (mode === 'step') {
    // The mid-way "Start over" keeps its slot when it is not offered, so the
    // row never reflows under a finger tapping "Next line". The row, not the
    // button, is what stays still: a pressed button is mid-bounce.
    const midway = stepAt > 1 && stepAt < total
    foot = (
      <div className="ix-dlg-foot" ref={footRef}>
        <div className="ix-dlg-where">
          <Ticks lines={lines} speakers={speakers} visible={visible} due={null} />
          <span className="ix-dlg-count">{stepAt} of {total}</span>
        </div>
        <div className="ix-dlg-acts">
          <button type="button" className={`ix-dlg-quiet${midway ? '' : ' is-idle'}`} disabled={!midway} onClick={event => restartSteps(event, true)}>Start over</button>
          <button ref={stepRef} type="button" className="btn btn-primary btn-sm ix-dlg-go" onClick={stepOn}>
            {stepAt < total ? 'Next line' : 'Start over'}
          </button>
        </div>
      </div>
    )
  } else if (mode === 'part' && !choosing) {
    foot = (
      <div className="ix-dlg-foot">
        <div className="ix-dlg-where">
          <Ticks lines={lines} speakers={speakers} visible={visible} due={due} />
          <span className="ix-dlg-count">{play.done ? 'End of the conversation.' : `Your lines: ${play.said} of ${play.mine.length}`}</span>
        </div>
        <div className="ix-dlg-acts">
          {play.done ? (
            <>
              {canSwap && <button ref={endRef} type="button" className="btn btn-primary btn-sm ix-dlg-go" onClick={swap}>Swap parts</button>}
              <button ref={canSwap ? null : endRef} type="button" className={canSwap ? 'ix-dlg-quiet' : 'btn btn-primary btn-sm ix-dlg-go'} onClick={restartPart}>Start over</button>
            </>
          ) : play.said > 0 && (
            <button type="button" className="ix-dlg-quiet" onClick={restartPart}>Start over</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="ix-dialogue" onKeyDownCapture={keepControlKeysLocal}>
      <div className="ix-dlg-bar">
        <Radios label="View" options={MODES} value={mode} onChange={pickMode} className="cb-toggle ix-dlg-modes">
          {o => o.label}
        </Radios>
        <button type="button" className="ix-dlg-switch" aria-pressed={showEn} onClick={() => setShowEn(on => !on)}>
          <span className="ix-dlg-track" aria-hidden="true"><span className="ix-dlg-knob" /></span>
          Show English
        </button>
      </div>

      {mode === 'part' && (
        <div className="cb-row ix-dlg-part">
          <span className="cb-label" id={`${uid}-part`}>Your part</span>
          <Radios labelledBy={`${uid}-part`} options={parts.map(k => ({ id: k }))} value={me} onChange={choose} className="cb-chips" itemClass="cb-chip">
            {o => <span className="ix-dlg-chip"><Speaker value={speakers[o.id]} /></span>}
          </Radios>
        </div>
      )}

      <div className="ix-dlg-sheet">
        {choosing ? (
          <p className="ix-dlg-hint">Choose your part. Say each of your lines aloud, then show it.</p>
        ) : (
          <ol className="ix-dlg-lines">{lines.slice(0, visible).map(renderLine)}</ol>
        )}
        {foot}
      </div>

      <div className="visually-hidden" role="status" aria-live="polite">
        {news && <News news={news} lines={lines} speakers={speakers} />}
      </div>
    </div>
  )
}
