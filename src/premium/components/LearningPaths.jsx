import { Link } from 'react-router-dom'
import EntryMotif from './EntryMotif.jsx'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import '../styles/learning-paths.css'

const STEPS = [
  {
    number: '01',
    title: 'Learn the sounds and spelling',
    text: 'Read how Samoan is spelled and said, with the two marks for the glottal stop and long vowels.',
    links: [{ to: '/introduction', label: 'Sounds and spelling' }, { to: '/pronunciation', label: 'Pronunciation guide' }],
  },
  {
    number: '02',
    title: 'Build your first sentence',
    text: `Start Chapter 1, then follow all ${CHAPTER_COUNT} chapters in order from Beginner to Advanced.`,
    links: [{ to: '/chapters/1', label: 'Start Chapter 1' }, { to: '/chapters', label: 'Browse all chapters' }],
  },
  {
    number: '03',
    title: 'Keep references nearby',
    text: 'Look up every word the course teaches, or the pronoun, possessive and particle charts, whenever you need them.',
    links: [{ to: '/glossary', label: 'Glossary' }, { to: '/charts', label: 'Reference charts' }, { to: '/cards', label: 'Flip cards' }],
  },
]

export default function LearningPaths() {
  return (
    <section className="learning-paths" aria-labelledby="learning-paths-heading">
      <div className="learning-paths__intro">
        <p className="wr-home__eyebrow">New to Samoan?</p>
        <h2 id="learning-paths-heading">Learn Samoan,<br />step by step.</h2>
        <p>Start with the sounds, build a first sentence, then follow the course in order. Keep the reference pages nearby when you need them.</p>
      </div>

      <ol className="learning-paths__steps">
        {STEPS.map(step => (
          <li key={step.number} className="learning-paths__step">
            <span className="learning-paths__number" aria-hidden="true">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <div className="learning-paths__links">
              {step.links.map(item => (
                <Link key={item.to} to={item.to}>
                  {item.label} <EntryMotif size={16} />
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
