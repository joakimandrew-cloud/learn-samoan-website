/**
 * Figure: the parts of one printed sentence, in order. Tap a part to read
 * what it does; until then the figure goes round the parts by itself, in the
 * same one-at-a-time queue as the moving figures (loop.js).
 * The Tongan site's Lesson 1 "three parts" figure, made general.
 *
 * data: { sentence: { sm, en }, parts: [{ sm, gloss, role, note }] }
 */
import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { roundTurn, useLoop } from './loop.js'
import '../../styles/ix-anatomy.css'

// Each part stays this long before the next one lights, the pace it has always had.
const PART_MS = 2600

export default function Anatomy({ data, id }) {
  const parts = data.parts
  const uid = useId()
  const [on, setOn] = useState(0)
  const ref = useRef(null)
  // One turn goes round every part and back to the first; scrolled away, it starts again from the first.
  const auto = useLoop({ id, rootRef: ref, count: parts.length, at: on, play: roundTurn(parts.length, setOn, PART_MS), away: () => setOn(0) })
  const part = parts[on]
  return (
    <div className="ix-anatomy" ref={ref}>
      <div className={`pf ${parts.length > 3 ? 'is-many' : ''}`} style={{ '--n': parts.length }} role="group" aria-label="Parts of the sentence">
        {parts.map((p, i) => (
          <button key={i} type="button" className={`pf-part ${on === i ? 'is-on' : ''}`} onClick={() => setOn(i)} aria-pressed={on === i} aria-labelledby={`${uid}-w${i} ${uid}-r${i}`}>
            <span className="pf-num" aria-hidden="true">{i + 1}</span>
            <T className="pf-w" id={`${uid}-w${i}`}>{p.sm}</T>
            <span className="pf-g">{p.gloss}</span>
            <span className="pf-role" id={`${uid}-r${i}`}><Md text={p.role} /></span>
          </button>
        ))}
      </div>
      <p className="ix-anatomy-en"><T>{data.sentence.sm}</T> <span>{data.sentence.en}</span></p>
      {/* Read out only when the student picks a part, never on every turn of the loop. Every
          part's note is laid in the same place, unseen, so the page below never moves (ix-hold). */}
      <div className="pf-what ix-hold" aria-live={auto ? 'off' : 'polite'}>
        {parts.map((p, i) => (i === on ? null : (
          <p key={i} className="ix-hold-size" aria-hidden="true"><strong><Md text={p.role} />.</strong> <Md text={p.note} /></p>
        )))}
        <AnimatePresence mode="wait">
          <Motion.p key={on} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .25 }}>
            <strong><Md text={part.role} />.</strong> <Md text={part.note} />
          </Motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
