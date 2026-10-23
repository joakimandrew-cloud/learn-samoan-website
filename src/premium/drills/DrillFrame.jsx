/**
 * DrillFrame: the one shell a standalone drill page renders inside (the
 * Tongan site's DrillFrame). It owns the page chrome: the 720px column, the
 * "All drills" back link, the eyebrow (Chapter N · Level), title and blurb.
 * It also provides the two exits the deck's end card offers, which exist on a
 * drill page and nowhere in a chapter.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DrillEndLinks } from './drill-end-links.js'

export default function DrillFrame({ backTo, chapterNum = null, eyebrow, title, blurb, children }) {
  const endLinks = useMemo(() => ({ backTo, chapterNum }), [backTo, chapterNum])
  return (
    <DrillEndLinks.Provider value={endLinks}>
      <div className="pcs-page">
        <header className="pcs-header">
          {backTo && <Link to={backTo} className="x-frame-back">{'←'} All drills</Link>}
          {eyebrow && <div className="pcs-eyebrow">{eyebrow}</div>}
          {title && <h1 className="pcs-title">{title}</h1>}
          {blurb && <p className="pcs-sub">{blurb}</p>}
        </header>
        {children}
      </div>
    </DrillEndLinks.Provider>
  )
}
