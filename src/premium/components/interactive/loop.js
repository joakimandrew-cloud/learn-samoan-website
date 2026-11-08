/**
 * An Interactive figure's place in the page-wide queue the moving figures use
 * (figure-engine/lib/clock.js; plan 2026-11-09-figure-loops). While at least half of its
 * figure panel is in view and nothing else is moving, it takes a turn and shows its next
 * example, and it keeps going; two figures in view take their turns one after the other.
 * The first tap or key press anywhere in the panel stops it for good. With reduced motion,
 * or ?still on a test build, it never moves. It only ever shows the examples its data
 * already holds, in their own order.
 *
 * The panel carries `data-loop` ("on" while it loops, "off" once stopped) and
 * `data-example` (the example showing), which scripts/figure-loop-sweep.cjs reads.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LOOP_HOLD_MS, reducedMotion, stillPage, useAutoTurn } from '../../figure-engine/lib/clock.js'

/** How long a change takes to settle before the turn passes on, so two never move at once. */
export const SETTLE_MS = 600

/** A turn that shows one more example: the one showing holds, then the next comes in. */
export const nextTurn = advance => turn => {
  turn.later(advance, LOOP_HOLD_MS)
  turn.later(turn.done, LOOP_HOLD_MS + SETTLE_MS)
}

/** A turn that goes once round every state of one example and back to the first. */
export const roundTurn = (count, show, dwell = LOOP_HOLD_MS) => turn => {
  for (let i = 1; i <= count; i += 1) turn.later(() => show(i % count), dwell * i)
  turn.later(turn.done, dwell * count + SETTLE_MS)
}

/**
 * `rootRef` is the Interactive's own element; the queue watches the figure panel around it.
 * `count` is how many examples there are (one or none never loops), `at` the one showing.
 * Returns `auto`: true while it may still loop, so a live region can stay quiet until the
 * student takes over.
 */
export function useLoop({ id, rootRef, count, at, play, away }) {
  const [auto, setAuto] = useState(() => !reducedMotion() && !stillPage())
  const panel = useRef(null)
  useLayoutEffect(() => {
    panel.current = rootRef.current?.closest('figure') ?? rootRef.current
  }, [rootRef])
  const loops = count > 1
  const stop = useAutoTurn({ id: `ix:${id}`, rootRef: panel, enabled: auto && loops, play, away })
  const takeOver = useCallback(() => {
    stop()
    setAuto(false)
  }, [stop])

  useEffect(() => {
    const node = panel.current
    if (!node || !auto || !loops) return undefined
    node.addEventListener('pointerdown', takeOver, true)
    node.addEventListener('keydown', takeOver, true)
    return () => {
      node.removeEventListener('pointerdown', takeOver, true)
      node.removeEventListener('keydown', takeOver, true)
    }
  }, [auto, loops, takeOver])

  useEffect(() => {
    const node = panel.current
    if (!node) return undefined
    if (loops) node.dataset.loop = auto ? 'on' : 'off'
    node.dataset.example = String(at)
    return () => {
      delete node.dataset.loop
      delete node.dataset.example
    }
  }, [at, auto, loops])

  return auto && loops
}
