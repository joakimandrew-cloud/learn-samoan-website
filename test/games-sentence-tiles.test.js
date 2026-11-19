// Sentence Tiles (Build-Spec part h of plans/2026-11-19-samoan-site-search-features.md):
// the deck, the rounds, the reducer, the chapters and progress, and the course-data test.
//
// Nothing in this file types a Sāmoan sentence or a gloss. Every sentence is read from
// src/data/book-exercises.json; made-up items use English placeholders, and the one
// reordered fixture is built from a real answer by moving its words in code.
import { beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import exercises from '../src/data/book-exercises.json'
import { makeRng } from '../src/games/shared/fair.js'
import { pointsFor } from '../src/games/shared/scoring.js'
import * as R from '../src/games/sentence-tiles/rounds.js'
import * as G from '../src/games/sentence-tiles/game.js'
import {
  CHAPTERS, CHAPTER_COUNTS, EXERCISE_TITLE, FIRST_CHAPTER, SENTENCES, allItems, answerText, buildChapters,
  buildSentences, capitalFirst, nextChapter, sentenceText, splitAnswer, whyLeftOut,
} from '../src/games/sentence-tiles/deck.js'
import {
  PROGRESS_KEY, chapterBag, dealFromChapter, freshProgress, loadProgress, parseProgress, progressAfter, saveProgress,
  startingChapter,
} from '../src/games/sentence-tiles/chapters.js'
import { HOW_TO, OFF_ORDER_HEAD, OFF_ORDER_LABEL, ORDER_NOTE } from '../src/games/sentence-tiles/copy.js'
import { GAMES } from '../src/games/registry.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const { makeTiles, makeRound, isNextWord, acceptedOrders } = R
const { gameReducer, initialGame, finishedCount, TAP_LOCKOUT_MS } = G

const answers = new Map()
for (const list of Object.values(exercises)) for (const ex of list) for (const it of ex.items) answers.set(it.id, { answer: it.answer, prompt: it.prompt, title: ex.title })

/** Every way the deck can disagree with the exercises file. Empty means the deck is the book's. */
export function sentenceProblems(sentences, data = answers) {
  const problems = []
  const seen = new Set()
  for (const s of sentences) {
    const row = data.get(s.id)
    if (!row) { problems.push(`${s.id}: not an exercise item`); continue }
    if (row.title.normalize('NFC') !== EXERCISE_TITLE) problems.push(`${s.id}: exercise "${row.title}" is not a translate-into-Sāmoan exercise`)
    if (s.answer !== answerText(row.answer)) problems.push(`${s.id}: the sentence is not the book's answer`)
    if (s.prompt !== row.prompt) problems.push(`${s.id}: the prompt is not the book's`)
    const bookWords = answerText(row.answer).replace(/[.?!]+$/, '').split(/\s+/)
    bookWords[0] = bookWords[0].toLowerCase()
    if ([...s.words].sort().join('|') !== [...bookWords].sort().join('|')) problems.push(`${s.id}: a tile is not a word of the answer, or the tiles leave a word out`)
    if (seen.has(s.answer)) problems.push(`${s.id}: the answer is played twice`)
    seen.add(s.answer)
  }
  return problems
}

const fact = n => (n <= 1 ? 1 : n * fact(n - 1))
const plain = SENTENCES.find(s => new Set(s.words).size === s.words.length && s.words.length === 4)
const withDup = SENTENCES.find(s => new Set(s.words).size < s.words.length)
const item = (answer, extra = {}) => ({ id: 'x', prompt: 'A prompt.', answer, ...extra })

describe('Sentence Tiles: the deck is the book\'s', () => {
  it('reads the 54 "Translate into Sāmoan" exercises, 306 items, and keeps 218 of them', () => {
    const items = allItems()
    expect(items.length).toBe(306)
    const exercisesUsed = new Set(Object.values(exercises).flat().filter(ex => ex.title.normalize('NFC') === EXERCISE_TITLE))
    expect(exercisesUsed.size).toBe(54)
    expect(items.filter(({ item: it }) => !whyLeftOut(it)).length).toBe(218)
  })

  it('plays 210 sentences once each: 8 duplicate answers are dropped', () => {
    expect(SENTENCES.length).toBe(210)
    expect(new Set(SENTENCES.map(s => s.answer.toLowerCase())).size).toBe(210)
    expect(SENTENCES.map(s => s.id)).toEqual([...SENTENCES.map(s => s.id)].filter((id, i, all) => all.indexOf(id) === i))
  })

  it('offers a game to 40 chapters, and to none of 10, 11, 26, 31, 34, 39, 40 and 50', () => {
    expect(CHAPTERS.length).toBe(40)
    expect(CHAPTERS.every(c => c.count >= 3)).toBe(true)
    const without = CHAPTER_COUNTS.filter(([, n]) => n < 3).map(([c]) => c)
    expect(without).toEqual([10, 11, 26, 31, 34, 39, 40, 50])
    expect(CHAPTER_COUNTS.filter(([, n]) => n < 3).map(([, n]) => n)).toEqual([2, 2, 2, 2, 1, 1, 2, 2])
    expect(FIRST_CHAPTER).toBe(1)
    expect(CHAPTERS.map(c => c.chapter)).toEqual([...CHAPTERS.map(c => c.chapter)].sort((a, b) => a - b))
    expect(CHAPTERS.reduce((n, c) => n + c.count, 0)).toBe(SENTENCES.length - without.reduce((n, c) => n + CHAPTER_COUNTS.find(x => x[0] === c)[1], 0))
    expect(buildChapters(SENTENCES).length).toBe(40)
  })

  it('left out the items the rules name, and no others', () => {
    const why = {}
    for (const { item: it } of allItems()) { const w = whyLeftOut(it); if (w) why[w] = (why[w] ?? 0) + 1 }
    expect(Object.values(why).reduce((a, b) => a + b, 0)).toBe(306 - 218)
    for (const reason of Object.keys(why)) expect(['not one Sāmoan span', 'slash', 'or', 'brackets', 'more than one sentence', 'length', 'prompt note']).toContain(reason)
  })

  it('applies the rules to made-up items (English placeholders, not Sāmoan)', () => {
    expect(whyLeftOut(item('*alpha beta gamma.*'))).toBe(null)
    expect(whyLeftOut(item('*alpha beta gamma delta epsilon zeta eta theta.*'))).toBe(null)
    expect(whyLeftOut(item('*alpha beta.*'))).toBe('length')
    expect(whyLeftOut(item('*alpha beta gamma delta epsilon zeta eta theta iota.*'))).toBe('length')
    expect(whyLeftOut(item('*alpha beta gamma.* That one time.'))).toBe('not one Sāmoan span')
    expect(whyLeftOut(item('*alpha beta/gamma delta.*'))).toBe('slash')
    expect(whyLeftOut(item('*alpha beta or gamma delta.*'))).toBe('or')
    expect(whyLeftOut(item('*alpha (beta) gamma.*'))).toBe('brackets')
    expect(whyLeftOut(item('*alpha beta. gamma delta.*'))).toBe('more than one sentence')
    expect(whyLeftOut(item('*alpha beta gamma.*', { prompt: '> *Preview:* a prompt' }))).toBe('prompt note')
  })

  it('splits an answer into tiles: the first word lower-cased, the end mark off the tiles, a comma kept', () => {
    expect(splitAnswer('Alpha beta, gamma.')).toEqual({ words: ['alpha', 'beta,', 'gamma'], end: '.' })
    expect(splitAnswer('Alpha beta gamma?')).toEqual({ words: ['alpha', 'beta', 'gamma'], end: '?' })
    expect(capitalFirst('alpha')).toBe('Alpha')
    // A mark with no capital of its own is stepped over: the capital goes on the first letter that has one.
    expect(capitalFirst('\u02BBalpha')).toBe('\u02BBAlpha')
    expect(capitalFirst('\u02BB')).toBe('\u02BB')
    expect(sentenceText({ words: ['alpha', 'beta'], end: '.', capital: true })).toBe('Alpha beta.')
    expect(sentenceText({ words: ['alpha', 'beta'], end: '', capital: false })).toBe('alpha beta')
  })

  it('holds every sentence to an answer in the exercises file, and every tile to a word of its answer (the course-data test)', () => {
    expect(sentenceProblems(SENTENCES)).toEqual([])
    // The title and the prompt are the book's, as printed.
    for (const s of SENTENCES) expect(answers.get(s.id).prompt).toBe(s.prompt)
    // The sentence the game prints ("The book prints ...", the end card) is the book's answer, capital and all.
    for (const s of SENTENCES) expect(sentenceText(s), s.id).toBe(s.answer)
  })

  it('can fail: the same check on a broken copy names the break', () => {
    const copy = SENTENCES.map(s => ({ ...s, words: [...s.words] }))
    copy[0].words[0] = `${copy[0].words[0]}x`
    copy[1].answer = `${copy[1].answer} more`
    copy[2].prompt = `${copy[2].prompt} changed`
    copy[3].id = 'ch0-ex0-0'
    const found = sentenceProblems(copy)
    expect(found.some(p => p.includes('is not a word of the answer'))).toBe(true)
    expect(found.some(p => p.includes('not the book\'s answer'))).toBe(true)
    expect(found.some(p => p.includes('prompt is not the book\'s'))).toBe(true)
    expect(found.some(p => p.includes('not an exercise item'))).toBe(true)
  })

  it('honours an accept list, with the same words in another order, and ignores one that cannot be built from the tiles', () => {
    const src = answers.get(plain.id)
    const words = splitAnswer(answerText(src.answer)).words
    const swapped = [words[0], words[2], words[1], ...words.slice(3)].join(' ')
    const data = {
      1: [{
        title: EXERCISE_TITLE,
        items: [{ id: 'a1', prompt: src.prompt, answer: src.answer, accept: [swapped, 'alpha beta gamma delta'] }],
      }],
    }
    const [s] = buildSentences(data)
    expect(s.orders.length).toBe(2)
    expect(s.orders[0]).toEqual(s.words)
    expect(s.orders[1]).toEqual([words[0], words[2], words[1], ...words.slice(3)])
    expect(isNextWord(s, [], s.orders[1][0])).toBe(true)
    expect(isNextWord(s, [s.words[0]], s.words[2])).toBe(true)
    // With no accept list, the book's order is the only right one.
    expect(plain.orders).toEqual([plain.words])
    expect(SENTENCES.every(x => x.orders.length === 1)).toBe(true)
  })

  it('counts on the hub card only the sentences a player can reach, and samples one of them', () => {
    const game = GAMES.find(g => g.key === 'sentence-tiles')
    const playable = CHAPTERS.flatMap(ch => ch.cards)
    expect(game.words).toBe(playable.length)
    expect(game.words).toBe(196)
    expect(playable.map(s => s.prompt)).toContain(game.sample().q)
    expect(game.unit).toBe('sentences')
    expect(game.route).toBe('/games/sentence-tiles')
    expect(game.sample().q).toBeTruthy()
  })
})

describe('Sentence Tiles rounds', () => {
  it('shows every word once as a tile, never already in order', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = makeRng(seed)
      for (const s of SENTENCES) {
        const tiles = makeTiles(s, rng)
        expect(tiles.map(t => t.slot)).toEqual(s.words.map((_, i) => i))
        expect([...tiles.map(t => t.text)].sort()).toEqual([...s.words].sort())
        expect(tiles.map(t => t.text).join(' ')).not.toBe(s.words.join(' '))
      }
    }
  })

  it('accepts either of two identical tiles', () => {
    const dup = SENTENCES.filter(s => new Set(s.words).size < s.words.length)
    expect(dup.length).toBeGreaterThan(5)
    for (const s of dup) {
      const tiles = makeTiles(s, makeRng(7))
      const counts = {}
      for (const w of s.words) counts[w] = (counts[w] ?? 0) + 1
      const want = Object.values(counts).reduce((a, k) => a * fact(k), 1)
      const orders = acceptedOrders(s, tiles)
      expect(orders.length).toBe(want)
      for (const o of orders) expect(o.map(slot => tiles[slot].text)).toEqual(s.words)
      const word = Object.keys(counts).find(w => counts[w] > 1)
      const at = s.words.indexOf(word)
      for (const t of tiles.filter(x => x.text === word)) expect(isNextWord(s, at, t.text)).toBe(true)
    }
    for (const s of SENTENCES.filter(x => new Set(x.words).size === x.words.length).slice(0, 50)) {
      expect(acceptedOrders(s, makeTiles(s, makeRng(3))).length).toBe(1)
    }
  })

  it('sets no time on a round: no clock in the round, none in the module', () => {
    const r = makeRound(SENTENCES[0], makeRng(1))
    expect(Object.keys(r).sort()).toEqual(['sentence', 'tiles'])
    for (const name of Object.keys(R)) expect(name).not.toMatch(/ms$|time|duration|clock/i)
  })

  it('has no clue or role in the round code: a tile carries only its text and its place', () => {
    expect(Object.keys(R)).not.toContain('cluesFor')
    for (const t of makeTiles(plain, makeRng(1))) expect(Object.keys(t).sort()).toEqual(['slot', 'text'])
  })
})

const run = (state, ...actions) => actions.reduce(gameReducer, state)
function playing(total = 99, chapter = plain.chapter) {
  return run(initialGame(), { type: 'start', chapter, total })
}
function dealt(sentence, state = playing(), now = 0) {
  return run(state, { type: 'deal', round: makeRound(sentence, makeRng(5)), now })
}
/** The slots that build the sentence, in order (the first matching unused tile each time). */
function rightSlots(round) {
  const used = new Set()
  return round.sentence.words.map(w => {
    const t = round.tiles.find(x => x.text === w && !used.has(x.slot))
    used.add(t.slot)
    return t.slot
  })
}
const offSlot = round => round.tiles.find(t => t.text !== round.sentence.words[round.placed.length]).slot
const pick = (round, slot, now) => ({ type: 'pick', key: round.key, slot, now })

describe('Sentence Tiles game: marked against the order the book prints', () => {
  it('builds a sentence with right taps and scores it with the shared scoring, with no time term', () => {
    let s = dealt(plain)
    const slots = rightSlots(s.round)
    slots.forEach((slot, i) => { s = gameReducer(s, pick(s.round, slot, 1000 + i * 30000)) })
    expect(s.round.status).toBe('done')
    expect(s.round.placed).toEqual(slots)
    expect(s.correct).toBe(1)
    expect(s.streak).toBe(1)
    const want = pointsFor({ streak: 1 })
    expect(want).toBe(10)
    expect(s.score).toBe(want)
    expect(s.round.gain).toBe(want)
  })

  it('takes either of two identical tiles', () => {
    const s0 = dealt(withDup)
    const word = withDup.words.find((w, i) => withDup.words.indexOf(w) !== i)
    const at = withDup.words.indexOf(word)
    for (const twin of s0.round.tiles.filter(t => t.text === word)) {
      let s = s0
      const others = rightSlots(s.round).slice(0, at)
      others.forEach((slot, i) => { s = gameReducer(s, pick(s.round, slot, 1000 + i * 300)) })
      if (s.round.placed.includes(twin.slot)) continue
      s = gameReducer(s, pick(s.round, twin.slot, 5000))
      expect(s.round.placed.length).toBe(at + 1)
      expect(s.offOrderTaps).toBe(0)
    }
  })

  it('counts an off-order tap as an off-order tap, costs the streak and nothing else (there are no lives)', () => {
    let s = dealt(plain)
    s = { ...s, streak: 4 }
    s = gameReducer(s, pick(s.round, offSlot(s.round), 1000))
    expect(s.offOrderTaps).toBe(1)
    expect(s.round.offs).toBe(1)
    expect(s.round.off).toMatchObject({ n: 1, placedAt: 0 })
    expect(s.streak).toBe(0)
    expect('lives' in s).toBe(false)
    expect('wrongTaps' in s).toBe(false)
    expect(s.round.placed).toEqual([])
    expect(s.round.status).toBe('building')
    // the sentence is still built and scored; it goes on the list to look at again
    for (const slot of rightSlots(s.round)) s = gameReducer(s, pick(s.round, slot, 5000 + s.round.placed.length * 300))
    expect(s.round.status).toBe('done')
    expect(s.correct).toBe(1)
    expect(s.streak).toBe(1)
    expect(s.missed.map(x => x.id)).toEqual([plain.id])
  })

  it('counts a double tap on the same off-order tile once, and a later tap again', () => {
    let s = dealt(plain)
    const slot = offSlot(s.round)
    s = gameReducer(s, pick(s.round, slot, 1000))
    s = gameReducer(s, pick(s.round, slot, 1000 + TAP_LOCKOUT_MS - 50))
    expect(s.offOrderTaps).toBe(1)
    s = gameReducer(s, pick(s.round, slot, 1000 + TAP_LOCKOUT_MS + 10))
    expect(s.offOrderTaps).toBe(2)
  })

  it('ignores taps just after a new sentence is dealt, and taps meant for the last one', () => {
    let s = dealt(plain, playing(), 500)
    const slot = rightSlots(s.round)[0]
    expect(gameReducer(s, pick(s.round, slot, 500 + TAP_LOCKOUT_MS - 1))).toBe(s)
    expect(gameReducer(s, { ...pick(s.round, slot, 2000), key: s.round.key - 1 })).toBe(s)
    s = gameReducer(s, pick(s.round, slot, 500 + TAP_LOCKOUT_MS))
    expect(s.round.placed).toEqual([slot])
    expect(gameReducer(s, pick(s.round, slot, 3000))).toBe(s)
  })

  it('has no timer and no lives in the state', () => {
    for (const name of Object.keys(G).filter(n => n !== 'TAP_LOCKOUT_MS')) expect(name).not.toMatch(/ms$|time|duration|clock|lives/i)
    let s = dealt(plain)
    expect(gameReducer(s, { type: 'timeout', key: s.round.key })).toBe(s)
    expect(gameReducer(s, { type: 'tick' })).toBe(s)
    for (const k of ['lives', 'level', 'levelUp', 'count', 'hits', 'misses']) expect(k in s).toBe(false)
    s = gameReducer(s, pick(s.round, rightSlots(s.round)[0], 3600000))
    expect(s.round.placed).toHaveLength(1)
    expect(s.round.status).toBe('building')
  })

  it('ends the game when the chapter\'s last sentence is built, and deals no more than the chapter holds', () => {
    let s = playing(2)
    expect(s.phase).toBe('playing')
    expect(s.chapter).toBe(plain.chapter)
    expect(s.total).toBe(2)
    for (let i = 0; i < 2; i++) {
      s = dealt(plain, s, i * 10000)
      for (const slot of rightSlots(s.round)) s = gameReducer(s, pick(s.round, slot, i * 10000 + 1000 + s.round.placed.length * 300))
      expect(finishedCount(s)).toBe(i + 1)
      s = gameReducer(s, { type: 'next' })
    }
    expect(s.phase).toBe('over')
    expect(s.round).toBe(null)
    expect(s.correct).toBe(2)
    expect(gameReducer(s, { type: 'deal', round: makeRound(plain, makeRng(1)), now: 0 })).toBe(s)
  })

  it('holds every tap while paused or while a finished sentence shows', () => {
    let s = dealt(plain)
    const paused = gameReducer(s, { type: 'pause' })
    expect(gameReducer(paused, pick(s.round, rightSlots(s.round)[0], 2000))).toBe(paused)
    for (const slot of rightSlots(s.round)) s = gameReducer(s, pick(s.round, slot, 1000 + s.round.placed.length * 300))
    expect(s.round.status).toBe('done')
    expect(gameReducer(s, pick(s.round, rightSlots(s.round)[0], 9000))).toBe(s)
    expect(gameReducer(s, { type: 'deal', round: makeRound(plain, makeRng(1)), now: 0 })).toBe(s)
  })

  it('takes the second order an accept list allows, and counts a mix of the two as off-order', () => {
    const src = answers.get(plain.id)
    const words = splitAnswer(answerText(src.answer)).words
    const other = [words[0], words[2], words[1], ...words.slice(3)]
    const [sentence] = buildSentences({ 1: [{ title: EXERCISE_TITLE, items: [{ id: 'b1', prompt: src.prompt, answer: src.answer, accept: [other.join(' ')] }] }] })
    let s = dealt(sentence)
    const used = new Set()
    sentence.orders[1].forEach((w, i) => {
      const t = s.round.tiles.find(x => x.text === w && !used.has(x.slot))
      used.add(t.slot)
      s = gameReducer(s, pick(s.round, t.slot, 1000 + i * 300))
    })
    expect(s.round.status).toBe('done')
    expect(s.offOrderTaps).toBe(0)
    expect(s.correct).toBe(1)
    // After the first two tiles of the second order, a tile that neither order wants next is off-order.
    s = dealt(sentence)
    const a = s.round.tiles.find(t => t.text === other[0])
    const b = s.round.tiles.find(t => t.text === other[1])
    s = gameReducer(s, pick(s.round, a.slot, 1000))
    s = gameReducer(s, pick(s.round, b.slot, 1400))
    expect(s.offOrderTaps).toBe(0)
    const stray = s.round.tiles.find(t => !s.round.placed.includes(t.slot) && t.text !== other[2])
    s = gameReducer(s, pick(s.round, stray.slot, 1800))
    expect(s.offOrderTaps).toBe(1)
    expect(s.round.placed.length).toBe(2)
  })
})

describe('Sentence Tiles fill-in', () => {
  const fill = (round, now) => ({ type: 'fill', key: round.key, now })

  it('places the next word of the book order, as a right tap would', () => {
    let s = dealt(plain)
    s = gameReducer(s, fill(s.round, 1000))
    expect(s.round.placed).toHaveLength(1)
    expect(s.round.tiles.find(t => t.slot === s.round.placed[0]).text).toBe(plain.words[0])
    expect(s.round.filled).toEqual([0])
    expect(s.offOrderTaps).toBe(0)
    expect(s.filledWords).toBe(1)
  })

  it('fills the whole sentence: a score of 0, the streak as it was, on the list to look at again', () => {
    let s = dealt(plain)
    s = { ...s, streak: 3 }
    for (let i = 0; i < plain.words.length; i++) s = gameReducer(s, fill(s.round, 1000 + i * 100))
    expect(s.round.status).toBe('done')
    expect(s.round.gain).toBe(0)
    expect(s.score).toBe(0)
    expect(s.streak).toBe(3)
    expect(s.correct).toBe(0)
    expect(s.helped).toBe(1)
    expect(s.missed.map(x => x.id)).toEqual([plain.id])
    expect(s.round.placed.map(sl => s.round.tiles.find(t => t.slot === sl).text)).toEqual(plain.words)
    expect(gameReducer(s, fill(s.round, 5000))).toBe(s)
  })

  it('scores only the share of words the player placed, and does not grow the streak', () => {
    let s = dealt(plain)
    s = { ...s, streak: 2 }
    const slots = rightSlots(s.round)
    s = gameReducer(s, pick(s.round, slots[0], 1000))
    s = gameReducer(s, pick(s.round, slots[1], 1200))
    while (s.round.status === 'building') s = gameReducer(s, fill(s.round, 1500))
    const full = pointsFor({ streak: 2 })
    expect(s.round.gain).toBe(Math.round((full * 2) / plain.words.length))
    expect(s.score).toBe(s.round.gain)
    expect(s.streak).toBe(2)
    expect(s.round.filled).toEqual([2, 3])
  })

  it('keeps the new-sentence lockout and ignores a fill meant for another sentence', () => {
    let s = dealt(plain, playing(), 500)
    expect(gameReducer(s, fill(s.round, 500 + TAP_LOCKOUT_MS - 1))).toBe(s)
    expect(gameReducer(s, { ...fill(s.round, 3000), key: s.round.key - 1 })).toBe(s)
    const paused = gameReducer(s, { type: 'pause' })
    expect(gameReducer(paused, fill(s.round, 3000))).toBe(paused)
    s = gameReducer(s, fill(s.round, 500 + TAP_LOCKOUT_MS))
    expect(s.round.placed).toHaveLength(1)
  })
})

/** A stand-in for the browser's localStorage, so progress can be saved and read back. */
function fakeStorage() {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
    clear: () => m.clear(),
  }
}

/** Plays one whole chapter the way the page does: a bag of its sentences, dealt one at a time, each built with right taps. */
function playChapter(chapter, rng) {
  const entry = CHAPTERS.find(c => c.chapter === chapter)
  let state = gameReducer(initialGame(), { type: 'start', chapter, total: entry.count })
  let bag = chapterBag(chapter, rng)
  const dealtOut = []
  let now = 0
  for (let guard = 0; state.phase === 'playing' && guard < 100; guard++) {
    const d = dealFromChapter(bag, rng)
    bag = d.bag
    if (!d.sentence) break
    dealtOut.push(d.sentence)
    now += 10000
    state = gameReducer(state, { type: 'deal', round: makeRound(d.sentence, rng), now })
    const used = new Set()
    for (const w of d.sentence.words) {
      const t = state.round.tiles.find(x => x.text === w && !used.has(x.slot))
      used.add(t.slot)
      now += 300
      state = gameReducer(state, { type: 'pick', key: state.round.key, slot: t.slot, now })
    }
    state = gameReducer(state, { type: 'next' })
  }
  return { dealt: dealtOut, state, bag }
}

describe('Sentence Tiles chapter order and progress', () => {
  let saved
  beforeEach(() => {
    saved = globalThis.window
    globalThis.window = { localStorage: fakeStorage() }
    return () => { globalThis.window = saved }
  })

  it('starts a new player at Chapter 1, and the first sentence dealt is from Chapter 1', () => {
    expect(freshProgress()).toEqual({ furthest: 1, done: [] })
    expect(loadProgress()).toEqual(freshProgress())
    const chapter = startingChapter(loadProgress())
    expect(chapter).toBe(1)
    for (let seed = 1; seed <= 20; seed++) {
      const { sentence } = dealFromChapter(chapterBag(chapter, makeRng(seed)), makeRng(seed))
      expect(sentence.chapter).toBe(1)
    }
  })

  it('deals each sentence of a chapter once, only that chapter, then ends the game', () => {
    for (const c of CHAPTERS) {
      const { dealt: out, state, bag } = playChapter(c.chapter, makeRng(c.chapter))
      expect(out.every(s => s.chapter === c.chapter)).toBe(true)
      expect(out.map(s => s.id).sort()).toEqual(c.cards.map(s => s.id).sort())
      expect(state.phase).toBe('over')
      expect(state.correct).toBe(c.count)
      expect(dealFromChapter(bag, makeRng(1)).sentence).toBe(null)
    }
  })

  it('plays the chapters in order: finishing one moves the player on to the next that has a game', () => {
    let progress = freshProgress()
    const order = []
    for (let k = 0; k < 6; k++) {
      const chapter = startingChapter(progress)
      const { dealt: out, state } = playChapter(chapter, makeRng(100 + k))
      expect(state.phase).toBe('over')
      order.push(...out.map(s => s.chapter))
      progress = progressAfter(progress, chapter)
    }
    expect(order).toEqual(CHAPTERS.slice(0, 6).flatMap(c => Array(c.count).fill(c.chapter)))
    expect(progress.furthest).toBe(CHAPTERS[6].chapter)
    expect(progress.done).toEqual(CHAPTERS.slice(0, 6).map(c => c.chapter))
  })

  it('saves progress under an ls- key and reads it back', () => {
    expect(PROGRESS_KEY).toMatch(/^ls-/)
    let p = progressAfter(freshProgress(), 1)
    p = progressAfter(p, 2)
    saveProgress(p)
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY))).toEqual({ furthest: 3, done: [1, 2] })
    expect(loadProgress()).toEqual({ furthest: 3, done: [1, 2] })
    expect(startingChapter(loadProgress())).toBe(3)
  })

  it('never moves progress back, and stops at the last chapter with a game', () => {
    let p = progressAfter(progressAfter(freshProgress(), 1), 2)
    p = progressAfter(p, 1)
    expect(p).toEqual({ furthest: 3, done: [1, 2] })
    const last = CHAPTERS[CHAPTERS.length - 1].chapter
    expect(nextChapter(last)).toBe(null)
    p = progressAfter(p, last)
    expect(p.furthest).toBe(last)
    expect(p.done).toContain(last)
    // a chapter with no game is never marked
    expect(progressAfter(freshProgress(), 10)).toEqual(freshProgress())
  })

  it('reads anything unreadable as a new player, and drops chapters the game does not offer', () => {
    expect(parseProgress(null)).toEqual(freshProgress())
    expect(parseProgress('not json')).toEqual(freshProgress())
    expect(parseProgress('[1,2]').furthest).toBe(1)
    expect(parseProgress(JSON.stringify({ furthest: 4, done: [1, 2, 2, 999, 'x'] }))).toEqual({ furthest: 5, done: [1, 2] })
    expect(parseProgress(JSON.stringify({ furthest: 999 })).furthest).toBe(CHAPTERS[CHAPTERS.length - 1].chapter)
    globalThis.window = { get localStorage() { throw new Error('blocked') } }
    expect(() => saveProgress({ furthest: 5, done: [1] })).not.toThrow()
    expect(loadProgress()).toEqual(freshProgress())
  })

  it('does not open a replayed chapter with the sentence the last game ended on', () => {
    const c = CHAPTERS.find(x => x.count >= 3)
    for (let seed = 1; seed <= 20; seed++) {
      const last = c.cards[seed % c.count].id
      const { sentence } = dealFromChapter(chapterBag(c.chapter, makeRng(seed), { last }), makeRng(seed))
      expect(sentence.id).not.toBe(last)
    }
  })
})

describe('Sentence Tiles: it says what it marks', () => {
  const page = fs.readFileSync(path.join(APP, 'src', 'premium', 'pages', 'SentenceTiles.jsx'), 'utf8')
  const css = fs.readFileSync(path.join(APP, 'src', 'premium', 'styles', 'sentence-tiles.css'), 'utf8')

  it('states in the how-to and in the off-order message that the book\'s order is what it follows, and that more than one order can be said', () => {
    for (const text of [HOW_TO, ORDER_NOTE]) {
      expect(text).toContain('follows the order the book prints')
      expect(text).toContain('more than one order')
      expect(text).toContain('Sāmoan sentences')
    }
    expect(OFF_ORDER_HEAD.toLowerCase()).toBe('not the book\'s order')
    expect(OFF_ORDER_LABEL).toBe('Taps off the book\'s order')
    expect(page).toContain('{HOW_TO}')
    expect(page).toContain('{ORDER_NOTE}')
    expect(page).toContain('{OFF_ORDER_HEAD}')
    expect(page).toContain('{OFF_ORDER_LABEL}')
    expect(page).not.toMatch(/Wrong taps/i)
  })

  it('shows the book\'s sentence with the off-order message, and takes no error colour and plays no miss sound', () => {
    expect(page).toContain('sentenceText(sentence)')
    expect(page).not.toMatch(/--error|thud|vibrate|buzz/)
    expect(css).not.toMatch(/--error|--wrong/)
    // The only sounds the page plays: the start tick, the right-tile pop and the finished chime.
    expect([...page.matchAll(/sound\('([a-z]+)'/g)].map(m => m[1]).sort()).toEqual(['chime', 'pop', 'tick'])
  })

  it('keeps its stored keys under the ls- prefix', () => {
    const keys = [...page.matchAll(/(?:MUTE_KEY|BEST_KEY) = '([^']+)'/g)].map(m => m[1])
    expect(keys.length).toBe(2)
    for (const key of keys) expect(key).toMatch(/^ls-/)
  })

  it('says Chapter, never Lesson, in what a visitor sees', () => {
    expect(page).not.toMatch(/Lesson/i)
    expect(css).not.toMatch(/lesson/i)
  })
})
