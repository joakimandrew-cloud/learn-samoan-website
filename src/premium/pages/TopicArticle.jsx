import { Link } from 'react-router-dom'
import ArticlePage from '../components/ArticlePage.jsx'
import NotBuilt from './NotBuilt.jsx'
import { useTitle } from '../lib/title.js'
import { STATIC_META } from '@app/seo/meta.js'
import { plainInline } from '@app/seo/inline.js'
import { topicByPath } from '@app/seo/pages/index.js'
import '../styles/reference.css'

// /greetings and /alphabet: a topic page from src/seo/pages/, in the article
// frame reference.css already holds (the crumbs, the card, the reading page).
// The title and description come from src/seo/meta.js, as every page's do.
export default function TopicArticle({ path }) {
  const doc = topicByPath(path)
  useTitle(STATIC_META[path]?.title)
  if (!doc) return <NotBuilt />
  return (
    <div className="premium-reference premium-reference-article">
      <div className="premium-reference-article-shell">
        <nav className="premium-reference-crumbs" aria-label="Breadcrumb">
          <Link to="/reference">Reference</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{plainInline(doc.h1).split(':')[0]}</span>
        </nav>
        <article className="premium-core">
          <ArticlePage doc={doc} />
        </article>
      </div>
    </div>
  )
}
