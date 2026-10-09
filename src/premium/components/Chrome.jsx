import EntryMotif from './EntryMotif.jsx'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion as Motion, useScroll, useSpring } from 'motion/react'
import { TileBand } from './Tile.jsx'
import { useProgress } from '../lib/progress.js'
import { CHAPTER_COUNT, COURSE_NAME } from '@app/lib/course.js'

const NAV = [
  { to: '/chapters', label: 'Chapters' },
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/cards', label: 'Flip cards' },
  { to: '/glossary', label: 'Glossary' },
  { to: '/reference', label: 'Reference' },
]

// Text-only wordmark: the logo is still to be chosen (DECISIONS, logo pending).
export function Wordmark({ compact = false }) {
  return (
    <Link to="/" className={`wm ${compact ? 'is-compact' : ''}`} aria-label={`${COURSE_NAME}, home`}>
      <span className="wm-text">{COURSE_NAME}</span>
    </Link>
  )
}

export function Header({ progress = false }) {
  const [menuPath, setMenuPath] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  const open = menuPath === loc.pathname
  const menuRef = useRef(null)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: .3 })

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (!open && !headerRef.current?.contains(document.activeElement)) setHidden(y > 240 && y > last + 2 ? true : y < last - 2 ? false : hidden)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open, hidden])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e) => {
      // A drill's page-level shortcuts must not answer behind the open menu.
      // Native link/button activation still runs because default is preserved.
      e.stopPropagation()
      if (e.key === 'Escape') {
        setMenuPath(null)
        toggleRef.current?.focus()
      }
      if (e.key !== 'Tab') return
      const controls = [...menuRef.current.querySelectorAll('a[href], button:not(:disabled), summary, [tabindex="0"]')]
        .filter(node => node.getClientRects().length > 0 && !node.closest('[inert]'))
      const first = controls[0]
      const last = controls.at(-1)
      const outside = !menuRef.current.contains(document.activeElement)
      if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last) || outside) {
        e.preventDefault()
        ;(e.shiftKey ? last : first)?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 881px)')
    const onResize = () => { if (desktop.matches) setMenuPath(null) }
    window.addEventListener('keydown', onKey, true)
    desktop.addEventListener('change', onResize)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      desktop.removeEventListener('change', onResize)
      document.documentElement.style.overflow = previousOverflow
    }
  }, [open])

  // Sticky bars below the header read this to slide up when it hides.
  useEffect(() => {
    document.documentElement.dataset.hdr = hidden ? 'hidden' : 'shown'
  }, [hidden])


  const { done, last } = useProgress()
  const next = last ? (done.has(last) ? Math.min(CHAPTER_COUNT, last + 1) : last) : 1
  const ctaLabel = !last ? 'Start Chapter 1' : done.has(last) ? `Start Chapter ${next}` : `Continue Chapter ${next}`
  const hideCta = /^\/(chapters\/\d+|quizzes)/.test(loc.pathname)
  const toggleMenu = () => {
    if (!open) setHidden(false)
    setMenuPath(open ? null : loc.pathname)
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className={`navigation-shell${hidden ? ' is-hidden' : ''}`} ref={menuRef} role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined} aria-label={open ? 'Site menu' : undefined} onFocusCapture={event => {
        if (headerRef.current?.contains(event.target)) setHidden(false)
      }} onClick={event => {
        if (open && event.target.closest('a')) setMenuPath(null)
      }}>
      <header ref={headerRef} className={`hdr ${hidden ? 'is-hidden' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="hdr-in">
          <Wordmark />
          <nav className="hdr-nav" aria-label="Main">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `hdr-link ${isActive || (n.to === '/reference' && /^\/(charts|introduction|pronunciation)/.test(loc.pathname)) ? 'is-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hdr-cta">
            {!hideCta && <Link to={`/chapters/${next}`} className="btn btn-primary btn-sm">{ctaLabel}</Link>}
            <button ref={toggleRef} className="hdr-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="site-menu" onClick={toggleMenu}>
              <span /><span />
            </button>
          </div>
        </div>
        {progress && <Motion.div className="hdr-progress" style={{ scaleX: bar }} />}
      </header>

      <AnimatePresence>
        {open && (
          <Motion.div
            id="site-menu"
            className="sheet band grain"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: .55, ease: [.76, 0, .24, 1] }}
          >
            <nav className="sheet-nav" aria-label="Menu">
              {[{ to: '/', label: 'Home' }, ...NAV].map((n, i) => (
                <Motion.div key={n.to} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .18 + i * .05, duration: .6, ease: [.16, 1, .3, 1] }}>
                  <Link to={n.to} className="sheet-link display">{n.label}</Link>
                </Motion.div>
              ))}
            </nav>
            <div className="sheet-foot">
              <Link to="/chapters/1" className="btn btn-primary">Start Chapter 1, it's free <EntryMotif size={20} /></Link>
              <Link to="/reference" className="btn btn-ghost">Pronunciation and reference</Link>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}

export function Footer() {
  const compact = useLocation().pathname === '/'
  return (
    <footer className={`ftr band grain${compact ? ' ftr--compact' : ''}`}>
      <TileBand className="ftr-band" tile={40} />
      <div className="wrap ftr-grid">
        <div className="ftr-brand">
          {compact ? <Wordmark /> : <p className="ftr-big display">Learn Samoan.<br />One sentence<br />at a time.</p>}
        </div>
        <div className="ftr-col">
          <h2>Learn</h2>
          <Link to="/chapters">All {CHAPTER_COUNT} chapters</Link>
          <Link to="/chapters/1">Chapter 1</Link>
          <Link to="/quizzes">Quizzes</Link>
          <Link to="/cards">Flip cards</Link>
        </div>
        <div className="ftr-col">
          <h2>Reference</h2>
          <Link to="/introduction">Sounds and spelling</Link>
          <Link to="/pronunciation">Pronunciation guide</Link>
          <Link to="/charts">Reference charts</Link>
          <Link to="/glossary">Glossary</Link>
        </div>
        <div className="ftr-col">
          <h2>The course</h2>
          <span className="ftr-note">{CHAPTER_COUNT} chapters, Beginner to Advanced.</span>
          <span className="ftr-note">Every chapter has worked examples, exercises with answers and a 10-question quiz.</span>
        </div>
      </div>
      <div className="wrap ftr-colophon">
        <span>{COURSE_NAME} · © 2026 Andrew Joakim</span>
      </div>
    </footer>
  )
}
