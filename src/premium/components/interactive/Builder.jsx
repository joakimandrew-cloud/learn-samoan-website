/**
 * Figure: build a sentence by choosing one option per slot. Only sentences the
 * chapter prints can appear: choosing an option shows the printed sentence
 * that uses it, keeping as many of the other choices as the chapter allows.
 * Options that need another slot to move are drawn lighter. The Tongan site's
 * Lesson 1 "build any sentence" figure, made general.
 *
 * data: {
 *   slots: [{ key, label, options: [{ id, sm, en }] }],
 *   sentences: [{ pick: { <slot key>: <option id> }, sm, en }]
 * }
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import '../../styles/ix-builder.css'

export default function Builder({ data }) {
  const { slots, sentences } = data
  const [at, setAt] = useState(0)
  const current = sentences[at]

  // For every option: is there a printed sentence with it and every other
  // current choice? If not, choosing it moves another slot.
  const reachable = useMemo(() => {
    const out = {}
    for (const slot of slots) {
      out[slot.key] = {}
      for (const o of slot.options) {
        out[slot.key][o.id] = sentences.some(s => s.pick[slot.key] === o.id && slots.every(other => other.key === slot.key || s.pick[other.key] === current.pick[other.key]))
      }
    }
    return out
  }, [slots, sentences, current])

  const choose = (slotKey, optionId) => {
    let best = -1
    let bestScore = -1
    sentences.forEach((s, i) => {
      if (s.pick[slotKey] !== optionId) return
      const score = slots.filter(other => s.pick[other.key] === current.pick[other.key]).length
      if (score > bestScore) { best = i; bestScore = score }
    })
    if (best >= 0) setAt(best)
  }

  return (
    <div className="cb ix-builder">
      <div className="cb-out">
        <div className="cb-sentence">
          <AnimatePresence mode="popLayout" initial={false}>
            <Motion.span key={current.sm} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .35, ease: [.16, 1, .3, 1] }}>
              <T>{current.sm}</T>
            </Motion.span>
          </AnimatePresence>
        </div>
        <div className="cb-en" aria-live="polite">{current.en}</div>
      </div>
      <div className="cb-controls">
        {slots.map(slot => (
          <div className="cb-row" key={slot.key}>
            <span className="cb-label"><Md text={slot.label} /></span>
            <div className="cb-chips" role="group" aria-label={String(slot.label).replace(/\*/g, '')}>
              {slot.options.map(o => {
                const on = current.pick[slot.key] === o.id
                return (
                  <button key={o.id} type="button" className={`cb-chip ${on ? 'is-on' : ''} ${!on && !reachable[slot.key][o.id] ? 'is-far' : ''}`} onClick={() => choose(slot.key, o.id)} aria-pressed={on}>
                    <T>{o.sm}</T><span>{o.en}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
