import { Link } from 'react-router-dom'
import EntryMotif from '../components/EntryMotif.jsx'
import glossary from '@app/data/glossary.json'
import { useTitle } from '../lib/title.js'
import { STATIC_META } from '@app/seo/meta.js'
import '../styles/catalog.css'
import '../styles/reference.css'
import '../styles/topics.css'

const PAGES = [
  { to: '/introduction', group: 'sounds', kicker: 'Before Chapter 1', title: 'Sounds, Spelling, and How Words Work', text: 'How to say any written word aloud, where the stress falls, the two marks that carry meaning, and which style of spoken Sāmoan this book teaches.' },
  { to: '/pronunciation', group: 'sounds', kicker: 'Appendix', title: 'Pronunciation Guide', text: 'The sound system in one place: vowels, long vowels, stress, the ʻ mark, the consonants, and the everyday style.' },
  { to: '/alphabet', group: 'sounds', kicker: 'Topic page', title: 'The Sāmoan Alphabet', text: 'The vowels, the consonants and the ʻ mark, how the letters sound, and what the line over a vowel does.' },
  { to: '/charts', group: 'lookup', kicker: 'Appendix', title: 'Reference Charts', text: 'Pronouns, possessives, articles, the tense-aspect-mood particles and the demonstratives, reproduced from the chapters that print them.' },
  { to: '/dictionary', group: 'lookup', kicker: 'Appendix', title: 'Dictionary', text: `All ${glossary.length} glossary entries as a dictionary, searchable in Sāmoan or English, each word with its own page and the chapter that teaches it.` },
  { to: '/word-lists', group: 'lookup', kicker: 'By theme', title: 'Word Lists', text: 'Words the course teaches, sorted by theme: family, food and drink, the body, the house, animals, time, numbers and more.' },
  { to: '/greetings', group: 'phrases', kicker: 'From Chapter 10', title: 'Hello in Sāmoan', text: 'Hello and the reply, the goodbyes, thank you and please, and the good wishes, each as the course teaches it.' },
]

// The Tongan /topics card groups (src/pages/Topics.jsx), holding the four
// pages from the back of the book and the two topic pages (src/seo/pages/).
// English copy only.
const GROUPS = [
  {
    key: 'sounds',
    name: 'Sounds & spelling',
    verbPhrase: 'Say it out loud',
    lead: 'How to read any written word aloud: the vowels, the stress, and the two marks that carry meaning.',
  },
  {
    key: 'lookup',
    name: 'Charts & dictionary',
    verbPhrase: 'Look it up',
    lead: 'The grammar charts, the dictionary and the word lists, for checking a form or finding a word while you work through the chapters.',
  },
  {
    key: 'phrases',
    name: 'Words & phrases',
    verbPhrase: 'Say hello',
    lead: 'The greetings and courtesies of a first meeting, with what each one is for.',
  },
]

export default function Reference() {
  useTitle(STATIC_META['/reference'].title)
  return (
    <div className="catalog-page reference-catalog premium-reference premium-reference-topics">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Reference · From the back of the book</p>
          <h1 className="display">Keep it<br />nearby.</h1>
          <p>The sound guide, the grammar charts and the dictionary, for looking things up while you work through the chapters.</p>
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
                  <p className="topic-count">{entries.length} {entries.length === 1 ? 'page' : 'pages'}</p>
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
