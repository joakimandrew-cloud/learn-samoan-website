import { Component, lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { Header, Footer } from './components/Chrome.jsx'
import Home from './pages/Home.jsx'
import NotBuilt from './pages/NotBuilt.jsx'
import LoadFailure from './components/LoadFailure.jsx'

// Each inner page loads with its own data, so the homepage stays light.
const Lessons = lazy(() => import('./pages/Lessons.jsx'))
const Lesson = lazy(() => import('./pages/Lesson.jsx'))
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const Quizzes = lazy(() => import('./pages/Quizzes.jsx'))
const Cards = lazy(() => import('./pages/Cards.jsx'))
const Dictionary = lazy(() => import('./pages/Dictionary.jsx'))
const Reference = lazy(() => import('./pages/Reference.jsx'))
const BookPage = lazy(() => import('./pages/BookPage.jsx'))
// The widget lab exists only in development builds.
const Lab = import.meta.env.DEV ? lazy(() => import('./pages/Lab.jsx')) : null
const scrollPositions = new Map()

class PageErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <LoadFailure /> : this.props.children }
}

function ScrollManager() {
  const loc = useLocation()
  const navigationType = useNavigationType()
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    if (!loc.hash) {
      const target = navigationType === 'POP' ? (scrollPositions.get(loc.key) || 0) : 0
      const timer = window.setTimeout(() => window.scrollTo({ top: target, behavior: 'instant' }), 500)
      return () => {
        window.clearTimeout(timer)
        scrollPositions.set(loc.key, window.scrollY)
      }
    }
    return () => scrollPositions.set(loc.key, window.scrollY)
  }, [loc.key, loc.hash, navigationType])
  return null
}

function Page({ children }) {
  const pageRef = useRef(null)
  const loc = useLocation()
  const mountedPath = useRef(loc.pathname)
  useEffect(() => {
    // Lazy routes and chapter Markdown may arrive after the browser's initial
    // hash jump. An exiting page must not consume the next page's anchor.
    if (!loc.hash || mountedPath.current !== loc.pathname) return
    let anchor
    try { anchor = decodeURIComponent(loc.hash.slice(1)) } catch { return }
    const root = pageRef.current
    let frame
    let cancelled = false
    const scroll = () => {
      const target = root.id === anchor ? root : [...root.querySelectorAll('[id]')].find(node => node.id === anchor)
      if (!target) return false
      document.fonts.ready.then(() => {
        if (!cancelled) frame = requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }))
      })
      return true
    }
    if (scroll()) return () => { cancelled = true; cancelAnimationFrame(frame) }
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect() })
    observer.observe(root, { childList: true, subtree: true })
    const timeout = setTimeout(() => observer.disconnect(), 10000)
    return () => { cancelled = true; observer.disconnect(); clearTimeout(timeout); cancelAnimationFrame(frame) }
  }, [loc.pathname, loc.hash])
  return (
    <Motion.main
      id="main"
      className={loc.pathname === '/' ? undefined : 'wr-inner'}
      ref={pageRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: .45, ease: [.16, 1, .3, 1] }}
    >
      <PageErrorBoundary><Suspense fallback={<div style={{ minHeight: '100vh' }} />}>{children}</Suspense></PageErrorBoundary>
    </Motion.main>
  )
}

export default function App() {
  const loc = useLocation()
  const reading = /^\/(chapters\/\d+|introduction|pronunciation|charts)/.test(loc.pathname)
  const focus = /^\/quizzes\//.test(loc.pathname) || loc.pathname === '/cards'

  return (
    <>
      <ScrollManager />
      <Header progress={reading} />
      <AnimatePresence mode="wait">
        <Routes location={loc} key={loc.pathname}>
          <Route path="/" element={<Page><Home /></Page>} />
          <Route path="/chapters" element={<Page><Lessons /></Page>} />
          <Route path="/chapters/:num" element={<Page><Lesson /></Page>} />
          <Route path="/lessons" element={<Navigate to="/chapters" replace />} />
          <Route path="/lessons/:num" element={<LegacyChapter />} />
          <Route path="/quizzes" element={<Page><Quizzes /></Page>} />
          <Route path="/quizzes/:num" element={<Page><Quiz /></Page>} />
          <Route path="/cards" element={<Page><Cards /></Page>} />
          <Route path="/glossary" element={<Page><Dictionary /></Page>} />
          <Route path="/reference" element={<Page><Reference /></Page>} />
          <Route path="/introduction" element={<Page><BookPage page="introduction" /></Page>} />
          <Route path="/pronunciation" element={<Page><BookPage page="pronunciation" /></Page>} />
          <Route path="/charts" element={<Page><BookPage page="charts" /></Page>} />
          {Lab && <Route path="/lab/:kind?" element={<Page><Lab /></Page>} />}
          <Route path="*" element={<Page><NotBuilt /></Page>} />
        </Routes>
      </AnimatePresence>
      {!focus && <Footer />}
    </>
  )
}

function LegacyChapter() {
  const loc = useLocation()
  return <Navigate to={`${loc.pathname.replace(/^\/lessons/, '/chapters')}${loc.search}${loc.hash}`} replace />
}
