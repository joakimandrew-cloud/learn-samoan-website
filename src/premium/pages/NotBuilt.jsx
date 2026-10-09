import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import { useTitle } from '../lib/title.js'

// Unknown addresses keep a clear route back into the course.
export default function NotBuilt() {
  useTitle('Page not found')
  return (
    <section className="wr-missing">
      <div className="wrap wr-missing-copy">
        <p className="eyebrow">Page not found</p>
        <h1 className="display">Let’s get you<br />back on track.</h1>
        <p className="wr-missing-lead">
          This address does not match a page. Return home or choose a chapter to continue.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Home <EntryMotif size={20} /></Link>
          <Link to="/chapters" className="btn btn-ghost">All chapters</Link>
        </div>
      </div>
    </section>
  )
}
