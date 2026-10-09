/**
 * Practice: type the Samoan for a printed English word or short sentence.
 * A row of keys under the box puts the long vowels and the glottal stop in
 * at the caret, and any apostrophe typed counts as the glottal stop. Graded
 * in type-logic.js: right; almost (only the marks differ: counted right, and
 * the printed spelling is shown with those letters marked); or wrong (the
 * chapter's own form is shown, the learner's text struck through). "Show the
 * answer" gives the card up. The deck, header and end card are the shared
 * ones (engine.js, Shells.jsx).
 *
 * data: { items: [{ en, sm, accept?: [string], why?, hint? }] }
 *
 * Keys: Enter in the box checks (the form submits: the practice band stops
 * Enter keydowns at the root, so no key handler would see it). Focus then
 * moves to Next, and from Next back to the box on the following card.
 */
import { useId, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { DeckComplete, DeckHeader, NextRow } from './Shells.jsx'
import { keepInView, useCardKeys, useDeck, useIsTouchPrimary } from './engine.js'
import { gradeTyped, spellingDiff } from './type-logic.js'
import '../../styles/ix-type.css'

// The letters most keyboards lack: the five long vowels and the glottal stop.
const KEYS = [
  { ch: 'ā', name: 'long a' },
  { ch: 'ē', name: 'long e' },
  { ch: 'ī', name: 'long i' },
  { ch: 'ō', name: 'long o' },
  { ch: 'ū', name: 'long u' },
  { ch: 'ʻ', name: 'glottal stop', mark: true },
]
const MAX_LENGTH = 120
// A second tap that lands on the control drawn next must not answer or skip
// a card: Next waits this long after an answer, giving up after a new card.
const SETTLE_MS = 350

const VERDICT = {
  right: 'That’s right.',
  almost: 'Almost: check the macrons and the glottal stop.',
  wrong: 'Not quite.',
  shown: 'Answer shown.',
}

function Typed({ outcome }) {
  if (!outcome.typed) return null
  const struck = outcome.verdict === 'wrong' || outcome.verdict === 'shown'
  return (
    <p className={`ix-type-typed is-${outcome.verdict}`}>
      <span className="ix-type-typed-k">You typed</span>
      {struck ? <s className="ix-type-typed-v">{outcome.typed}</s> : <span className="ix-type-typed-v">{outcome.typed}</span>}
    </p>
  )
}

function Feedback({ outcome, why }) {
  const { verdict, match, typed } = outcome
  const missed = verdict === 'wrong' || verdict === 'shown'
  const runs = verdict === 'almost' ? spellingDiff(match, typed) : null
  return (
    <div className={`ix-type-feedback is-${verdict}`}>
      <span className="pcs-btn-feedback-icon" aria-hidden="true">{missed ? '✕' : '✓'}</span>
      <div className="pcs-btn-feedback-body">
        <span className="pcs-btn-verdict">{VERDICT[verdict]}</span>
        <p className="ix-type-answer">
          {missed && <span className="ix-type-answer-k">{/\s/.test(match.trim()) ? 'The chapter prints ' : 'The chapter’s word is '}</span>}
          <T>{runs ? runs.map((r, i) => (r.differs ? <mark key={i} className="ix-type-diff">{r.text}</mark> : <span key={i}>{r.text}</span>)) : match}</T>
          {missed && <span className="ix-type-answer-k">.</span>}
        </p>
        {why && <span className="pcs-btn-why"><Md text={why} /></span>}
      </div>
    </div>
  )
}

export default function Type({ data }) {
  const items = useMemo(() => data.items.map((x, i) => ({ ...x, key: i })), [data.items])
  const deck = useDeck(items)
  const cardRef = useRef(null)
  const inputRef = useRef(null)
  const answeredAt = useRef(0)
  const cardAt = useRef(0)
  const touch = useIsTouchPrimary()
  const uid = useId()
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [nudge, setNudge] = useState(false)
  const [keyAt, setKeyAt] = useState(0)

  const current = deck.current
  const outcome = deck.answered ? result : null
  const ids = { label: `${uid}-label`, en: `${uid}-en`, hint: `${uid}-hint`, input: `${uid}-input` }
  const nextButton = () => cardRef.current?.querySelector('.pcs-next-container .pcs-next')

  const clear = () => { setText(''); setResult(null); setNudge(false) }

  // Another card, or the end of the deck. flushSync draws it inside the tap,
  // so the box can take focus there and a phone opens its keyboard for it.
  const go = step => {
    flushSync(() => { step(); clear() })
    cardAt.current = performance.now()
    ;(inputRef.current ?? nextButton())?.focus()
    keepInView(cardRef)
  }

  const answer = (verdict, match) => {
    answeredAt.current = performance.now()
    flushSync(() => {
      setNudge(false)
      setResult({ verdict, match, typed: text.trim() })
      deck.mark(verdict === 'right' || verdict === 'almost')
    })
    nextButton()?.focus()
  }

  const check = () => {
    if (deck.answered || deck.finished) return
    const graded = gradeTyped(text, current)
    if (graded.verdict === 'empty') {
      setNudge(true)
      inputRef.current?.focus()
      return
    }
    answer(graded.verdict, graded.match)
  }
  const giveUp = () => {
    if (deck.answered || deck.finished || performance.now() - cardAt.current < SETTLE_MS) return
    answer('shown', current.sm)
  }
  const next = () => {
    if (!deck.answered || performance.now() - answeredAt.current < SETTLE_MS) return
    go(deck.next)
  }
  // The header's reset leaves focus on itself; the end card's buttons vanish,
  // so theirs move it to the box.
  const restart = () => { deck.reset(); clear(); cardAt.current = performance.now() }
  const headerDeck = { ...deck, reset: restart }
  const endDeck = { ...deck, reset: () => go(deck.reset), again: () => go(deck.again) }

  // Put a letter in at the caret (replacing any selection) and keep the
  // caret in the box just after it.
  const insert = (ch, i) => {
    setKeyAt(i)
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const value = el.value.slice(0, start) + ch + el.value.slice(end)
    if (value.length > MAX_LENGTH) return
    flushSync(() => { setText(value); setNudge(false) })
    el.focus()
    el.setSelectionRange(start + ch.length, start + ch.length)
  }
  // The key row is one tab stop; the arrow keys move along it.
  const onKeysKey = e => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: 0, End: 0 }
    if (!(e.key in moves)) return
    e.preventDefault()
    const at = e.key === 'Home' ? 0 : e.key === 'End' ? KEYS.length - 1 : (keyAt + moves[e.key] + KEYS.length) % KEYS.length
    setKeyAt(at)
    e.currentTarget.querySelectorAll('button')[at]?.focus()
  }

  // Enter with nothing focused (only while this card is mid-screen): go on
  // from an answer or the end card, or step into the box.
  useCardKeys(cardRef, e => {
    if (e.key !== 'Enter') return
    if (e.target !== document.body && !cardRef.current?.contains(e.target)) return
    e.preventDefault()
    if (deck.finished) go(deck.again)
    else if (deck.answered) next()
    else inputRef.current?.focus()
  })

  return (
    <section ref={cardRef} className={`pcs-card ix-type${outcome ? ' is-answered' : ''}`}>
      <DeckHeader deck={headerDeck} />
      {deck.finished ? <DeckComplete deck={endDeck} touch={touch} /> : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label" id={ids.label}>Type the Samoan</div>
            <div className="pcs-noun ix-type-en" id={ids.en} key={current.key}>{current.en}</div>
            {current.hint && <div className="pcs-noun-gloss ix-type-hint" id={ids.hint}><Md text={current.hint} /></div>}
          </div>
          {outcome ? <Typed outcome={outcome} /> : (
            <form className="ix-type-form" onSubmit={e => { e.preventDefault(); check() }} noValidate>
              <input
                ref={inputRef}
                id={ids.input}
                className="ix-type-input"
                type="text"
                lang="sm"
                value={text}
                onChange={e => { setText(e.target.value); if (nudge) setNudge(false) }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="done"
                maxLength={MAX_LENGTH}
                placeholder="Type here"
                aria-labelledby={`${ids.label} ${ids.en}`}
                aria-describedby={current.hint ? ids.hint : undefined}
              />
              <div className="ix-type-keys" role="toolbar" aria-label="Letters to add" aria-controls={ids.input} onKeyDown={onKeysKey}>
                {KEYS.map((k, i) => (
                  <button
                    key={k.ch}
                    type="button"
                    className={`ix-type-key${k.mark ? ' is-mark' : ''}`}
                    tabIndex={i === keyAt ? 0 : -1}
                    aria-label={`${k.ch}, ${k.name}`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => insert(k.ch, i)}
                  >{k.ch}</button>
                ))}
              </div>
              <div className="ix-type-actions">
                <button type="button" className="skf-action ix-type-show" onClick={giveUp}>Show the answer</button>
                {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to check</span>}
                <button type="submit" className="pcs-next ix-type-check">Check</button>
              </div>
            </form>
          )}
          <div className="ix-type-status" aria-live="polite" aria-atomic="true">
            {outcome
              ? <Feedback outcome={outcome} why={current.why} />
              : nudge && <p className="ix-type-nudge">Type the Samoan first, or show the answer.</p>}
          </div>
          {outcome && <NextRow onNext={next} touch={touch} />}
        </>
      )}
    </section>
  )
}
