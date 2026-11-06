// Chapter 31's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-31.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 31 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// No Interactive is replaced. ch31-ability-obligation (mafai and tatau toggled) and
// ch31-complement-words (the meanings grid) and ch31-read-complement (grading quiz) each
// show something none of these figures shows.

export const FIGURES = [
  {
    id: '31.1',
    kind: 'row',
    types: ['add'],
    title: 'The Complement Clause',
    caption: 'The complement clause always follows the word that takes it, and nothing puts it in front.',
    // After the paragraph on the unfinished first half, after the table.
    after: { section: 'the-complement-clause', block: b => b.type === 'p' && b.text.includes('on its own is unfinished') },
    alt: [
      '*ʻUa tatau ona ʻou alu.* I must go. (Lit. "It is necessary that I go.")',
      'The pattern of this chapter has four parts in a fixed order: the tense particle, then the word that takes the complement, then *ona*, then the complement clause itself.',
    ],
    scenes: [
      {
        key: 'tatau',
        tiles: {
          ua: [face('ʻUa', 'tense', '')],
          tatau: [face('tatau', 'verb', 'obligation word')],
          ona: [face('ona', 'marker', 'that-word')],
          ou: [face('ʻou', 'pronoun')],
          alu: [face('alu', 'verb')],
        },
        before: { say: 'ʻUa tatau', en: null },
        after: { say: 'ʻUa tatau ona ʻou alu.', en: 'I must go.' },
        states: [
          [['ua', 0], ['tatau', 0]],
          [['ua', 0], ['tatau', 0], ['ona', 0]],
          [['ua', 0], ['tatau', 0], ['ona', 0], ['ou', 0], ['alu', 0]],
        ],
        beats: [{ kind: 'add', tile: 'ona', to: 1 }, { kind: 'add', tile: ['ou', 'alu'], to: 2 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '31.2',
    kind: 'build',
    title: 'The last two are the maker-prefix at work on the first two.',
    caption: '*Sā* is forbidden and *faʻasā* is to make forbidden, which is to forbid; *taga* is allowed and *faʻataga* is to make allowed, which is to allow.',
    // After the paragraph on the maker-prefix, below the table of words.
    after: { section: 'the-words-that-take-a-complement-clause', block: b => b.type === 'p' && b.text.includes('maker-prefix at work') },
    alt: [
      'The last two are the maker-prefix at work on the first two.',
      '*Sā* is forbidden and *faʻasā* is to make forbidden, which is to forbid; *taga* is allowed and *faʻataga* is to make allowed, which is to allow.',
    ],
    scenes: [
      {
        key: 'faasa',
        role: 'verb',
        label: 'word that takes a clause',
        from: { say: 'sā', en: 'forbidden' },
        to: { say: 'faʻasā', en: 'forbid' },
        pieces: [{ text: 'faʻa', added: true }, { text: 'sā' }],
      },
      {
        key: 'faataga',
        role: 'verb',
        label: 'word that takes a clause',
        from: { say: 'taga', en: 'allowed' },
        to: { say: 'faʻataga', en: 'allow' },
        pieces: [{ text: 'faʻa', added: true }, { text: 'taga' }],
      },
    ],
  },
  {
    id: '31.3',
    kind: 'fork',
    types: ['fork-readings'],
    title: 'The word *sā* does two jobs.',
    caption: 'What stands in front of *sā*, and what follows it, tells the two apart.',
    // After the Note on the two jobs of sā, before the Preview.
    after: { section: 'the-words-that-take-a-complement-clause', block: b => b.type === 'note' && b.text.includes('tells the two apart') },
    lanes: [
      { label: 'the past particle', forms: [] },
      { label: 'the word for "forbidden"', forms: [] },
    ],
    alt: [
      'As the past particle it comes straight before the person and the verb, with no tense particle in front of it: *Sā ʻou alu* (I went).',
      'As the word for "forbidden" it stands in the predicate slot, with a tense particle of its own in front of it: *E sā ona ulaula*.',
      'What stands in front of *sā*, and what follows it, tells the two apart.',
    ],
    scenes: [
      {
        key: 'sa',
        cases: [
          {
            lane: 0, say: 'Sā ʻou alu', en: 'I went',
            row: [{ slot: true, ring: true, label: 'tense particle' }, { ...face('Sā', 'tense', 'past particle'), reads: true }, face('ʻou', 'pronoun', 'the person'), face('alu', 'verb')],
          },
          {
            lane: 1, say: 'E sā ona ulaula.', en: 'It is forbidden to smoke.',
            row: [{ ...face('E', 'tense', 'tense particle'), ring: true }, { ...face('sā', 'verb', 'the word for "forbidden"'), reads: true }, face('ona', 'marker', 'that-word'), face('ulaula', 'verb')],
          },
        ],
      },
    ],
  },
  {
    id: '31.4',
    kind: 'fork',
    ownSlots: true,
    title: 'Compare them. Which sentence carries two tense particles?',
    caption: 'Sāmoan has two ways of joining a complement clause to the word that takes it.',
    // The figure teaches the join only. The tense half for the bare join is hedged in the book ("in the sentences this chapter shows", line 171), so no lane form or slot states it: lane 0's slot stays open and empty, and its ʻua is just a tile of the printed sentence.
    // After the paragraph naming the two ways, before the table of tense particles.
    after: { section: 'when-the-second-verb-keeps-its-own-tense', block: b => b.type === 'p' && b.text.includes('Sāmoan has two ways') },
    lanes: [
      { label: 'sets the clause down with nothing between', forms: [] },
      { label: 'opens the clause with *ona*', forms: ['ona'] },
    ],
    alt: [
      '*ʻUa iloa e le tama ʻua sau le teine.* The boy knows that the girl has come.',
      '*ʻUa mafai ona sau le teine.* The girl can come.',
      'The first sentence carries two.',
      'The other opens the clause with *ona*, and then the clause carries no tense particle: it sits under the tense of the word in front of it.',
    ],
    scenes: [
      {
        key: 'iloa-mafai',
        cases: [
          {
            lane: 0,
            say: 'ʻUa iloa e le tama ʻua sau le teine.',
            en: 'The boy knows that the girl has come.',
            row: [face('ʻUa', 'tense'), face('iloa', 'verb'), face('e le tama', 'noun'), { slot: true }, face('ʻua', 'tense', ''), face('sau', 'verb'), face('le teine', 'noun')],
          },
          {
            lane: 1,
            say: 'ʻUa mafai ona sau le teine.',
            en: 'The girl can come.',
            row: [face('ʻUa', 'tense'), face('mafai', 'verb'), { slot: true, label: 'that-word', form: face('ona', 'marker', 'that-word') }, face('sau', 'verb'), face('le teine', 'noun')],
          },
        ],
      },
    ],
  },
]
