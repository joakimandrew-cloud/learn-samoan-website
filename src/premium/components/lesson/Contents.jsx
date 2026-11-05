/**
 * The one navigation device while reading (reviews/lesson-simplify-2026-11-06/Direction.md,
 * E09 to E12): a Contents button (left margin on a wide screen, a 48 px chapter bar on a narrow
 * one, both shown once the hero has passed) and the sheet it opens. The sheet takes what the
 * rail and the phone compass held: the sections with read marks, the Exercises count, Finish,
 * the previous and next chapter, All chapters and the site menu. Copied from the Lea-Faka-Tonga
 * Contents.jsx, in the same dialog and focus handling as MobileCompass.jsx: showModal, the
 * focus kept inside, focus back to the opener, and the chosen section's heading focused.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Md } from './Blocks.jsx'
import { compassState } from './MobileCompass.jsx'
import { CHAPTER_COUNT } from '@app/lib/course.js'

const nn = number => String(number).padStart(2, '0')
const SITE = [
  ['/', 'Home'], ['/chapters', 'Chapters'], ['/drills', 'Drills'], ['/quizzes', 'Quizzes'],
  ['/cards', 'Flip cards'], ['/glossary', 'Glossary'], ['/reference', 'Reference'],
]

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function focusTarget(id) {
  const node = document.getElementById(id)
  if (!node) return
  const heading = node.querySelector('.ls-h2') || node.querySelector('.finish-h') || node
  if (!heading.hasAttribute('tabindex') && heading !== node) heading.setAttribute('tabindex', '-1')
  heading.focus?.({ preventScroll: true })
  node.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' })
}

function keepFocus(event) {
  event.stopPropagation()
  if (event.key !== 'Tab') return
  const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')]
    .filter(node => node.getClientRects().length > 0)
  if (!controls.length) return
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function Mark({ state }) {
  return <span className={`ps-mark is-${state}`} aria-hidden="true" />
}

export function ContentsSheet({ dialogRef, n, level, sections, active, exStats, prev, next, onClose }) {
  const activeIndex = active === 'finish' ? sections.length : sections.findIndex(section => section.id === active)
  const go = id => {
    const url = new URL(window.location.href)
    url.hash = id
    window.history.replaceState(window.history.state, '', url)
    onClose({ type: 'target', id })
  }

  return (
    <dialog
      ref={dialogRef}
      className="ps-sheet"
      aria-labelledby="ps-sheet-t"
      onKeyDown={keepFocus}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      onClose={() => onClose(undefined, true)}
    >
      <div className="ps-in">
        <header className="ps-head">
          <span className="ps-head-t">
            <strong id="ps-sheet-t">In this chapter</strong>
            <span className="ps-head-k">{`${level} · Chapter ${n} of ${CHAPTER_COUNT}`}</span>
          </span>
          <button type="button" className="ps-close" aria-label="Close contents" onClick={() => onClose()}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2 14 14 M14 2 2 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
          </button>
        </header>

        <section className="ps-group">
          <ol className="ps-list">
            {sections.map((section, index) => {
              const state = active === section.id ? 'on' : index < activeIndex ? 'read' : 'todo'
              return (
                <li key={section.id}>
                  <button type="button" className={`ps-row ${state === 'on' ? 'is-on' : ''}`} aria-current={state === 'on' ? 'location' : undefined} onClick={() => go(section.id)}>
                    <Mark state={section.exercises && exStats.total > 0 && exStats.answered >= exStats.total ? 'read' : state} />
                    <span className="ps-n">{nn(index + 1)}</span>
                    <span className="ps-t"><Md text={section.title} /></span>
                    {section.exercises && exStats.total > 0 && <span className="ps-c">{`${exStats.answered}/${exStats.total}`}</span>}
                  </button>
                </li>
              )
            })}
            <li>
              <button type="button" className={`ps-row ${active === 'finish' ? 'is-on' : ''}`} aria-current={active === 'finish' ? 'location' : undefined} onClick={() => go('finish')}>
                <Mark state={active === 'finish' ? 'on' : 'todo'} />
                <span className="ps-n" />
                <span className="ps-t">Finish</span>
              </button>
            </li>
          </ol>
        </section>

        <nav className="ps-group ps-foot" aria-label="Other chapters">
          {prev && (
            <Link className="ps-row ps-chapter" to={`/chapters/${prev.chapter}`}>
              <span className="ps-sub-k">Previous chapter</span>
              <span className="ps-t"><Md text={prev.title} /></span>
            </Link>
          )}
          {next && (
            <Link className="ps-row ps-chapter" to={`/chapters/${next.chapter}`}>
              <span className="ps-sub-k">Next chapter</span>
              <span className="ps-t"><Md text={next.title} /></span>
            </Link>
          )}
          <Link className="ps-row ps-plain" to="/chapters">All chapters</Link>
          <details className="ps-site">
            <summary className="ps-row ps-plain">Site menu</summary>
            <ul className="ps-site-list">
              {SITE.map(([to, label]) => <li key={to}><Link className="ps-row ps-plain is-sub" to={to}>{label}</Link></li>)}
            </ul>
          </details>
        </nav>
      </div>
    </dialog>
  )
}

/** The Contents button in its two forms, and the sheet. */
export default function Contents({ n, level, sections, active, exStats, prev, next }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)
  const barOpenerRef = useRef(null)
  const afterRef = useRef(null)
  const [open, setOpen] = useState(false)
  const state = compassState(sections, active)
  const k = active === 'finish' ? sections.length : Math.max(0, state.index ?? 0) + 1

  const openSheet = from => {
    afterRef.current = { type: 'opener', from }
    dialogRef.current?.showModal()
    setOpen(true)
  }
  const onClose = (after, fromEvent = false) => {
    if (after) afterRef.current = after
    if (!fromEvent) { dialogRef.current?.close(); return }
    setOpen(false)
    const action = afterRef.current
    requestAnimationFrame(() => {
      if (action?.type === 'target') focusTarget(action.id)
      else if (action?.from === 'bar') barOpenerRef.current?.focus()
      else openerRef.current?.focus()
    })
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => { document.documentElement.style.overflow = '' }
  }, [open])

  const title = active === 'finish' ? 'Finish' : state.title
  const count = `${k} of ${sections.length}`

  return (
    <>
      <button ref={openerRef} type="button" className="pl-contents" aria-haspopup="dialog" aria-expanded={open} aria-label="Open chapter contents" onClick={() => openSheet('margin')}>
        <span className="pl-contents-t" aria-hidden="true">Contents</span>
        <span className="pl-contents-c" aria-hidden="true">{count}</span>
      </button>
      <div className="pl-bar">
        <span className="pl-bar-c">{count}</span>
        <span className="pl-bar-t"><Md text={title} /></span>
        <button ref={barOpenerRef} type="button" className="pl-bar-b" aria-haspopup="dialog" aria-expanded={open} aria-label="Open chapter contents" onClick={() => openSheet('bar')}>
          <span aria-hidden="true">Contents</span>
        </button>
      </div>
      <ContentsSheet dialogRef={dialogRef} n={n} level={level} sections={sections} active={active} exStats={exStats} prev={prev} next={next} onClose={onClose} />
    </>
  )
}
