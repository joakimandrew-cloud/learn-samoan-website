import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'motion/react'
import { loadBookPage } from '../lib/book.js'
import { useTitle } from '../lib/title.js'
import { BOOK_PAGES } from '@app/lib/book-pages.js'
import { Md } from '../components/lesson/Blocks.jsx'
import MobileCompass from '../components/lesson/MobileCompass.jsx'
import { RenderBlock, Rail, Section, groupSections } from './Lesson.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'

// The Introduction and two appendices, read in the chapter layout.

export default function BookPage({ page }) {
  const meta = BOOK_PAGES[page]
  useTitle(meta.title)
  const [doc, setDoc] = useState(null)
  const [active, setActive] = useState(null)

  useEffect(() => {
    let live = true
    loadBookPage(meta.file).then(value => { if (live) setDoc(value) })
    return () => { live = false }
  }, [meta.file])

  const sections = useMemo(() => (doc ? groupSections(doc.blocks) : []), [doc])
  useEffect(() => {
    if (!sections.length) return
    const els = sections.map(s => document.getElementById(s.id)).filter(Boolean)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-30% 0px -60% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  return (
    <article className="lesson book-page">
      <header className="ls-hero">
        <div className="wrap ls-hero-grid">
          <div className="ls-hero-copy">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/reference">Reference</Link><span aria-hidden="true">/</span>
              <span>{meta.kicker}</span>
            </nav>
            <Motion.p className="ls-num" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .6 }}>{meta.kicker}</Motion.p>
            <h1 className="ls-h1 display">
              <span className="ls-line"><Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: [.16, 1, .3, 1] }}>{doc?.title || meta.title}</Motion.span></span>
            </h1>
            {doc && doc.intro.map((block, i) => block.type === 'p' ? (
              <Motion.p key={i} className="ls-intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25, duration: .8 }}><Md text={block.text} /></Motion.p>
            ) : block.type === 'hr' ? null : (
              <div key={i} className="ls-intro-block"><RenderBlock block={block} n={null} /></div>
            ))}
          </div>
        </div>
      </header>

      {doc && <MobileCompass lessonNumber={null} sections={sections} active={active} />}

      <div className="wrap ls-grid">
        <aside className="ls-rail-wrap">
          {doc && <Rail sections={sections} active={active} exStats={{ total: 0, answered: 0 }} label="On this page" />}
        </aside>
        <div className="ls-body">
          {!doc && <div className="ls-skel" aria-busy="true">{[...Array(6)].map((_, i) => <i key={i} />)}</div>}
          {sections.map((s, si) => (
            <section key={s.id} id={s.id} className="ls-sec">
              <div className="ls-sec-head">
                <span className="ls-sec-n">{String(si + 1).padStart(2, '0')}</span>
                <h2 className="ls-h2 display" tabIndex={-1}><Md text={s.title} /></h2>
              </div>
              <Section s={s} n={null} />
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}
