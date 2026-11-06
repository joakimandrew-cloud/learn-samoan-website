// Chapter 47's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-47.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 47 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// 47.1 lands the two added parts, the with-word ma and the le-phrase, after a sentence the
// reader can already build. The Interactive ch47-state-while-acting toggles fiafia against
// lē fiafia (the not-word inside the phrase), a different point, so it stays.
// 47.2 adds the belonging phrase that turns the short e ʻese phrase into a sentence, which
// the book's table only lists. Both land their tiles in one beat (the in-between rule).
// The exclamation section gets none: no printed pair shows the presenting particle left off
// one sentence, so a Drop would compose Sāmoan the chapter never prints.

export const FIGURES = [
  {
    id: '47.1',
    kind: 'row',
    types: ['add'],
    title: 'The pattern adds two parts to a sentence you can already build',
    caption: 'The *ma* phrase follows the verb. It can stand straight after it, before the doer and the thing acted on, as in the mother\'s sentence, or after the thing acted on, as in the speaker\'s.',
    after: { section: 'saying-how-someone-acts', block: b => b.type === 'p' && b.text.includes('The pattern adds two parts') },
    alt: [
      '*Na ʻou tausi=a le pepe.*',
      '*Na ʻou tausi=a le pepe ma le fiafia.* I took care of the baby happily.',
      'The pattern adds two parts to a sentence you can already build: the with-word *ma*, then a le-phrase naming the doer’s feeling or bodily state.',
    ],
    scenes: [
      {
        key: 'tausia',
        tiles: {
          na: [face('Na', 'tense', '')],
          ou: [face('ʻou', 'pronoun', '')],
          tausia: [face('tausi=a', 'verb')],
          pepe: [face('le pepe', 'noun', '')],
          ma: [face('ma', 'marker', 'with-word')],
          lefiafia: [face('le fiafia', 'noun', 'le-phrase')],
        },
        before: { say: 'Na ʻou tausi=a le pepe.', en: null },
        after: { say: 'Na ʻou tausi=a le pepe ma le fiafia.', en: 'I took care of the baby happily.' },
        states: [
          [['na', 0], ['ou', 0], ['tausia', 0], ['pepe', 0]],
          [['na', 0], ['ou', 0], ['tausia', 0], ['pepe', 0], ['ma', 0], ['lefiafia', 0]],
        ],
        beats: [{ kind: 'add', tile: ['ma', 'lefiafia'], to: 1 }, { kind: 'en' }],
      },
      {
        key: 'nofo',
        tiles: {
          sa: [face('Sā', 'tense', '')],
          ou: [face('ʻou', 'pronoun', '')],
          nofo: [face('nofo', 'verb')],
          ma: [face('ma', 'marker', 'with-word')],
          lefa: [face('le faʻanoanoa', 'noun', 'le-phrase')],
        },
        before: { say: 'Sā ʻou nofo.', en: null },
        after: { say: 'Sā ʻou nofo ma le faʻanoanoa.', en: 'I stayed and was sad.' },
        states: [
          [['sa', 0], ['ou', 0], ['nofo', 0]],
          [['sa', 0], ['ou', 0], ['nofo', 0], ['ma', 0], ['lefa', 0]],
        ],
        beats: [{ kind: 'add', tile: ['ma', 'lefa'], to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '47.2',
    kind: 'row',
    types: ['add'],
    title: 'Add a belonging phrase naming what has the quality, and the phrase becomes a sentence',
    caption: '*E ʻese* with a le-phrase stresses that a quality of a thing or a person is out of the ordinary.',
    after: { section: 'judging-an-event', block: b => b.type === 'examples' && JSON.stringify(b.pairs).includes('e ʻese le mānaia') },
    alt: [
      '*e ʻese le mānaia*. be extremely nice (Lit. "the being nice is extraordinary")',
      '*E ʻese le mānaia o le ʻula.*',
      'In every row the belonging word is *o*, because a quality is not something anybody does.',
    ],
    scenes: [
      {
        key: 'ula',
        tiles: {
          e: [face('e', 'tense', ''), face('E', 'tense', '')],
          ese: [face('ʻese', 'verb', 'judging verb')],
          lp: [face('le mānaia', 'noun', 'le-phrase')],
          o: [face('o', 'marker', 'belonging word')],
          ula: [face('le ʻula', 'noun')],
        },
        before: { say: 'e ʻese le mānaia', en: 'be extremely nice' },
        after: { say: 'E ʻese le mānaia o le ʻula.', en: 'The necklace is extremely nice.' },
        states: [
          [['e', 0], ['ese', 0], ['lp', 0]],
          [['e', 1], ['ese', 0], ['lp', 0], ['o', 0], ['ula', 0]],
        ],
        beats: [{ kind: 'add', tile: ['o', 'ula'], roll: 'e', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'tala',
        tiles: {
          e: [face('e', 'tense', ''), face('E', 'tense', '')],
          ese: [face('ʻese', 'verb', 'judging verb')],
          lp: [face('le lelei', 'noun', 'le-phrase')],
          o: [face('o', 'marker', 'belonging word')],
          tala: [face('le tala', 'noun')],
        },
        before: { say: 'e ʻese le lelei', en: 'be extremely good' },
        after: { say: 'E ʻese le lelei o le tala.', en: 'The story is extremely good.' },
        states: [
          [['e', 0], ['ese', 0], ['lp', 0]],
          [['e', 1], ['ese', 0], ['lp', 0], ['o', 0], ['tala', 0]],
        ],
        beats: [{ kind: 'add', tile: ['o', 'tala'], roll: 'e', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
