/**
 * Figure: a paradigm explorer. Forms sit in a grid by row and column (the
 * preverbal pronouns by person and number, the demonstratives by distance).
 * Tap a form to read it: its meaning, a note and a printed example. With
 * `quiz`, a second mode, Find the form, asks for every form once by its
 * meaning, in a fresh order each round, and counts the ones found first time.
 * The Tongan site's pronoun paradigm drill and clusivity matrix, made a
 * figure and fed from chapter data.
 *
 * data: {
 *   rowLabel?, colLabel?,   what the rows and the columns sort by
 *   cols: [label],
 *   rows: [{ label, cells: [{ sm, en?, note?, example?: { sm, en } } | null] }],
 *   quiz?                   offer the Find the form mode
 * }
 */
import { Fragment, useId, useMemo, useReducer, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { Md } from '../lesson/InlineMarkdown.jsx'
import { keepControlKeysLocal, reshuffle, shuffle } from './engine.js'
import { curly, gridCells, newRound, plain, promptsFor, quizReducer, stepCell, stop, verdictParts } from './grid-logic.js'
import '../../styles/ix-grid.css'

const ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }

function startRound(entries) {
  const keys = entries.map(e => e.key)
  return newRound(keys, shuffle(keys))
}

// Which row and column a cell sits in, as the small-caps line above a form.
function Where({ entry, rows, cols }) {
  return (
    <>
      <Md text={rows[entry.r].label} />
      <span aria-hidden="true"> · </span>
      <span className="visually-hidden">, </span>
      <Md text={cols[entry.c]} />
    </>
  )
}

// A cell's meaning: its English, or else the row and column it sits in.
function Meaning({ entry, rows, cols }) {
  if (entry.cell.en) return curly(entry.cell.en)
  return <><Md text={rows[entry.r].label} />, <Md text={cols[entry.c]} /></>
}

function Detail({ entry, rows, cols }) {
  const { cell } = entry
  return (
    <div className="cb-out ix-grid-panel ix-grid-detail">
      <div className="ix-grid-k"><Where entry={entry} rows={rows} cols={cols} /></div>
      <div className="cb-sentence ix-grid-form">
        <AnimatePresence mode="popLayout" initial={false}>
          <Motion.span key={entry.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .3, ease: [.16, 1, .3, 1] }}>
            <T>{cell.sm}</T>
          </Motion.span>
        </AnimatePresence>
      </div>
      {cell.en && <div className="cb-en">{curly(cell.en)}</div>}
      {cell.note && <p className="ix-grid-note"><Md text={cell.note} /></p>}
      {cell.example && <p className="ix-grid-ex"><T>{cell.example.sm}</T> <span>{curly(cell.example.en)}</span></p>}
    </div>
  )
}

// The verdict on the last tap, under the prompt.
function Status({ last, byKey }) {
  const parts = verdictParts(last, byKey)
  if (!parts) return null
  return (
    <>
      {last.type === 'right' && <span className="ix-grid-mark" aria-hidden="true">{'✓'}</span>}
      {last.type === 'wrong' && <span className="ix-grid-mark" aria-hidden="true">{'✕'}</span>}
      {parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{curly(p)}</Fragment> : <T key={i}>{p.sm}</T>))}
    </>
  )
}

export default function Grid({ data }) {
  const { cols, rows } = data
  const uid = useId()
  const entries = useMemo(() => gridCells(rows, cols.length), [rows, cols.length])
  const byKey = useMemo(() => new Map(entries.map(e => [e.key, e])), [entries])
  const prompts = useMemo(() => promptsFor(entries), [entries])
  // Some prompt shows its row and column under the English.
  const anyWhere = Object.values(prompts).some(p => p.where && p.en)
  const [mode, setMode] = useState('explore')
  const [selected, setSelected] = useState(() => entries[0]?.key ?? null)
  const [quiz, dispatch] = useReducer(quizReducer, entries, startRound)
  const buttons = useRef(new Map())
  const exploreRef = useRef(null)
  const quizRef = useRef(null)

  const asking = Boolean(data.quiz) && mode === 'quiz'
  const total = quiz.order.length
  const targetKey = quiz.at < total ? quiz.order[quiz.at] : null
  const target = targetKey ? byKey.get(targetKey) : null
  const done = asking && !target
  const hintKey = quiz.missed ? targetKey : null
  const chosen = byKey.get(selected)
  const late = entries.filter(e => quiz.found[e.key] === 'late')

  const where = e => `${plain(rows[e.r].label)}, ${plain(cols[e.c])}`
  const askText = e => {
    const p = prompts[e.key]
    if (!p.en) return where(e)
    return p.where ? `${p.en} (${where(e)})` : p.en
  }

  // One polite line for screen readers: what the chosen form is, or the
  // verdict and the next prompt.
  let announce = ''
  if (!asking && chosen) {
    const { cell } = chosen
    announce = [`${cell.sm}${cell.en ? `: ${cell.en}` : ''}.`, cell.note && plain(cell.note), cell.example && `${cell.example.sm} ${cell.example.en}`].filter(Boolean).join(' ')
  } else if (asking) {
    const last = quiz.last
    const verdict = verdictParts(last, byKey)
    const lines = []
    if (verdict) lines.push(verdict.map(p => (typeof p === 'string' ? p : p.sm)).join(''))
    if (last?.type === 'new') lines.push('New round.')
    if (!target) lines.push(`Round complete: ${quiz.firstTime} of ${total} found first time.${late.length ? ` Found after a miss: ${late.map(e => e.cell.sm).join(', ')}${stop(late.at(-1).cell.sm)}` : ''}`)
    else if (last?.type !== 'wrong') {
      const ask = askText(target)
      lines.push(`Find the form for: ${ask}${stop(ask)} ${quiz.at + 1} of ${total}.`)
    }
    announce = lines.join(' ')
  }

  const startNewRound = viaKeyboard => {
    dispatch({ type: 'new', order: reshuffle(quiz.keys, targetKey ?? quiz.order[total - 1]) })
    // The end-of-round button goes away; keep a keyboard learner in the grid.
    if (viaKeyboard && done && entries[0]) buttons.current.get(entries[0].key)?.focus()
  }

  const tap = (key, event) => {
    // The second click of a double tap is never a new answer, even when the
    // layout has moved a different form under the finger.
    if (event.detail > 1) return
    const viaKeyboard = event.detail === 0
    if (!asking) { setSelected(key); return }
    dispatch({ type: 'tap', key })
    // A keyboard learner who misses is taken to the outlined answer.
    if (viaKeyboard && targetKey && key !== targetKey && !quiz.found[key]) buttons.current.get(targetKey)?.focus()
  }

  const onGridKey = e => {
    const dir = ARROWS[e.key]
    const key = e.target?.dataset?.cell
    if (!dir || !key) return
    const [r, c] = key.split('-').map(Number)
    const next = stepCell(rows, cols.length, r, c, dir)
    if (!next) return
    e.preventDefault()
    buttons.current.get(next)?.focus()
  }

  const onModeKey = e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setMode('quiz'); quizRef.current?.focus() }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setMode('explore'); exploreRef.current?.focus() }
  }

  const cellClass = key => {
    let cls = 'cb-chip ix-grid-cell'
    if (!asking) return selected === key ? `${cls} is-on` : cls
    if (quiz.found[key] === 'first') cls += ' is-found'
    if (quiz.found[key] === 'late') cls += ' is-late'
    if (quiz.wrong === key) cls += ` is-wrong s${quiz.shake % 2}`
    if (hintKey === key) cls += ' is-hint'
    return cls
  }

  const tableName = [data.rowLabel, data.colLabel].filter(Boolean).map(plain).join(' by ') || undefined

  return (
    <div className="ix-grid" style={{ '--cols': cols.length }} onKeyDownCapture={keepControlKeysLocal}>
      {data.quiz && (
        <div className="ix-grid-bar">
          <div className="into-toggle ix-grid-mode" role="radiogroup" aria-label="Mode" onKeyDown={onModeKey}>
            <button ref={exploreRef} type="button" role="radio" aria-checked={!asking} className={asking ? '' : 'is-on'} onClick={() => setMode('explore')}>Explore</button>
            <button ref={quizRef} type="button" role="radio" aria-checked={asking} className={asking ? 'is-on' : ''} onClick={() => setMode('quiz')}>Find the form</button>
            <Motion.span className="into-pill" aria-hidden="true" initial={false} animate={{ x: asking ? '100%' : '0%' }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
          </div>
          {asking && (
            <div className="ix-grid-score">
              <span><b>{quiz.firstTime}</b> / {quiz.asked} found first time</span>
              <button type="button" className="ix-grid-new" onClick={e => startNewRound(e.detail === 0)}>New round</button>
            </div>
          )}
        </div>
      )}

      {asking && (
        <div className="cb-out ix-grid-panel ix-grid-ask">
          {target ? (
            <>
              <div className="ix-grid-ask-row">
                <span className="ix-grid-k">Find the form for</span>
                <span className="ix-grid-k">{quiz.at + 1} of {total}</span>
              </div>
              <div className="ix-grid-ask-en"><span><Meaning entry={target} rows={rows} cols={cols} /></span></div>
              {/* Held empty on the other prompts, so the grid does not move. */}
              {anyWhere && <div className="ix-grid-k ix-grid-ask-where">{prompts[target.key].where && prompts[target.key].en ? <Where entry={target} rows={rows} cols={cols} /> : null}</div>}
            </>
          ) : (
            <>
              <div className="ix-grid-k">Round complete</div>
              <div className="ix-grid-done">{quiz.firstTime} / {total} found first time</div>
            </>
          )}
          {target ? (
            <p className={`ix-grid-status is-${quiz.last?.type ?? 'none'}`}>
              {!quiz.last || quiz.last.type === 'new' ? 'Tap it in the grid below.' : <Status last={quiz.last} byKey={byKey} />}
            </p>
          ) : (
            <p className="ix-grid-status">
              {late.length ? <>Found after a miss: {late.map((e, i) => <Fragment key={e.key}>{i ? ', ' : ''}<T>{e.cell.sm}</T></Fragment>)}{stop(late.at(-1).cell.sm)}</> : 'Every form found first time.'}
            </p>
          )}
          {!target && <button type="button" className="ix-grid-again" onClick={e => startNewRound(e.detail === 0)}>New round {'→'}</button>}
        </div>
      )}

      <div className="ix-grid-table" role="table" aria-label={tableName} onKeyDown={onGridKey}>
        {data.colLabel && (
          <div className="ix-grid-row ix-grid-spanrow" aria-hidden="true">
            <span className="ix-grid-h ix-grid-span"><span><Md text={data.colLabel} /></span></span>
          </div>
        )}
        <div className="ix-grid-row ix-grid-headrow" role="row">
          <span className="ix-grid-h ix-grid-corner" role="columnheader">{data.rowLabel ? <Md text={data.rowLabel} /> : null}</span>
          {cols.map((col, c) => (
            <span key={c} className="ix-grid-h ix-grid-colh" role="columnheader" id={`${uid}-c${c}`}><Md text={col} /></span>
          ))}
        </div>
        {rows.map((row, r) => (
          <div key={r} className="ix-grid-row" role="row">
            <span className="ix-grid-h ix-grid-rowh" role="rowheader" id={`${uid}-r${r}`}><Md text={row.label} /></span>
            {cols.map((_, c) => {
              const cell = row.cells?.[c]
              const key = `${r}-${c}`
              const found = asking ? quiz.found[key] : null
              return (
                <span key={c} className="ix-grid-td" role="cell">
                  {cell ? (
                    <button
                      ref={el => { if (el) buttons.current.set(key, el); else buttons.current.delete(key) }}
                      type="button"
                      data-cell={key}
                      className={cellClass(key)}
                      aria-pressed={asking ? undefined : selected === key}
                      aria-disabled={found ? true : undefined}
                      aria-describedby={`${uid}-r${r} ${uid}-c${c}`}
                      onClick={e => tap(key, e)}
                    >
                      <T className="ix-grid-sm">{cell.sm}</T>
                      {!asking && cell.en && <span className="ix-grid-en">{curly(cell.en)}</span>}
                      {found && <span className="visually-hidden">{found === 'first' ? ', found' : ', found after a miss'}</span>}
                      {asking && hintKey === key && <span className="visually-hidden">, the answer</span>}
                    </button>
                  ) : <span className="ix-grid-empty" />}
                </span>
              )
            })}
          </div>
        ))}
      </div>

      {!asking && chosen && <Detail entry={chosen} rows={rows} cols={cols} />}
      <p className="visually-hidden" aria-live="polite">{announce}</p>
    </div>
  )
}
