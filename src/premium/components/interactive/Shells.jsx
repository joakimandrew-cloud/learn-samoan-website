/**
 * The two frames every chapter interactive sits in, both inherited from the
 * Tongan site: the numbered figure panel (.fig, from Lesson 1's figures) for
 * things that illustrate a point, and the "Interactive practice" band
 * (.embedded-drill wrapping .premium-core, from the embedded drills) for
 * things the learner answers. Plus the deck chrome the practice cards share.
 */
import { Component, useContext, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'motion/react'
import { DrillEndLinks } from '../../drills/drill-end-links.js'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { keepControlKeysLocal } from './engine.js'

export function Figure({ label, title, caption, children }) {
  const titleId = useId()
  return (
    <Motion.figure
      className="fig ix-fig"
      aria-labelledby={titleId}
      onKeyDown={keepControlKeysLocal}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: .8, ease: [.16, 1, .3, 1] }}
    >
      <div className="fig-head">
        {label && <span className="fig-k">{label}</span>}
        <span className="fig-t" id={titleId}><Md text={title} /></span>
      </div>
      {children}
      {caption && <figcaption><Md text={caption} /></figcaption>}
    </Motion.figure>
  )
}

export function Practice({ title, intro, children }) {
  return (
    <section className="lesson-practice embedded-drill ix-practice" aria-label={`Interactive practice: ${String(title).replace(/\*/g, '')}`}>
      <header>
        <span>Interactive practice</span>
        <h3><Md text={title} /></h3>
        {intro && <p><Md text={intro} /></p>}
      </header>
      <div className="premium-core lesson-core" onKeyDown={keepControlKeysLocal}>
        {children}
      </div>
    </section>
  )
}

/* The row above every practice card: progress, score, streak, reset. */
export function DeckHeader({ deck, unit = 'correct' }) {
  const perfect = deck.score.total > 0 && deck.score.right === deck.score.total
  return (
    <div className="pcs-card-row">
      <div className="pcs-progress-wrap">
        <span className="pcs-progress">{deck.finished ? deck.total : deck.index + 1} / {deck.total}</span>
        <div className="pcs-progress-bar"><div className="pcs-progress-fill" style={{ width: `${deck.pct}%` }} /></div>
      </div>
      <div className="pcs-stats">
        <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
          <span className="pcs-stat-value">{deck.score.right}</span>
          <span className="pcs-stat-label"> / {deck.score.total} {unit}</span>
        </span>
        {deck.streak > 1 && (
          <span className="pcs-stat pcs-streak">
            <span className="pcs-stat-value">{deck.streak}</span>
            <span className="pcs-stat-label"> in a row</span>
          </span>
        )}
        <button onClick={deck.reset} className="pcs-reset" type="button" aria-label="Start this practice again">reset</button>
      </div>
    </div>
  )
}

/* The end-of-deck card (the Tongan DeckComplete). On a drill page, DrillFrame
   provides the exits "Back to Chapter N" and "All drills"; in a chapter there
   is no provider, so the learner stays in the chapter and nothing is added.
   fresh={false} drops "start fresh" where there is nothing to clear. */
export function DeckComplete({ deck, unit = 'correct', touch, fresh = true }) {
  const links = useContext(DrillEndLinks)
  const { right, total } = deck.score
  const perfect = total > 0 && right === total
  return (
    <>
      <div className="pcs-noun-frame" role="status">
        <div className="pcs-prompt-label">Deck complete</div>
        <div className="pcs-noun ix-done-score">{right} / {total} {unit}</div>
        <div className="pcs-noun-gloss">{perfect ? 'Perfect: every answer right.' : 'You made it through the whole deck.'}</div>
      </div>
      <div className="pcs-next-container pcs-end-row">
        {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to go again</span>}
        {links?.chapterNum && <Link to={`/chapters/${links.chapterNum}`} className="pcs-end-link">Back to Chapter {links.chapterNum}</Link>}
        {links?.backTo && <Link to={links.backTo} className="pcs-end-link">All drills</Link>}
        {fresh && <button onClick={deck.reset} className="pcs-reset" type="button">start fresh</button>}
        <button onClick={deck.again} className="pcs-next" type="button">Go again {'→'}</button>
      </div>
    </>
  )
}

/* The Next row under an answered card. */
export function NextRow({ onNext, touch, label = 'Next' }) {
  return (
    <div className="pcs-next-container">
      {!touch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to continue</span>}
      <button onClick={onNext} className="pcs-next" type="button">{label} {'→'}</button>
    </div>
  )
}

/* One broken interactive must never take the chapter down with it. */
export class InteractiveBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Interactive failed to render', this.props.id, error) }
  render() {
    if (this.state.failed) return <aside className="lesson-practice drill-missing">This interactive could not be shown.</aside>
    return this.props.children
  }
}
