/**
 * Figure: two or more printed forms of one thing, shown one at a time, and
 * exactly what changes between them. Toggle between forms (a statement and
 * its question), or step through a derivation (a word, the word with an
 * affix, the built word at work in a sentence). Words that differ from the
 * first form (toggle) or from the step before (steps) are marked in the
 * accent colour; inside a word built from an earlier one, only the letters it
 * adds. A form with a tune draws its pitch contour over the words: the Tongan
 * site's Lesson 1 intonation figure, made general.
 *
 * data: {
 *   mode?: 'toggle' | 'steps',      default toggle
 *   states: [{ label, sm?, en, tune?: 'fall' | 'rise' | 'level', note? }]
 * }
 * A state without sm is English only: its en is the line itself, in roman.
 */
import { useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { englishWords, isTune, stageWords, TUNE_BASE, TUNE_VIEW, TUNES } from './contrast-logic.js'
import '../../styles/ix-contrast.css'

const EASE = [.16, 1, .3, 1]
const plain = s => String(s ?? '').replace(/\*/g, '')
const tuneOf = s => (isTune(s?.tune) ? s.tune : null)
const splitWords = s => String(s ?? '').split(/\s+/).filter(Boolean)

/* An English-only line. Split into words so it spreads under a contour like
   the Samoan does, unless it carries *italics*, which must stay whole. */
function EnglishLine({ en }) {
  if (String(en).includes('*')) return <span className="ix-ct-w"><Md text={en} /></span>
  return englishWords(en).map(w => <span key={w.key} className="ix-ct-w">{w.word}</span>)
}

// Screen-reader text runs on at a stop; a bare word or label gets one.
const stopAfter = s => (/[.?!]$/.test(s) ? ' ' : '. ')

/* Every state laid out at once, unseen, so the stage is as tall as its
   tallest form and nothing below it jumps when the form changes. */
function Sizer({ states }) {
  return (
    <div className="ix-ct-sizer" aria-hidden="true">
      {states.map((s, i) => (
        <div key={i} className="ix-ct-slot">
          {s.sm != null
            ? <p className="ix-ct-words">{splitWords(s.sm).map((w, k) => <T key={k} className="ix-ct-w">{w}</T>)}</p>
            : <p className="ix-ct-words is-en"><EnglishLine en={s.en} /></p>}
          {s.sm != null && <p className="cb-en ix-ct-en">{s.en}</p>}
        </div>
      ))}
    </div>
  )
}

export default function Contrast({ data }) {
  const states = data.states
  const n = states.length
  const steps = data.mode === 'steps'
  const [view, setView] = useState({ at: 0, from: null })
  const { at, from } = view
  const cur = states[at]
  const still = useReducedMotion()
  const radios = useRef([])

  const go = i => setView(v => (i === v.at || i < 0 || i >= n ? v : { at: i, from: v.at }))
  const step = d => setView(v => {
    const i = v.at + d
    return i < 0 || i >= n ? v : { at: i, from: v.at }
  })

  // What the marks measure against: the first form, or the step before.
  // English and Samoan are never compared.
  const base = steps ? states[at - 1] : at > 0 ? states[0] : null
  const words = cur.sm != null ? stageWords(base?.sm ?? null, cur.sm) : null

  // The contour keeps its last shape while it fades out, and takes a new
  // shape at once when it fades back in, so it only ever morphs between two
  // tunes the data gives.
  const tuned = states.some(s => tuneOf(s))
  const tune = tuneOf(cur)
  const fromTune = from != null ? tuneOf(states[from]) : null
  const shape = TUNES[tune || fromTune || 'level']
  const morph = !still && tune && fromTune ? .8 : 0
  const fade = still ? 0 : .35

  const longest = Math.max(...states.map(s => (s.sm ?? plain(s.en)).length))
  const notes = states.some(s => s.note)

  const onRadioKey = (e, i) => {
    let j = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = n - 1
    if (j == null) return
    e.preventDefault()
    go(j)
    radios.current[j]?.focus()
  }

  const radio = (s, i) => (
    <button
      key={i}
      ref={el => { radios.current[i] = el }}
      type="button"
      role="radio"
      aria-checked={i === at}
      tabIndex={i === at ? 0 : -1}
      className={i === at ? 'is-on' : ''}
      onClick={() => go(i)}
      onKeyDown={e => onRadioKey(e, i)}
    >
      <Md text={s.label} />
    </button>
  )

  return (
    <div className={`ix-contrast${tuned ? ' is-tuned' : ''}${longest > 22 ? ' is-long' : ''}${steps ? ' is-steps' : ''}`}>
      {steps ? (
        <ol className={`ix-ct-track${n > 4 ? ' is-many' : ''}`} style={{ '--n': n }} aria-label="Steps">
          {states.map((s, i) => (
            <li key={i} className={i === at ? 'is-on' : i < at ? 'is-done' : ''}>
              <button type="button" className="ix-ct-tbtn" onClick={() => go(i)} aria-current={i === at ? 'step' : undefined} aria-label={`Step ${i + 1} of ${n}: ${plain(s.label)}`}>
                <span className="ix-ct-dot" aria-hidden="true">{i + 1}</span>
                <span className="ix-ct-tlabel" aria-hidden="true"><Md text={s.label} /></span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ix-ct-controls">
          {n === 2 ? (
            <div className="into-toggle ix-ct-toggle" role="radiogroup" aria-label="Forms to compare">
              {states.map(radio)}
              <Motion.span className="into-pill" aria-hidden="true" initial={false} animate={{ x: at === 1 ? '100%' : '0%' }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            </div>
          ) : (
            <div className="cb-toggle ix-ct-toggle" role="radiogroup" aria-label="Forms to compare">
              {states.map(radio)}
            </div>
          )}
        </div>
      )}

      <div className="cb-out ix-ct-stage">
        {tuned && (
          <div className="ix-ct-tune-area">
            <div className="ix-ct-tune-row">
              <AnimatePresence mode="wait" initial={false}>
                <Motion.span key={tune || 'none'} className={`ix-ct-tune${tune ? '' : ' is-none'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: still ? 0 : .2 }}>
                  {tune ? <><span aria-hidden="true">{TUNES[tune].arrow}</span> {TUNES[tune].label}</> : 'No tune marked'}
                </Motion.span>
              </AnimatePresence>
            </div>
            {/* Stretched to the stage, so the strokes do not scale and the
                end dot is a round-capped stroke rather than a circle. */}
            <svg viewBox={TUNE_VIEW} preserveAspectRatio="none" className="into-svg ix-ct-svg" aria-hidden="true" focusable="false">
              <path d={TUNE_BASE} className="into-base" />
              <Motion.path
                className="into-line"
                initial={false}
                animate={{ d: shape.d, opacity: tune ? 1 : 0 }}
                transition={{ d: { duration: morph, ease: EASE }, opacity: { duration: fade } }}
              />
              <Motion.path
                className="into-dot ix-ct-end"
                initial={false}
                animate={{ d: `M610 ${shape.end} L610 ${shape.end}`, opacity: tune ? 1 : 0 }}
                transition={{ d: { duration: morph, ease: EASE }, opacity: { duration: fade } }}
              />
            </svg>
          </div>
        )}

        <div className="ix-ct-cell">
          <Sizer states={states} />
          <div className="ix-ct-now">
            <div className="ix-ct-stack">
              {/* Samoan and English lines swap out, then in. Between two
                  Samoan forms the line stays: words both forms share glide
                  to their new places, new words arrive a beat later. */}
              <AnimatePresence mode="wait" initial={false}>
                {words ? (
                  <Motion.p key="sm" className="ix-ct-words" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {words.map(w => (
                        <T
                          key={w.key}
                          as={Motion.span}
                          layout="position"
                          className={`ix-ct-w${w.changed ? ' is-changed' : ''}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0, transition: { duration: .4, ease: EASE, delay: .12 } }}
                          exit={{ opacity: 0, y: -10, transition: { duration: .18 } }}
                          transition={{ layout: { duration: .5, ease: EASE } }}
                        >
                          {w.parts.map((p, k) => (p.changed ? <mark key={k} className="ix-ct-mark">{p.text}</mark> : <span key={k}>{p.text}</span>))}
                        </T>
                      ))}
                    </AnimatePresence>
                  </Motion.p>
                ) : (
                  <Motion.p key={`en${at}`} className="ix-ct-words is-en" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .2 }}>
                    <EnglishLine en={cur.en} />
                  </Motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="ix-ct-stack">
              <AnimatePresence mode="wait" initial={false}>
                {cur.sm != null && (
                  <Motion.p key={at} className="cb-en ix-ct-en" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }}>
                    {cur.en}
                  </Motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className={`ix-ct-notes${notes ? '' : ' is-empty'}`}>
        {states.map((s, i) => (s.note ? <p key={i} className="ix-ct-note-size" aria-hidden="true"><Md text={s.note} /></p> : null))}
        <div className="ix-ct-note" aria-live="polite">
          <span className="visually-hidden">
            {steps ? `Step ${at + 1} of ${n}: ` : ''}{plain(cur.label)}{stopAfter(plain(cur.label))}
            {cur.sm != null && <><span lang="sm">{cur.sm}</span>{stopAfter(cur.sm)}</>}
            {plain(cur.en)}{tune ? `${stopAfter(plain(cur.en))}${TUNES[tune].label}.` : ''}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            {cur.note ? (
              <Motion.p key={at} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .25 }}>
                <Md text={cur.note} />
              </Motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {steps && (
        <div className="ix-ct-nav">
          <button type="button" className="ix-ct-navb" onClick={() => step(-1)} aria-disabled={at === 0}>
            <span aria-hidden="true">{'←'}</span> Back
          </button>
          <span className="ix-ct-count" aria-hidden="true">
            {at + 1} of {n}
            {n > 4 && <span className="ix-ct-count-label"><Md text={cur.label} /></span>}
          </span>
          <button type="button" className="ix-ct-navb is-next" onClick={() => step(1)} aria-disabled={at === n - 1}>
            Next <span aria-hidden="true">{'→'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
