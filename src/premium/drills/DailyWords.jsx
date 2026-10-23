/**
 * Daily words: spaced recall of the course's own Words to Learn. The Tongan
 * DailyWordsCore, over src/premium/lib/daily-words.js. An English cue, the
 * Samoan among near neighbours, and a Leitner box per word kept in
 * localStorage ("ls-daily-words-v1"). A miss drops the word to box 1 so it
 * comes back first next time. Every word and gloss is a row of
 * book-vocabulary.json, shown exactly as stored.
 */
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import T from '../components/T.jsx'
import { DeckComplete } from '../components/interactive/Shells.jsx'
import { keepInView, useCardKeys, useIsTouchPrimary } from '../components/interactive/engine.js'
import VOCAB from '@app/data/book-vocabulary.json'
import { MAX_BOX, buildDeck, buildSession, loadBoxes, nextBox, saveBoxes } from '../lib/daily-words.js'

const DECK = buildDeck(VOCAB)

export default function DailyWords() {
  const touch = useIsTouchPrimary()
  const cardRef = useRef(null)
  const [boxes, setBoxes] = useState(() => loadBoxes())
  const [session, setSession] = useState(() => buildSession(DECK, loadBoxes()))
  const [index, setIndex] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  const mastered = useMemo(() => Object.values(boxes).filter(b => b >= MAX_BOX).length, [boxes])
  const round = session[index]
  const answered = guess !== null
  const isCorrect = answered && guess === round.entry.id
  const answerOption = round.options.find(o => o.id === round.entry.id)

  const choose = id => {
    if (answered) return
    const right = id === round.entry.id
    setGuess(id)
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setBoxes(prev => {
      const next = { ...prev, [round.entry.id]: nextBox(prev[round.entry.id], right) }
      saveBoxes(next)
      return next
    })
  }
  const next = () => {
    if (index < session.length - 1) { setIndex(index + 1); setGuess(null) } else setFinished(true)
    keepInView(cardRef)
  }
  const again = () => {
    setSession(buildSession(DECK, boxes)); setIndex(0); setGuess(null); setScore({ right: 0, total: 0 }); setFinished(false)
    keepInView(cardRef)
  }

  useCardKeys(cardRef, e => {
    if (finished) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); again() }
      return
    }
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next() }
      return
    }
    if (/^[1-9]$/.test(e.key)) {
      const k = Number(e.key)
      if (k <= round.options.length) { e.preventDefault(); choose(round.options[k - 1].id) }
    }
  })

  const perfect = score.total > 0 && score.right === score.total
  const pct = finished ? 100 : session.length ? ((index + (answered ? 1 : 0)) / session.length) * 100 : 0

  return (
    <section ref={cardRef} className={`pcs-card${answered ? ' is-answered' : ''}`}>
      <div className="pcs-card-row">
        <div className="pcs-progress-wrap">
          <span className="pcs-progress">{finished ? session.length : index + 1} / {session.length}</span>
          <div className="pcs-progress-bar"><div className="pcs-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="pcs-stats">
          <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="pcs-stat-value">{score.right}</span>
            <span className="pcs-stat-label"> / {score.total} correct</span>
          </span>
          {mastered > 0 && <span className="pcs-stat"><span className="pcs-stat-value">{mastered}</span><span className="pcs-stat-label"> mastered</span></span>}
          <button onClick={again} className="pcs-reset" type="button" aria-label="Start a new session">reset</button>
        </div>
      </div>

      {finished ? (
        <DeckComplete deck={{ score, reset: again, again }} touch={touch} fresh={false} />
      ) : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">Recall the Sāmoan</div>
            <div className="pcs-noun pcs-daily-cue">{round.entry.english}</div>
          </div>
          <div className="pcs-question">Which word means this?</div>
          <div className="pcs-buttons pcs-buttons-3">
            {round.options.map((o, i) => {
              const chosen = answered && guess === o.id
              const isAnswer = answered && round.entry.id === o.id
              let cls = ''
              if (answered) {
                if (chosen && isCorrect) cls = 'is-answer'
                else if (chosen) cls = 'is-chosen-wrong'
                else if (isAnswer) cls = 'is-revealed-answer'
                else cls = 'is-dim'
              }
              return (
                <button key={o.id} type="button" className={`pcs-btn ${cls}`} disabled={answered} onClick={() => choose(o.id)}>
                  {!answered && !touch && <span className="pcs-btn-key" aria-hidden="true">{i + 1}</span>}
                  <span className="pcs-btn-label"><T>{o.samoan}</T></span>
                </button>
              )
            })}
          </div>
          {answered && (
            <>
              <div className="pcs-reveal">
                <div className="pcs-verdict">
                  {isCorrect
                    ? <><span className="pcs-right">Yes.</span> <T>{answerOption.samoan}</T> means {round.entry.english}.</>
                    : <><span className="pcs-wrong">Not quite.</span> {round.entry.english} is <T>{answerOption.samoan}</T>.</>}
                  {round.entry.chapter > 0 && <> <Link className="pcs-end-link" to={`/chapters/${round.entry.chapter}`}>Chapter {round.entry.chapter}</Link></>}
                </div>
              </div>
              <div className="pcs-next-container">
                {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to continue</span>}
                <button onClick={next} className="pcs-next" type="button">Next {'→'}</button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
