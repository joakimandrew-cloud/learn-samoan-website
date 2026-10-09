import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { Link } from 'react-router-dom'
import vocabulary from '@app/data/book-vocabulary.json'
import { loadLesson } from '../lib/book.js'
import { plainInline } from '../lib/lesson-content.js'
import T from './T.jsx'
import EntryMotif from './EntryMotif.jsx'

// Only the sentences Chapter 1 prints in its two Samoan | English tables can be
// built here, each with the English the chapter gives it. Nothing is composed.
function chapterOneRows(lesson) {
  const rows = []
  for (const block of lesson.blocks) {
    if (block.type !== 'table' || block.head.map(plainInline).join('|') !== 'Samoan|English') continue
    for (const [samoan, english] of block.body) {
      const words = plainInline(samoan).replace(/[.?!]$/, '').split(' ')
      if (words.length === 3) rows.push({ samoan: plainInline(samoan), english: plainInline(english), words })
    }
  }
  return rows
}

const gloss = word => vocabulary.find(row => row.chapter === 1 && row.samoan === word)?.english

export default function HomeSentenceBuilder() {
  const [rows, setRows] = useState([])
  const [who, setWho] = useState(null)
  const [what, setWhat] = useState(null)

  useEffect(() => {
    let live = true
    loadLesson(1).then(lesson => {
      if (!live || !lesson) return
      const found = chapterOneRows(lesson)
      setRows(found)
      setWho(found[0]?.words[1] ?? null)
      setWhat(found[0]?.words[2] ?? null)
    })
    return () => { live = false }
  }, [])

  const pronouns = useMemo(() => [...new Set(rows.map(row => row.words[1]))], [rows])
  const verbs = useMemo(() => [...new Set(rows.map(row => row.words[2]))], [rows])
  const row = rows.find(r => r.words[1] === who && r.words[2] === what)
  if (!rows.length || !row) return <div className="sm-builder is-loading" aria-busy="true" />

  const particle = row.words[0]
  const slot = (label, word, options, choose) => (
    <div className="sm-builder__slot">
      <span className="sm-builder__label">{label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <Motion.span key={word} className="sm-builder__word" initial={{ rotateX: -90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: 90, opacity: 0 }} transition={{ duration: .35, ease: [.16, 1, .3, 1] }}>
          <T>{word}</T>
        </Motion.span>
      </AnimatePresence>
      <span className="sm-builder__gloss">{options ? gloss(word) : '\u00a0'}</span>
      {options && (
        <div className="sm-builder__options" role="radiogroup" aria-label={label}>
          {options.map(option => (
            <button key={option} type="button" role="radio" aria-checked={option === word} className={option === word ? 'is-on' : ''} onClick={() => choose(option)}>
              <T>{option}</T>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="sm-builder">
      <div className="sm-builder__slots">
        {slot('Past particle', particle, null)}
        {slot('Who', who, pronouns, setWho)}
        {slot('Action', what, verbs, setWhat)}
      </div>
      <div className="sm-builder__result" aria-live="polite">
        <T className="sm-builder__samoan">{row.samoan}</T>
        <span className="sm-builder__english">{row.english}</span>
      </div>
      <p className="sm-builder__source">All {rows.length} sentences are printed in <Link to="/chapters/1#the-preverbal-pronoun">Chapter 1 <EntryMotif size={14} /></Link></p>
    </div>
  )
}
