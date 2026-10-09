import { Link } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import glossary from '@app/data/glossary.json'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'

const PAGES = [
  { to: '/introduction', kicker: 'Before Chapter 1', title: 'Sounds, Spelling, and How Words Work', text: 'How to say any written word aloud, where the stress falls, the two marks that carry meaning, and which style of spoken Samoan this book teaches.' },
  { to: '/pronunciation', kicker: 'Appendix', title: 'Pronunciation Guide', text: 'The sound system in one place: vowels, long vowels, stress, the ʻ mark, the consonants, and the everyday style.' },
  { to: '/charts', kicker: 'Appendix', title: 'Reference Charts', text: 'Pronouns, possessives, articles, the tense-aspect-mood particles and the demonstratives, reproduced from the chapters that print them.' },
  { to: '/glossary', kicker: 'Appendix', title: 'Glossary', text: `All ${glossary.length} glossary entries, searchable in Samoan or English, each with the chapter that first teaches it.` },
]

export default function Reference() {
  useTitle('Reference')
  return (
    <div className="catalog-page reference-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Reference · From the back of the book</p>
          <h1 className="display">Keep it<br />nearby.</h1>
          <p>The sound guide, the grammar charts and the glossary, for looking things up while you work through the chapters.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <ol className="quiz-list reference-list">
          {PAGES.map((page, i) => (
            <li key={page.to}>
              <Link to={page.to}>
                <span className="quiz-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="quiz-copy"><strong>{page.title}</strong><span>{page.kicker} · {page.text}</span></span>
                <EntryMotif size={20} />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
