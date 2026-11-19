import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react'
import EntryMotif from '../components/EntryMotif.jsx'
import T from '../components/T.jsx'
import { Tile } from '../components/Tile.jsx'
import { QuizChoices } from '../components/practice/QuizParts.jsx'
import { useTitle } from '../lib/title.js'
import { STATIC_META } from '@app/seo/meta.js'
import { COPY, QUESTIONS, QUIZ_PATH, resultFor } from '@app/seo/pages/grandmother-quiz.js'
import '../styles/catalog.css'
import '../styles/quiz.css'
import '../styles/grandmother-quiz.css'

// The questions in the shape the site's quiz choices take (QuizParts.jsx).
const CARDS = QUESTIONS.map(q => ({
  ...q,
  options: q.options.map((text, i) => ({ label: 'ABCD'[i], text, correct: i === q.answer })),
}))
const TOTAL = CARDS.length
const two = n => String(n).padStart(2, '0')

function Ring({ right, total }) {
  const r = 70, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 180 180" className="ring" aria-hidden="true">
      <circle cx="90" cy="90" r={r} className="ring-bg" />
      <Motion.circle
        cx="90" cy="90" r={r} className="ring-fg"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - right / total) }}
        transition={{ duration: 1.6, delay: .3, ease: [.16, 1, .3, 1] }}
      />
    </svg>
  )
}

function Result({ answers, onRetry }) {
  const score = answers.filter((a, i) => a === CARDS[i].answer).length
  const result = resultFor(score)
  return (
    <Motion.section
      className="qz-results gq-result"
      aria-labelledby="gq-result-title"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .7, ease: [.16, 1, .3, 1] }}
    >
      <div className="qz-score">
        <Ring right={score} total={TOTAL} />
        <div className="qz-score-n">
          <span className="display">{score}</span>
          <span>of {TOTAL}</span>
        </div>
      </div>
      <p className="qz-k">{COPY.resultKicker}</p>
      <h2 id="gq-result-title" className="qz-res-h display">{result.band}</h2>
      <p className="gq-result-body">{result.body}</p>
      <div className="qz-res-actions">
        <Link to="/chapters/1" className="btn btn-primary">{COPY.start} <EntryMotif size={20} /></Link>
        <button type="button" className="btn btn-ghost" onClick={onRetry}>{COPY.again}</button>
      </div>

      <div className="qz-review">
        <h3 className="qz-review-h">{COPY.recap}</h3>
        {CARDS.map((q, i) => {
          const missed = answers[i] !== q.answer
          return (
            <div className="qz-rv" key={q.id}>
              <span className="qz-rv-n">{two(i + 1)}</span>
              <div>
                <T as="p" className="qz-rv-q">{q.sm}</T>
                {missed && <p className="qz-rv-a no">{COPY.youChose} {q.options[answers[i]].text}</p>}
                <p className="qz-rv-a ok">{q.options[q.answer].text}</p>
                <p className="qz-rv-why"><Link to={`/chapters/${q.chapter}`}>Chapter {q.chapter}</Link></p>
              </div>
            </div>
          )
        })}
      </div>
    </Motion.section>
  )
}

// /quiz: six sentences of the book, one at a time, each with four English choices,
// and a result band at the end. Every string shown is in src/seo/pages/grandmother-quiz.js,
// where each Sāmoan sentence names the book line it is printed on.
export default function GrandmotherQuiz() {
  useTitle(STATIC_META[QUIZ_PATH].title)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const stageRef = useRef(null)
  const footRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const q = CARDS[idx]
  const picked = answers[idx]
  const answered = picked !== undefined
  const chosen = answered ? q.options[picked] : null

  // After the first question, a new card or the result starts at the top of the stage.
  const toStage = useCallback(() => {
    requestAnimationFrame(() => stageRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }))
  }, [reduceMotion])

  const choose = useCallback((i) => {
    if (answered || finished) return
    setAnswers(a => { const next = [...a]; next[idx] = i; return next })
    // Bring the feedback and the Next button into view once they show.
    setTimeout(() => footRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }), reduceMotion ? 0 : 480)
  }, [answered, finished, idx, reduceMotion])

  const next = useCallback(() => {
    if (!answered) return
    if (idx + 1 >= TOTAL) setFinished(true)
    else setIdx(idx + 1)
    toStage()
  }, [answered, idx, toStage])

  const retry = () => { setAnswers([]); setIdx(0); setFinished(false); toStage() }

  useEffect(() => {
    const onKey = (e) => {
      if (finished || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'enter' && answered && e.target instanceof Element && e.target.closest('.qz-opt')) { e.preventDefault(); next(); return }
      if (e.target instanceof Element && e.target.closest('a, button, input, select, textarea, summary, [role="button"]')) return
      const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }
      if (k in map) { e.preventDefault(); choose(map[k]) }
      if (k === 'enter' && answered) { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, answered, finished])

  return (
    <div className="catalog-page gq">
      <header className="catalog-hero band grain gq-hero">
        <div className="wrap">
          <p className="eyebrow">{COPY.eyebrow}</p>
          <h1 className="display">{COPY.h1[0]}<br />{COPY.h1[1]}</h1>
          <p>{COPY.lead}</p>
        </div>
      </header>

      <div className="wrap gq-body">
        <div className="gq-stage" ref={stageRef}>
          {finished ? (
            <Result answers={answers} onRetry={retry} />
          ) : (
            <section aria-labelledby="gq-prompt">
              <div className="gq-progress">
                <p className="qz-count"><span className="display">{two(idx + 1)}</span> / {TOTAL}</p>
                <div className="qz-segs" role="progressbar" aria-valuemin="1" aria-valuemax={TOTAL} aria-valuenow={idx + 1} aria-label={`Sentence ${idx + 1} of ${TOTAL}`}>
                  {CARDS.map((card, i) => {
                    const a = answers[i]
                    return <i key={card.id} className={a === undefined ? (i === idx ? 'cur' : '') : a === card.answer ? 'ok' : 'no'} />
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <Motion.div
                  key={q.id}
                  className="qz-card gq-card"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: .45, ease: [.16, 1, .3, 1] }}
                >
                  <p className="catalog-kicker">{COPY.kicker}</p>
                  <T as="p" className="gq-phrase">{q.sm}</T>
                  <h2 id="gq-prompt" className="gq-prompt">{q.prompt}</h2>
                  <QuizChoices q={q} picked={picked} answered={answered} choose={choose} />
                  {chosen && (
                    <Motion.div className={`qz-why ${chosen.correct ? 'ok' : 'no'}`} role="status" initial={{ opacity: 0, y: 12, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} transition={{ duration: .45, ease: [.16, 1, .3, 1] }}>
                      <div className="qz-why-in">
                        <span className="qz-why-tile" aria-hidden="true"><Tile kind={chosen.correct ? 'dot' : 'ring'} framed /></span>
                        <div>
                          <p className="qz-why-h">{chosen.correct ? COPY.right : COPY.wrong}</p>
                          <p className="qz-why-p">
                            {!chosen.correct && <>{COPY.sheSaid} <strong>{q.options[q.answer].text}</strong> </>}
                            {COPY.printedIn} Chapter {q.chapter}.
                          </p>
                        </div>
                      </div>
                    </Motion.div>
                  )}
                  {chosen && (
                    <div className="qz-foot" ref={footRef}>
                      <button type="button" className="btn btn-primary" onClick={next}>
                        {idx + 1 >= TOTAL ? COPY.finish : COPY.next} <span className="arr">→</span>
                      </button>
                    </div>
                  )}
                </Motion.div>
              </AnimatePresence>

              <Link to="/chapters/1" className="gq-skip">{COPY.skip} <EntryMotif size={18} /></Link>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
