/**
 * Test builds only (plan 2026-11-06-chapter-page-simplify). One figure alone (?solo=14.1) for
 * the clip and filmstrip tools. Copied from the Lea-Faka-Tonga Variants.jsx, without the
 * structures and looks that job shot for its owner. A production build never reaches this file.
 */
import { useEffect } from 'react'
import Figure from '../figure-engine/Figure.jsx'

function Solo({ figures, id }) {
  const def = figures.find(item => item.id === id)
  useEffect(() => {
    document.documentElement.dataset.solo = 'true'
    return () => { delete document.documentElement.dataset.solo }
  }, [])
  if (!def) return <p>No figure {id}</p>
  return <div className="pl pl-solo"><Figure def={def} autoplay={false} /></div>
}

export default function Variant({ which, figures = [], id }) {
  if (which === 'solo') return <Solo figures={figures} id={id} />
  return null
}
