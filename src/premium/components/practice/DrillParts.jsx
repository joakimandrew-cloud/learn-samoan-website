import { AnimatePresence, motion as Motion } from 'motion/react'

// Ported from the Tongan drill parts. The Samoan sentence comes whole from the
// printed figure: `body` keeps its own full stop, so nothing is added to it.
export function DrillSentence({ particle, body, pending, still = false }) {
  // Longer sentences get smaller type so the marker never sits alone on a line.
  const len = (particle || 'xxxxx').length + body.length
  const size = len > 22 ? 'is-long' : len > 14 ? 'is-mid' : ''
  return (
    <p className={`dr-sentence ${size}`} lang="sm">
      <span className="dr-slot dr-particle">
        <AnimatePresence mode="popLayout" initial={false}>
          <Motion.span
            key={particle || 'empty'}
            initial={still ? false : { y: '80%', opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-80%', opacity: 0, filter: 'blur(8px)' }}
            transition={{ duration: still ? 0 : .5, ease: [.16, 1, .3, 1] }}
            className={pending ? 'dr-gap' : ''}
          >
            {particle || '     '}
          </Motion.span>
        </AnimatePresence>
      </span>{' '}
      <span className="dr-body">{body}</span>
    </p>
  )
}

export function DrillChoices({ options, pick, correct, choose, demo = false }) {
  const Choice = demo ? 'div' : 'button'
  return (
    <div className="dr-opts">
      {options.map((o, k) => {
        const st = !pick ? '' : o.p === correct ? 'is-right' : o === pick ? 'is-wrong' : 'is-dim'
        return (
          <Choice key={o.t} className={`dr-opt ${st}`} onClick={demo ? undefined : () => choose(o)} disabled={demo ? undefined : Boolean(pick) && st === 'is-dim'}>
            <kbd>{k + 1}</kbd>
            <span lang="sm">{o.p}</span>
          </Choice>
        )
      })}
    </div>
  )
}

// The figure's own note for the state explains the answer.
export function DrillFeedback({ note, right }) {
  return (
    <p>
      <strong>{right ? 'Yes.' : 'Not quite.'}</strong>{' '}{note}
    </p>
  )
}
