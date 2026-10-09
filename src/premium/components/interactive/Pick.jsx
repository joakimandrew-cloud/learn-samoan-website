/**
 * Practice: choose the right option for each printed prompt. The Tongan
 * site's PickerCore (deck, score, streak, the why-line in the chosen button,
 * number keys and Enter), fed from chapter data.
 *
 * data: {
 *   question,                         the line above the options
 *   options?: [{ id, sm | label, en?, fill? }],   shared by every prompt
 *   prompts: [{
 *     sm?,      printed Samoan; "___" marks the one blank the answer fills
 *     en?,      its printed English (or, with no sm, the English to render)
 *     ask?,     a per-prompt question
 *     options?, per-prompt options (shuffled), e.g. whole printed sentences
 *     answer, acceptAlso?, why, note?
 *   }],
 *   hideGloss?  blur the English until the prompt is answered
 * }
 */
import { useMemo, useRef, useState } from 'react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { DeckComplete, DeckHeader, NextRow } from './Shells.jsx'
import { keepInView, shuffle, useCardKeys, useDeck, useIsTouchPrimary } from './engine.js'
import '../../styles/ix-pick.css'

const BLANK = '___'

function OptionText({ o }) {
  return o.sm != null ? <T>{o.sm}</T> : <Md text={o.label} />
}

export default function Pick({ data }) {
  // Per-prompt option lists are shuffled once, so their order carries no hint.
  const prompts = useMemo(() => data.prompts.map((p, i) => ({ ...p, key: i, options: p.options ? shuffle(p.options) : null })), [data.prompts])
  const deck = useDeck(prompts)
  const cardRef = useRef(null)
  const touch = useIsTouchPrimary()
  const [picked, setPicked] = useState(null)

  const current = deck.current
  const options = current.options || data.options
  const accepted = [current.answer, ...(current.acceptAlso || [])]
  const guess = deck.answered ? picked : null
  const isCorrect = deck.answered && accepted.includes(guess)
  const answerOption = options.find(o => o.id === current.answer)
  const guessOption = options.find(o => o.id === guess)

  const choose = id => {
    if (deck.answered) return
    setPicked(id)
    deck.mark(accepted.includes(id))
  }
  const next = () => { deck.next(); keepInView(cardRef) }
  const again = () => { deck.again(); keepInView(cardRef) }

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
      if (k <= Math.min(9, options.length)) { e.preventDefault(); choose(options[k - 1].id) }
    }
  })

  const renderPrompt = () => {
    if (current.sm == null) return <span className="ix-pick-en-prompt">{current.en}</span>
    if (!current.sm.includes(BLANK)) return <T>{current.sm}</T>
    const at = current.sm.indexOf(BLANK)
    const cls = !deck.answered ? 'pcs-blank' : isCorrect ? 'pcs-blank is-filled-correct' : 'pcs-blank is-filled-wrong'
    const fill = guessOption ? (guessOption.fill ?? guessOption.sm ?? guessOption.label) : null
    return (
      <T>
        {current.sm.slice(0, at)}
        <span className={cls}>{deck.answered && <span className="pcs-blank-word">{fill}</span>}</span>
        {current.sm.slice(at + BLANK.length)}
      </T>
    )
  }

  const many = options.length >= 6 || options.some(o => (o.sm || o.label || '').length > 24)
  const renderOption = (o, k) => {
    const chosen = deck.answered && guess === o.id
    const isAnswer = deck.answered && accepted.includes(o.id)
    let cls = ''
    if (deck.answered) {
      if (chosen && isCorrect) cls = 'is-answer'
      else if (chosen) cls = 'is-chosen-wrong'
      else if (!isCorrect && o.id === current.answer) cls = 'is-revealed-answer'
      else if (isAnswer) cls = 'is-revealed-answer'
      else cls = 'is-dim'
    }
    return (
      <button key={o.id} type="button" onClick={() => choose(o.id)} disabled={deck.answered} className={`pcs-btn ${cls}`}>
        {k <= 9 && !deck.answered && !touch && <span className="pcs-btn-key" aria-hidden="true">{k}</span>}
        <span className="pcs-btn-label"><OptionText o={o} /></span>
        {o.en && <span className="pcs-btn-principle">{o.en}</span>}
        {chosen && (
          <span className="pcs-btn-feedback" role="status">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{isCorrect ? '✓' : '✕'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">{isCorrect ? 'That’s right.' : 'Not quite.'}</span>
              <span className="pcs-btn-why">
                {!isCorrect && <>The answer is <strong><OptionText o={answerOption} /></strong>, not <strong><OptionText o={o} /></strong>. </>}
                <Md text={current.why} />
                {current.note ? <> <Md text={current.note} /></> : null}
              </span>
            </span>
          </span>
        )}
      </button>
    )
  }

  return (
    <section ref={cardRef} className={`pcs-card ix-pick${deck.answered ? ' is-answered' : ''}`}>
      <DeckHeader deck={deck} />
      {deck.finished ? <DeckComplete deck={deck} touch={touch} /> : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-noun">{renderPrompt()}</div>
            {current.sm != null && current.en && (
              <div className={`pcs-noun-gloss${data.hideGloss ? ' pcs-noun-gloss-reveal' : ''}`}>{current.en}</div>
            )}
          </div>
          <div className="pcs-question"><Md text={current.ask || data.question} /></div>
          <div className={`pcs-buttons${many ? ' ix-pick-stack' : options.length >= 3 && options.length % 3 === 0 ? ' pcs-buttons-3' : ''}`}>
            {options.map((o, i) => renderOption(o, i + 1))}
          </div>
          {deck.answered && <NextRow onNext={next} touch={touch} />}
        </>
      )}
    </section>
  )
}
