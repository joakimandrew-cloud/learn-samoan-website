import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import { useTitle } from '../lib/title.js'
import { TileBand } from '../components/Tile.jsx'
import HomeSentenceBuilder from '../components/HomeSentenceBuilder.jsx'
import HomePracticePreview from '../components/HomePracticePreview.jsx'
import LearningPaths from '../components/LearningPaths.jsx'
import { CHAPTER_COUNT } from '@app/lib/course.js'
import '../styles/white-red-home.css'
import '../styles/home-practice-film.css'

// The course box, drawn in type only. No Samoan cover is approved yet; the
// ruled placeholder is a text cover in the course blue (DECISIONS 2026-07-16).
function CourseBook() {
  return (
    <div className="sm-book" aria-hidden="true">
      <div className="sm-book__spine"><span>Learn Samoan</span></div>
      <div className="sm-book__front">
        <div className="sm-book__top">
          <span className="sm-book__title">Learn<br />Samoan</span>
          <span className="sm-book__sub">Samoan language course</span>
        </div>
        <div className="sm-book__body">
          <span className="sm-book__count">{CHAPTER_COUNT} chapters</span>
          <span className="sm-book__band">Beginner to Advanced</span>
          <span className="sm-book__kinds">Grammar · Vocabulary · Exercises</span>
          <span className="sm-book__author">Andrew Joakim</span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  useTitle(null)

  return (
    <div className="wr-home">
      <section className="wr-home__hero">
        <div className="wr-home__hero-inner">
          <div className="wr-home__hero-copy">
            <p className="wr-home__eyebrow">A complete {CHAPTER_COUNT}-chapter Samoan course</p>
            <h1>Build your first<br />Samoan sentence.</h1>
            <p className="wr-home__hero-lede">See how the words fit together, change one part, and understand what changed. Begin with the real pattern from Chapter 1.</p>
            <div className="wr-home__hero-action">
              <Link className="wr-home__button wr-home__button--primary" to="/chapters/1">Start Chapter 1, free <EntryMotif size={20} /></Link>
              <p className="wr-home__access-note">All {CHAPTER_COUNT} chapters are open. No account needed.</p>
            </div>
            <div className="wr-home__book-route">
              <span className="wr-home__book-prompt">New to the sounds? </span>
              <Link to="/introduction">Sounds and spelling guide</Link>
              <span className="wr-home__book-or"> or </span>
              <Link to="/pronunciation">Pronunciation guide</Link>
              <span className="wr-home__book-note"><span className="wr-home__book-stop">.</span></span>
            </div>
          </div>
          <div className="wr-home__hero-visual">
            <figure className="wr-home__hero-book">
              <div className="wr-home__book-halo" aria-hidden="true" />
              <CourseBook />
              <figcaption>{CHAPTER_COUNT} chapters, each with exercises and a quiz.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <TileBand className="wr-home__band" tile={44} />

      <section className="wr-home__sentence" aria-labelledby="wr-sentence-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">A preview of what you’ll learn</p>
          <h2 id="wr-sentence-heading">Change one word.<br />Change the meaning.</h2>
          <p>Chapter 1’s sentences have three parts in a fixed order. Swap the middle word or the last word and see what the sentence says.</p>
        </div>
        <HomeSentenceBuilder />
        <div className="wr-home__next">
          <p>Chapter 1 builds this pattern. Chapters 2 to 4 add the other pronouns, describing verbs and the tense particles.</p>
          <Link className="wr-home__button wr-home__button--primary" to="/chapters/1">Start Chapter 1, free <EntryMotif size={20} /></Link>
        </div>
      </section>

      <section className="wr-home__practice" aria-labelledby="wr-practice-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Learn, then use it</p>
          <h2 id="wr-practice-heading">Practise what you learn.</h2>
          <p>See quizzes and flip cards in action. Every quiz answer, right or wrong, comes with an explanation.</p>
        </div>
        <HomePracticePreview />
        <div className="wr-home__next">
          <p>Every chapter has worked examples, exercises with answers and a 10-question quiz.</p>
          <Link className="wr-home__button wr-home__button--primary" to="/chapters/1">Start Chapter 1, free <EntryMotif size={20} /></Link>
        </div>
      </section>

      <LearningPaths />
    </div>
  )
}
