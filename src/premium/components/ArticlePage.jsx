/**
 * ArticlePage: renders one of the plain-JS documents in src/seo/pages/ as a
 * reading page.
 *
 * The documents are data, not JSX, because scripts/lib/served-text.mjs renders
 * the SAME content as static HTML at build time (a crawler that runs no JS must
 * read the whole page). One source, two renderers, no drift.
 *
 * Every class here is already in src/premium/styles/reference.css:
 * `.reading-page` (its first child is the head: eyebrow, h1, chips),
 * `.example-block` / `.example-pair`, and `.ch-table-wrap` / `.ch-table`.
 * No new CSS.
 *
 * Inside a string `*…*` is Sāmoan and `**…**` bold (src/seo/inline.js). Every
 * Sāmoan span carries lang="sm".
 */
import { Link } from 'react-router-dom'
import { tokenizeInline } from '@app/seo/inline.js'
import { LANG_CODE } from '@app/lib/course.js'

export function Inline({ text }) {
  return tokenizeInline(text).map((tok, i) => {
    if (tok.t === 'strong') return <strong key={i}>{tok.v}</strong>
    if (tok.t === 'em') return <em key={i} lang={LANG_CODE}>{tok.v}</em>
    return tok.v
  })
}

function Block({ block }) {
  switch (block.k) {
    case 'h2': return <h2><Inline text={block.text} /></h2>
    case 'h3': return <h3><Inline text={block.text} /></h3>
    case 'p': return <p><Inline text={block.text} /></p>
    case 'note': return <blockquote><Inline text={block.text} /></blockquote>
    case 'ex':
      return (
        <div className="example-block">
          {block.items.map((item, i) => (
            <div key={i} className="example-pair">
              <div className="example-samoan" lang={LANG_CODE}>{item.sm}</div>
              <div className="example-english">{item.en}</div>
            </div>
          ))}
        </div>
      )
    case 'table':
      return (
        <div className="ch-table-wrap" tabIndex={0} role="region" aria-label={block.headers.join(', ')}>
          <table className="ch-table">
            <thead>
              <tr>{block.headers.map((h, i) => <th key={i} scope="col"><Inline text={h} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci}><Inline text={cell} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'next':
      return (
        <ul>
          {block.items.map(item => (
            <li key={item.to}><Link to={item.to}><Inline text={item.label} /></Link></li>
          ))}
        </ul>
      )
    default: return null
  }
}

export default function ArticlePage({ doc }) {
  return (
    <div className="reading-page">
      <div>
        {doc.eyebrow && <div>{doc.eyebrow}</div>}
        <h1><Inline text={doc.h1} /></h1>
        {doc.chips?.length > 0 && (
          <div>{doc.chips.map((chip, i) => <span key={i}><Inline text={chip} /></span>)}</div>
        )}
      </div>
      <div>
        {doc.blocks.map((block, i) => <Block key={i} block={block} />)}
      </div>
    </div>
  )
}
