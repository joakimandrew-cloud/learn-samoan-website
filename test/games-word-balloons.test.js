// Word Balloons (Build-Spec part h of plans/2026-11-19-samoan-site-search-features.md):
// the deck, the wrong choices, the sets, and the course-data test.
//
// Nothing in this file types a Sāmoan word or a meaning. Every word, meaning and
// fixture is read from src/data/book-vocabulary.json at run time, and the checks
// are written as functions (`deckProblems`, `roundProblems`) so the same check can
// be pointed at a broken copy and shown to fail.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vocabulary from '../src/data/book-vocabulary.json'
import chapters from '../src/data/chapters.json'
import {
  DIRECTIONS, MAX_SHOWN_CHARS, buildDeck, clashes, contentWords, foldLetters, makeRng, makeRound,
  meaningItems, shareWord, shownMeaning,
} from '../src/games/word-balloons/index.js'
import { ALL_WORDS, BAND_SETS, SETS } from '../src/games/shared/lists.js'
import { GAMES } from '../src/games/registry.js'
import { moverText, optionText } from '../src/games/word-balloons/rounds.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const tidy = s => String(s ?? '').replace(/\s+/g, ' ').trim()
const BAD_HEADWORD = /[\s,=-]/

/** Every way a deck can disagree with the vocabulary file. Empty means the deck is the book's. */
export function deckProblems(cards, rows) {
  const problems = []
  const samoanValues = new Set(rows.map(r => r.samoan))
  const englishValues = new Set(rows.map(r => tidy(r.english)))
  const rowById = new Map(rows.map(r => [r.id, r]))
  const seen = new Set()
  for (const c of cards) {
    if (!samoanValues.has(c.samoan)) problems.push(`${c.id}: word "${c.samoan}" is not a samoan value`)
    if (!samoanValues.has(c.samoanShown)) problems.push(`${c.id}: shown word "${c.samoanShown}" is not a samoan value`)
    if (seen.has(c.samoan)) problems.push(`${c.id}: word "${c.samoan}" has two cards`)
    seen.add(c.samoan)
    if (BAD_HEADWORD.test(c.samoan)) problems.push(`${c.id}: "${c.samoan}" is not a one-word headword`)
    for (const full of c.fulls) if (!englishValues.has(full)) problems.push(`${c.id}: full meaning "${full}" is not an english value`)
    c.english.forEach((e, i) => {
      if (shownMeaning(e) !== c.cuts[i]) problems.push(`${c.id}: cut ${i} is not what the cut function returns`)
      if (c.cuts[i].length > MAX_SHOWN_CHARS) problems.push(`${c.id}: cut "${c.cuts[i]}" is over ${MAX_SHOWN_CHARS} characters`)
    })
    if (c.meaning !== c.cuts[0]) problems.push(`${c.id}: the shown meaning is not the cut of the first row`)
    for (const id of c.rowIds) {
      const row = rowById.get(id)
      if (!row) problems.push(`${c.id}: row ${id} is not in the vocabulary`)
      else if (!['vocabulary', 'carry'].includes(row.list)) problems.push(`${c.id}: row ${id} is on the ${row.list} list`)
      else if (row.samoan !== c.samoan) problems.push(`${c.id}: row ${id} prints another word`)
    }
  }
  return problems
}

/** Every rule a round's wrong choices must keep, against the target. Empty means the round is fair. */
export function roundProblems(round) {
  const problems = []
  const { target, options } = round
  const wrong = options.filter(o => o.id !== target.id)
  if (options.filter(o => o.id === target.id).length !== 1) problems.push('the target is not on the card exactly once')
  if (options[round.correctIndex]?.id !== target.id) problems.push('correctIndex does not point at the target')
  const labels = round.labels.map(l => l.toLowerCase())
  if (new Set(labels).size !== labels.length) problems.push('two choices read the same')
  for (const o of wrong) {
    // The two-direction content-word test, over the whole printed meanings with notes kept.
    const mine = new Set(contentWords(target.english.join('; ')))
    const theirs = new Set(contentWords(o.english.join('; ')))
    if ([...mine].some(w => theirs.has(w)) || [...theirs].some(w => mine.has(w))) problems.push(`${o.samoan} shares a content word with ${target.samoan}`)
    if (shareWord(target, o) !== shareWord(o, target)) problems.push(`${o.samoan}: the content-word test differs by direction`)
    if (foldLetters(o.samoan) === foldLetters(target.samoan)) problems.push(`${o.samoan} folds to the same letters as ${target.samoan}`)
    if (o.samoan === target.samoan) problems.push(`${o.samoan} is the target's spelling`)
    if (o.meaning.toLowerCase() === target.meaning.toLowerCase()) problems.push(`${o.samoan} shows the target's meaning`)
    const items = new Set(meaningItems(target.english.join('; ')))
    if (meaningItems(o.english.join('; ')).some(i => items.has(i))) problems.push(`${o.samoan} shares a meaning item with ${target.samoan}`)
  }
  return problems
}

describe('Word Balloons: the cut', () => {
  it('cuts a meaning before "(" and shortens a long list to its first item', () => {
    expect(shownMeaning('alpha (a note)')).toBe('alpha')
    expect(shownMeaning('alpha beta (a note); gamma')).toBe('alpha beta; gamma')
    expect(shownMeaning('one, two, three, four, five, six, seven, eight')).toBe('one')
    expect(shownMeaning('one, two')).toBe('one, two')
    expect(meaningItems('sermon; to preach')).toEqual(['sermon', 'preach'])
  })

  it('applies to the printed rows: no cut holds a "(" and none is over 28 characters on a card', () => {
    for (const row of vocabulary) expect(shownMeaning(row.english), row.id).not.toContain('(')
    for (const c of ALL_WORDS) for (const cut of c.cuts) {
      expect(cut.length, c.id).toBeLessThanOrEqual(28)
      expect(cut, c.id).not.toContain('*')
    }
  })
})

describe('Word Balloons: the deck is the book\'s', () => {
  it('holds one card per distinct word of the vocabulary and carry rows that pass the rules, and counts 431', () => {
    const eligible = vocabulary.filter(r => ['vocabulary', 'carry'].includes(r.list) && !BAD_HEADWORD.test(r.samoan))
    const byWord = new Map()
    for (const r of eligible) byWord.set(r.samoan, [...(byWord.get(r.samoan) ?? []), r])
    const want = [...byWord.values()].filter(rows => rows.every(r => shownMeaning(r.english).length <= 28))
    expect(ALL_WORDS.map(c => c.samoan)).toEqual(want.map(rows => rows[0].samoan))
    expect(ALL_WORDS.length).toBe(431)
    expect(buildDeck(vocabulary).length).toBe(431)
  })

  it('leaves out the grammar words, the phrases and bound forms, and every row whose cut runs long', () => {
    const inDeck = new Set(ALL_WORDS.flatMap(c => c.rowIds))
    for (const r of vocabulary) {
      if (r.list === 'grammar') expect(inDeck.has(r.id), r.id).toBe(false)
      if (BAD_HEADWORD.test(r.samoan)) expect(inDeck.has(r.id), r.id).toBe(false)
      if (inDeck.has(r.id)) expect(shownMeaning(r.english).length, r.id).toBeLessThanOrEqual(28)
    }
    expect(vocabulary.filter(r => r.list === 'grammar').length).toBeGreaterThan(100)
  })

  it('carries every meaning its rows print: a word with two rows has one card and both meanings', () => {
    const multi = ALL_WORDS.filter(c => c.rowIds.length > 1)
    expect(multi.length).toBeGreaterThanOrEqual(1)
    for (const c of multi) {
      const rows = c.rowIds.map(id => vocabulary.find(r => r.id === id))
      expect(c.fulls).toEqual(rows.map(r => tidy(r.english)))
      for (const r of rows) for (const w of contentWords(r.english)) expect(c.words, c.id).toContain(w)
    }
  })

  it('holds every word and every full meaning to the vocabulary file (the course-data test)', () => {
    expect(deckProblems(ALL_WORDS, vocabulary)).toEqual([])
  })

  it('shows the cut meaning on a choice and the printed meaning in full once answered', () => {
    for (const c of ALL_WORDS) {
      expect(c.meaning, c.id).toBe(shownMeaning(c.english[0]))
      // What the card shows when answered is the printed English, notes and all.
      expect(c.full, c.id).toBe(c.fulls.join('; '))
    }
    const noted = ALL_WORDS.filter(c => c.fulls[0].includes('('))
    expect(noted.length).toBeGreaterThan(10)
    for (const c of noted) expect(c.full).toContain('(')
    for (const c of noted) expect(c.meaning).not.toContain('(')
  })

  it('can fail: the same check on a broken copy names the break', () => {
    const copy = ALL_WORDS.map(c => ({ ...c, fulls: [...c.fulls], english: [...c.english], cuts: [...c.cuts] }))
    copy[0].samoan = `${copy[0].samoan}x`
    copy[1].fulls[0] = `${copy[1].fulls[0]} and more`
    copy[2].cuts[0] = 'not the cut'
    const found = deckProblems(copy, vocabulary)
    expect(found.length).toBeGreaterThanOrEqual(3)
    expect(found.some(p => p.includes('is not a samoan value'))).toBe(true)
    expect(found.some(p => p.includes('is not an english value'))).toBe(true)
    expect(found.some(p => p.includes('cut function'))).toBe(true)
  })
})

describe('Word Balloons: the sets are the three bands of /cards', () => {
  it('has the three band labels /cards prints, in its order', () => {
    const cards = fs.readFileSync(path.join(APP, 'src', 'premium', 'pages', 'Cards.jsx'), 'utf8')
    const printed = [...cards.matchAll(/label: '([^']+)', group: 'By band'/g)].map(m => m[1])
    expect(printed.length).toBe(3)
    expect(SETS.map(s => s.label)).toEqual(printed)
    expect(BAND_SETS.map(s => s.id)).toEqual(['beginner', 'intermediate', 'advanced'])
  })

  it('puts each card in the band of the chapter that prints it, and counts 189, 169 and 73', () => {
    const bandOf = new Map(chapters.map(c => [c.chapter, c.level]))
    for (const set of SETS) {
      for (const c of set.cards) expect(c.chapters.some(n => bandOf.get(n) === set.id), `${set.id} ${c.id}`).toBe(true)
      const outside = ALL_WORDS.filter(c => !set.cards.includes(c))
      for (const c of outside) expect(c.chapters.some(n => bandOf.get(n) === set.id), `${set.id} leaves out ${c.id}`).toBe(false)
    }
    expect(SETS.map(s => s.count)).toEqual([189, 169, 73])
    expect(SETS.reduce((n, s) => n + s.count, 0)).toBe(431)
  })
})

describe('Word Balloons: no wrong choice can pass for the right answer', () => {
  it('leaves every card at least 419 allowed wrong choices, over the whole deck', () => {
    let least = Infinity
    for (const t of ALL_WORDS) {
      let n = 0
      for (const o of ALL_WORDS) if (!clashes(t, o)) n++
      least = Math.min(least, n)
    }
    expect(least).toBeGreaterThanOrEqual(419)
  })

  it('is symmetric: the test gives the same answer in both directions for every pair', () => {
    for (const a of ALL_WORDS) for (const b of ALL_WORDS) {
      expect(shareWord(a, b) === shareWord(b, a)).toBe(true)
    }
  })

  it('never offers the five pairs the judge named against each other, in any round', () => {
    const find = test => ALL_WORDS.find(c => c.fulls.some(f => test(f)))
    const pairs = [
      [find(f => /^lie \(down\)$/.test(f)), find(f => /^lie down$/.test(f))],
      [find(f => /^be able/.test(f)), find(f => /^can, able$/.test(f))],
      [find(f => /^write$/.test(f)), find(f => /^letter, book/.test(f))],
    ]
    const folded = new Map()
    for (const c of ALL_WORDS) folded.set(c.fold, [...(folded.get(c.fold) ?? []), c])
    const tama = ALL_WORDS.filter(c => c.fulls[0] === 'boy' || c.fulls[0] === 'father')
    const aoga = ALL_WORDS.filter(c => c.fulls[0] === 'use, useful' || c.fulls[0] === 'school')
    pairs.push(tama, aoga)
    expect(pairs.length).toBe(5)
    for (const [a, b] of pairs) {
      expect(a && b, 'both words of the pair are cards').toBeTruthy()
      expect(clashes(a, b)).toBe(true)
      expect(clashes(b, a)).toBe(true)
    }
    // And in play: a round for one of the pair never holds the other.
    for (const direction of DIRECTIONS) {
      for (const [a, b] of pairs) {
        for (let seed = 1; seed <= 200; seed++) {
          for (const [t, o] of [[a, b], [b, a]]) {
            const r = makeRound(ALL_WORDS, makeRng(seed), { direction, target: t })
            expect(r.options.some(x => x.id === o.id), `${t.id} against ${o.id}`).toBe(false)
          }
        }
      }
    }
  })

  for (const set of [{ id: 'all', cards: ALL_WORDS, fallback: null }, ...SETS.map(s => ({ ...s, fallback: ALL_WORDS }))]) {
    for (const direction of DIRECTIONS) {
      it(`makes a fair round for every card of ${set.id} (${direction}), three times over`, () => {
        let rounds = 0
        for (const seed of [11, 22, 33]) {
          const rng = makeRng(seed)
          for (const t of set.cards) {
            const r = makeRound(set.cards, rng, { direction, target: t, fallback: set.fallback })
            rounds++
            expect(r.options.length, t.id).toBe(4)
            expect(roundProblems(r), `${t.id} ${direction}`).toEqual([])
            // What a round shows is what the cut gives, and a word is a samoan value.
            for (const o of r.options) {
              expect(o.samoanShown).toBe(o.samoan)
              expect(vocabulary.some(v => v.samoan === o.samoan)).toBe(true)
              expect(optionText(o, direction) === o.samoanShown || o.cuts.includes(optionText(o, direction))).toBe(true)
            }
            expect(r.mover).toBe(moverText(t, direction))
          }
        }
        expect(rounds).toBe(set.cards.length * 3)
      })
    }
  }

  it('can fail: the round check names a clash put in by hand', () => {
    const t = ALL_WORDS[0]
    const same = ALL_WORDS.find(c => c.id !== t.id && shareWord(t, c))
    const fold = ALL_WORDS.find(c => c.id !== t.id && c.fold === ALL_WORDS.find(x => x.id !== c.id && x.fold === c.fold)?.fold)
    expect(same && fold).toBeTruthy()
    const twin = ALL_WORDS.find(c => c.id !== fold.id && c.fold === fold.fold)
    const bad = { target: fold, options: [fold, twin, ALL_WORDS[3], ALL_WORDS[4]], correctIndex: 0, labels: ['a', 'b', 'c', 'd'] }
    expect(roundProblems(bad).some(p => p.includes('folds to the same letters'))).toBe(true)
    const clash = { target: t, options: [t, same, ALL_WORDS[3], ALL_WORDS[4]], correctIndex: 0, labels: ['a', 'b', 'c', 'd'] }
    expect(roundProblems(clash).some(p => p.includes('shares a content word'))).toBe(true)
  })
})

describe('Word Balloons: stored keys and the registry card', () => {
  it('keeps its stored keys under the ls- prefix', () => {
    const page = fs.readFileSync(path.join(APP, 'src', 'premium', 'pages', 'WordBalloons.jsx'), 'utf8')
    for (const key of [...page.matchAll(/(?:MUTE_KEY|BAG_KEY_PREFIX|BEST_KEY) = '([^']+)'/g)].map(m => m[1])) expect(key).toMatch(/^ls-/)
    expect([...page.matchAll(/(?:MUTE_KEY|BAG_KEY_PREFIX|BEST_KEY) = '([^']+)'/g)].length).toBe(3)
  })

  it('counts its words on the hub card from the deck', () => {
    const game = GAMES.find(g => g.key === 'word-balloons')
    expect(game.words).toBe(ALL_WORDS.length)
    expect(game.route).toBe('/games/word-balloons')
    expect(game.sample().sm).toBeTruthy()
  })
})
