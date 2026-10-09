/**
 * Development only (never built into the site): every widget fixture in
 * src/premium/components/interactive/fixtures/<kind>.json, rendered in the
 * chapter column. /lab shows them all; /lab/<kind> one kind.
 */
import { useParams } from 'react-router-dom'
import Interactive from '../components/interactive/Interactive.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'

const fixtures = import.meta.glob('../components/interactive/fixtures/*.json', { eager: true, import: 'default' })

export default function Lab() {
  const { kind } = useParams()
  const entries = Object.entries(fixtures).filter(([file]) => !kind || file.endsWith(`/${kind}.json`))
  return (
    <article className="lesson">
      <div className="wrap ls-grid" style={{ paddingTop: 40 }}>
        <aside className="ls-rail-wrap" />
        <div className="ls-body">
          <h1 className="display" style={{ fontSize: 44 }}>Interactive lab{kind ? `: ${kind}` : ''}</h1>
          {entries.length === 0 && <p>No fixture for this kind yet.</p>}
          {entries.flatMap(([file, data]) => (data.items || []).map((item, i) => (
            <div key={`${file}-${i}`} className="blk" data-lab-item={item.id}>
              <Interactive item={item} figure={`${data.chapter}.${i + 1}`} />
            </div>
          )))}
        </div>
      </div>
    </article>
  )
}
