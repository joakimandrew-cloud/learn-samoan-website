/**
 * Figure: the parts of one printed sentence, in order. Tap a part to read
 * what it does; until then the figure steps through the parts by itself.
 * The Tongan site's Lesson 1 "three parts" figure, made general.
 *
 * data: { sentence: { sm, en }, parts: [{ sm, gloss, role, note }] }
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import '../../styles/ix-anatomy.css'

export default function Anatomy({ data }) {
  const parts = data.parts
  const [on, setOn] = useState(0)
  const [auto, setAuto] = useState(true)
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-20% 0px' })
  const still = useReducedMotion()
  useEffect(() => {
    if (!auto || !inView || still) return
    const id = setInterval(() => setOn(o => (o + 1) % parts.length), 2600)
    return () => clearInterval(id)
  }, [auto, inView, still, parts.length])
  const pick = i => { setOn(i); setAuto(false) }
  const part = parts[on]
  return (
    <div className="ix-anatomy" ref={ref}>
      <div className={`pf ${parts.length > 3 ? 'is-many' : ''}`} style={{ '--n': parts.length }} role="group" aria-label="Parts of the sentence">
        {parts.map((p, i) => (
          <button key={i} type="button" className={`pf-part ${on === i ? 'is-on' : ''}`} onClick={() => pick(i)} aria-pressed={on === i}>
            <span className="pf-num">{i + 1}</span>
            <T className="pf-w">{p.sm}</T>
            <span className="pf-g">{p.gloss}</span>
            <span className="pf-role"><Md text={p.role} /></span>
          </button>
        ))}
      </div>
      <p className="ix-anatomy-en"><T>{data.sentence.sm}</T> <span>{data.sentence.en}</span></p>
      <div className="pf-what" aria-live="polite">
        <AnimatePresence mode="wait">
          <Motion.p key={on} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .25 }}>
            <strong><Md text={part.role} />.</strong> <Md text={part.note} />
          </Motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
