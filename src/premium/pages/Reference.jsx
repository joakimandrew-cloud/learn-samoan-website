import { Link } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import glossary from '@app/data/glossary.json'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/reference.css'
import '../styles/topics.css'

const PAGES = [
  { to: '/introduction', group: 'sounds', kicker: 'Before Chapter 1', title: 'Sounds, Spelling, and How Words Work', text: 'How to say any written word aloud, where the stress falls, the two marks that carry meaning, and which style of spoken Sāmoan this book teaches.' },
  { to: '/pronunciation', group: 'sounds', kicker: 'Appendix', title: 'Pronunciation Guide', text: 'The sound system in one place: vowels, long vowels, stress, the ʻ mark, the consonants, and the everyday style.' },
  { to: '/charts', group: 'lookup', kicker: 'Appendix', title: 'Reference Charts', text: 'Pronouns, possessives, articles, the tense-aspect-mood particles and the demonstratives, reproduced from the chapters that print them.' },
  { to: '/glossary', group: 'lookup', kicker: 'Appendix', title: 'Glossary', text: `All ${glossary.length} glossary entries, searchable in Sāmoan or English, each with the chapter that first teaches it.` },
]

// The Tongan /topics card groups (src/pages/Topics.jsx), holding the four
// pages from the back of the book. English copy only.
const GROUPS = [
  {
    key: 'sounds',
    name: 'Sounds & spelling',
    verbPhrase: 'Say it out loud',
    lead: 'How to read any written word aloud: the vowels, the stress, and the two marks that carry meaning.',
  },
  {
    key: 'lookup',
    name: 'Charts & glossary',
    verbPhrase: 'Look it up',
    lead: 'The grammar charts and the glossary, for checking a form while you work through the chapters.',
  },
]

export default function Reference() {
  useTitle('Reference')
  return (
    <div className="catalog-page reference-catalog premium-reference premium-reference-topics">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Reference · From the back of the book</p>
          <h1 className="display">Keep it<br />nearby.</h1>
          <p>The sound guide, the grammar charts and the glossary, for looking things up while you work through the chapters.</p>
        </div>
      </header>
      <div className="topics-page topics-index">
        <div className="topic-sections">
          {GROUPS.map(group => {
            const entries = PAGES.filter(page => page.group === group.key)
            return (
              <section key={group.key} className="topic-section" aria-labelledby={`topic-group-${group.key}`}>
                <header className="topic-section-heading">
                  <p className="topic-eyebrow">{group.name}</p>
                  <h2 id={`topic-group-${group.key}`}>{group.verbPhrase}</h2>
                  <p className="topic-section-lead">{group.lead}</p>
                  <p className="topic-count">{entries.length} pages</p>
                </header>
                <ul className="topic-card-grid">
                  {entries.map(page => (
                    <li key={page.to}>
                      <Link to={page.to} className="topic-card">
                        <strong>{page.title}</strong>
                        <span className="topic-card-description">{page.kicker} · {page.text}</span>
                        <span className="topic-card-arrow" aria-hidden="true"><EntryMotif size={20} /></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
