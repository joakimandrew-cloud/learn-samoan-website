/**
 * Practice, one step at a time (reviews/lesson-simplify-2026-11-06/Direction.md part 2:
 * "the reading stays a single scroll; anything the student does is stepped"). Copied from
 * the Lea-Faka-Tonga SteppedExercises.jsx and fitted to this site's ExerciseSet: the same
 * data, the same saved progress (ls-exercises-v1), the same reveal, self-check, multiple
 * choice and matching, given items and answer notes. Every prompt stays on the page, and
 * only the current item carries its button; tapping a prompt makes it current. A collapsed
 * set keeps its text in the DOM, so anchors, find-in-page and the reading-text comparison
 * hold. New interface words carry data-ui.
 */
import { useEffect, useMemo, useState } from 'react'
import { Md } from './Blocks.jsx'
import { GivenItem, MatchingItems, McqPresentation, Prompt } from './Exercises.jsx'
import { exerciseAnchor, exerciseProgressFromSnapshot, initialExerciseSnapshot, writeExerciseSnapshot } from '../../lib/exercise-progress.js'
import '../../styles/exercise-feedback.css'

/** The item that carries the button: a chosen one if it is still open, else the first open, unskipped one. */
// eslint-disable-next-line react-refresh/only-export-components
export function currentItemId(items, isDone, skipped = new Set(), chosen = null) {
  const open = items.filter(item => !item.given && !isDone(item))
  if (chosen && open.some(item => item.id === chosen)) return chosen
  return open.find(item => !skipped.has(item.id))?.id ?? null
}

function isAnswered(item, record) {
  if (!record) return false
  if (record.kind === 'reveal') return record.self !== null && record.self !== undefined
  if (record.kind === 'mcq') return (record.tries || []).includes(item.correct)
  return false
}

/** A prompt that makes its item current when tapped; text stays text, so nothing is lost to the comparison. */
function TapPrompt({ item, onChoose, fill = null }) {
  if (!onChoose) return <p className="xi-prompt"><Prompt text={item.prompt} fill={fill} /></p>
  const choose = event => {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onChoose()
  }
  return (
    <p className="xi-prompt is-tap" role="button" tabIndex={0} onClick={choose} onKeyDown={choose}>
      <Prompt text={item.prompt} fill={fill} />
    </p>
  )
}

function RevealRow({ item, n, record, current, onChange, onSkip, onChoose }) {
  const open = record?.open === true
  const self = record?.self ?? null
  const grade = value => onChange({ kind: 'reveal', open: true, self: value })
  return (
    <li className={`xi ${current ? 'is-current' : ''} ${self === true ? 'is-right' : self === false ? 'is-late' : ''} ${open ? 'is-open' : ''}`}>
      <span className="xi-n">{n}</span>
      <div className="xi-main">
        {current || open ? <p className="xi-prompt"><Prompt text={item.prompt} /></p> : <TapPrompt item={item} onChoose={onChoose} />}
        {!open && current && (
          <div className="xi-now">
            <button type="button" className="fx-b is-main xi-go" onClick={() => onChange({ kind: 'reveal', open: true, self: null })}>Say it, then show the answer</button>
            <button type="button" className="xi-skip" onClick={onSkip}>Skip this one</button>
          </div>
        )}
        {open && (
          <div className="reveal-a">
            <span className="reveal-ans"><Md text={item.answer} /></span>
            {self === null ? (
              <span className="self">
                <button type="button" onClick={() => grade(true)} className="self-b ok">I had it</button>
                <button type="button" onClick={() => grade(false)} className="self-b no">Not yet</button>
              </span>
            ) : (
              <span className="self-done">{self ? 'Nice.' : 'It will come. Try it again later.'}</span>
            )}
          </div>
        )}
      </div>
      <span className="xi-mark" aria-hidden="true">{self === true ? '✓' : ''}</span>
    </li>
  )
}

function McqRow({ item, n, current, tries, activeItemId, onInteract, onTriesChange, onSkip, onChoose }) {
  const solved = tries.includes(item.correct)
  const pick = option => {
    if (solved || tries.includes(option)) return
    onInteract(item.id)
    onTriesChange([...tries, option])
  }
  if (!current && !tries.length) {
    return (
      <li className="xi">
        <span className="xi-n">{n}</span>
        <div className="xi-main"><TapPrompt item={item} onChoose={onChoose} /></div>
        <span className="xi-mark" aria-hidden="true" />
      </li>
    )
  }
  return (
    <>
      <McqPresentation item={item} n={n} tries={tries} onPick={pick} announce={activeItemId === item.id} />
      {current && !solved && <li className="xi-skip-row"><button type="button" className="xi-skip" onClick={onSkip}>Skip this one</button></li>}
    </>
  )
}

function useSetProgress(ex, compact, onProgress) {
  const [snapshot, setSnapshot] = useState(() => initialExerciseSnapshot(ex, compact))
  const progress = useMemo(() => exerciseProgressFromSnapshot(ex, snapshot), [ex, snapshot])
  useEffect(() => { if (!compact) writeExerciseSnapshot(ex, snapshot) }, [compact, ex, snapshot])
  useEffect(() => { onProgress?.(ex.id, progress.state, progress.total) }, [ex.id, progress.state, progress.total]) // eslint-disable-line react-hooks/exhaustive-deps
  return { snapshot, setSnapshot, progress }
}

/** The progress dots, as ExerciseSet draws them. */
function Dots({ ex, state }) {
  const asked = ex.items.filter(item => !item.given)
  const answered = Object.keys(state).length
  return (
    <div className="xs-prog" role="progressbar" aria-valuemin="0" aria-valuemax={asked.length} aria-valuenow={answered} aria-label={`${answered} of ${asked.length} done`}>
      {asked.map(it => <i key={it.id} className={it.id in state ? (state[it.id] ? 'ok' : 'late') : ''} />)}
    </div>
  )
}

/** One set's items, with one current. */
function SetItems({ ex, snapshot, setSnapshot, progress, onDone, onNext, hasNext }) {
  const [skipped, setSkipped] = useState(() => new Set())
  const [chosen, setChosen] = useState(null)
  const [activeFeedbackId, setActiveFeedbackId] = useState(null)
  const isMcq = ex.type === 'mcq' && ex.items.every(it => it.given || it.options?.length)
  const isMatching = ex.type === 'matching'
  const update = (id, record) => setSnapshot(current => ({ ...current, items: { ...current.items, [id]: record } }))
  const currentId = currentItemId(ex.items, item => isAnswered(item, snapshot.items[item.id]), skipped, chosen)
  const answered = Object.keys(progress.state).length
  const asked = ex.items.filter(item => !item.given).length
  const finished = currentId === null

  useEffect(() => { if (finished) onDone?.() }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  const skip = id => { setSkipped(s => new Set(s).add(id)); if (chosen === id) setChosen(null) }

  return (
    <>
      {isMatching ? (
        <MatchingItems
          items={ex.items}
          matchedIds={ex.items.filter(item => snapshot.items[item.id]?.matched === true).map(item => item.id)}
          onChange={ids => setSnapshot(current => ({ ...current, items: Object.fromEntries(ids.map(id => [id, { kind: 'matching', matched: true }])) }))}
        />
      ) : (
        <ol className="xs-items">
          {ex.items.map((it, i) => {
            const n = it.n ?? i + 1
            if (it.given) return <GivenItem key={it.id} item={it} n={n} />
            const choose = it.id === currentId ? null : () => setChosen(it.id)
            return isMcq ? (
              <McqRow
                key={it.id}
                item={it}
                n={n}
                current={it.id === currentId}
                tries={snapshot.items[it.id]?.tries || []}
                activeItemId={activeFeedbackId}
                onInteract={setActiveFeedbackId}
                onTriesChange={tries => update(it.id, { kind: 'mcq', tries })}
                onSkip={() => skip(it.id)}
                onChoose={choose}
              />
            ) : (
              <RevealRow
                key={it.id}
                item={it}
                n={n}
                current={it.id === currentId}
                record={snapshot.items[it.id]}
                onChange={record => update(it.id, record)}
                onSkip={() => skip(it.id)}
                onChoose={choose}
              />
            )
          })}
        </ol>
      )}
      {ex.answerNote && answered > 0 && (
        <aside className="xs-answer-note"><span className="xs-answer-note-k">About the answers</span><p><Md text={ex.answerNote} /></p></aside>
      )}
      {answered === asked && <p className="xs-complete" role="status">Practice complete.</p>}
      {finished && hasNext && (
        <button type="button" className="fx-b is-main xs-next" onClick={onNext}>Next exercise</button>
      )}
    </>
  )
}

/** A set that stands in the reading (an inline exercise, Quick Practice, "Can You Do This?"): open, stepped. */
export function SteppedSet({ ex, onProgress, compact = false }) {
  const { snapshot, setSnapshot, progress } = useSetProgress(ex, compact, onProgress)
  return (
    <section className={`xs is-stepped ${compact ? 'is-quick' : ''}`} id={exerciseAnchor(ex)}>
      <header className="xs-head">
        <div>
          <span className="xs-k">{compact ? ex.title : ex.number == null ? 'Self-check' : `Exercise ${ex.number}`}</span>
          {!compact && ex.number != null && ex.title && <h3 className="xs-t"><Md text={ex.title} /></h3>}
          {ex.instructions && <p className="xs-i"><Md text={ex.instructions} /></p>}
        </div>
        <Dots ex={ex} state={progress.state} />
      </header>
      <SetItems ex={ex} snapshot={snapshot} setSnapshot={setSnapshot} progress={progress} />
    </section>
  )
}

/** One closed-or-open row in the Exercises section. */
function ExerciseRow({ ex, open, onToggle, onNext, hasNext, onProgress }) {
  const { snapshot, setSnapshot, progress } = useSetProgress(ex, false, onProgress)
  const answered = Object.keys(progress.state).length
  const asked = ex.items.filter(item => !item.given).length
  return (
    <details
      className="px-row xs is-stepped"
      id={exerciseAnchor(ex)}
      open={open}
      onToggle={event => { if (event.currentTarget.open !== open) onToggle(event.currentTarget.open) }}
    >
      <summary className="px-sum" onClick={event => { event.preventDefault(); onToggle(!open) }}>
        <span className="px-sum-main">
          <span className="xs-k">{ex.number == null ? 'Self-check' : `Exercise ${ex.number}`}</span>
          {ex.number != null && ex.title && <h3 className="xs-t"><Md text={ex.title} /></h3>}
          {ex.instructions && <p className="xs-i"><Md text={ex.instructions} /></p>}
        </span>
        <span className="px-sum-c" data-ui="">{`${answered} of ${asked} done`}</span>
        <span className="px-chev" aria-hidden="true" />
      </summary>
      <div className="px-body">
        <Dots ex={ex} state={progress.state} />
        <SetItems ex={ex} snapshot={snapshot} setSnapshot={setSnapshot} progress={progress} onNext={onNext} hasNext={hasNext} />
      </div>
    </details>
  )
}

/** The set a hash points at, if any. */
function linkedSet(exercises, hash) {
  const id = String(hash || '').replace(/^#/, '')
  return id ? exercises.find(ex => exerciseAnchor(ex) === id) : null
}

/** The first set with an item left to answer, from saved progress. */
// eslint-disable-next-line react-refresh/only-export-components
export function firstOpenSet(exercises, stored) {
  return exercises.find(ex => Object.keys(stored[ex.id]?.state || {}).length < ex.items.filter(item => !item.given).length) || null
}

/** The Exercises section: every set a row, one open, the first unfinished or the one a link names. */
export function SteppedExercises({ exercises, onProgress, stored }) {
  const [openId, setOpenId] = useState(() => (linkedSet(exercises, window.location.hash) || firstOpenSet(exercises, stored) || exercises[0])?.id ?? null)

  // A link to #ex-3 (or "Continue exercises") on this same page opens that set.
  useEffect(() => {
    const onHash = () => {
      const hit = linkedSet(exercises, window.location.hash)
      if (hit) setOpenId(hit.id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [exercises])

  return (
    <div className="px-list">
      {exercises.map((ex, i) => {
        const nextEx = exercises[i + 1]
        return (
          <ExerciseRow
            key={ex.id}
            ex={ex}
            open={openId === ex.id}
            onToggle={isOpen => setOpenId(isOpen ? ex.id : null)}
            hasNext={Boolean(nextEx)}
            onNext={() => {
              setOpenId(nextEx.id)
              requestAnimationFrame(() => document.getElementById(exerciseAnchor(nextEx))?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }))
            }}
            onProgress={onProgress}
          />
        )
      })}
    </div>
  )
}
