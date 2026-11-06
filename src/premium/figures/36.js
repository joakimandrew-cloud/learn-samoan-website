// Chapter 36's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-36.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 36 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The Add figure lands the not-word between the article and the verb, which the toggle only implies.
export const REPLACES = ['ch36-negative-event']

export const FIGURES = [
  {
    id: '36.1',
    kind: 'row',
    types: ['swap'],
    title: 'What stands after the place word *ʻi* in each?',
    caption: 'Everything before *ʻi* is the same in both, so whatever Sāmoan has done to that event, it has left it able to stand exactly where the thing stood.',
    // After the paragraph that answers the question, before "What it has done is put an article in front of a verb."
    after: { section: 'making-a-le-phrase', block: b => b.type === 'p' && b.text.includes('exactly') },
    alt: [
      '*ʻOu te lē fia manatu ʻi le mea lea.* I do not want to think about that.',
      '*ʻOu te lē fia manatu ʻi le leai o se mea ʻi loʻu manava.* I do not want to think about having nothing in my stomach. (Lit. "...to think of the being absent of anything in my stomach.")',
      'Everything before *ʻi* is the same in both, so whatever Sāmoan has done to that event, it has left it able to stand exactly where the thing stood.',
    ],
    scenes: [
      {
        key: 'manava',
        tiles: {
          head: [face('ʻOu te lē fia manatu', 'quiet')],
          i: [face('ʻi', 'marker', 'place word')],
          np: [face('le mea lea', 'noun', 'noun phrase'), face('le leai o se mea ʻi loʻu manava', 'noun', 'le-phrase')],
        },
        before: { say: 'ʻOu te lē fia manatu ʻi le mea lea.', en: 'I do not want to think about that.' },
        after: { say: 'ʻOu te lē fia manatu ʻi le leai o se mea ʻi loʻu manava.', en: 'I do not want to think about having nothing in my stomach.' },
        states: [
          [['head', 0], ['i', 0], ['np', 0]],
          [['head', 0], ['i', 0], ['np', 1]],
        ],
        beats: [{ kind: 'swap', tile: 'np', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '36.2',
    kind: 'row',
    types: ['add'],
    title: 'The Verb Inside the Phrase',
    caption: 'The word in the middle is still a verb, so it can take the not-word, and a noun in that slot never does.',
    // After the paragraph that says where the not-word stands, before the paragraph on telling it from a noun phrase.
    after: { section: 'the-verb-inside-the-phrase', block: b => b.type === 'p' && b.text.includes('stands between the article and the verb') },
    alt: [
      'The phrase after the with-word *ma* is *le lē fiafia*, "the not being happy".',
      'The not-word *lē* stands between the article and the verb, in the same place it takes in front of a verb in an ordinary sentence.',
    ],
    scenes: [
      {
        key: 'fiafia',
        tiles: {
          le: [face('le', 'marker', 'article')],
          ne: [face('lē', 'marker', 'not-word')],
          v: [face('fiafia', 'verb')],
        },
        before: { say: 'le fiafia', en: 'the being happy' },
        after: { say: 'le lē fiafia', en: 'the not being happy' },
        states: [
          [['le', 0], ['v', 0]],
          [['le', 0], ['ne', 0], ['v', 0]],
        ],
        beats: [{ kind: 'add', tile: 'ne', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '36.3',
    kind: 'row',
    types: ['swap'],
    title: 'Forbidding an Event',
    caption: '*ʻAua* forbids an action, and *sōia* stops an action that is already under way. Naming the action as a le-phrase changes nothing about that choice.',
    // After the paragraph on the difference between the two do-not verbs, before the pattern and its table.
    after: { section: 'forbidding-an-event', block: b => b.type === 'p' && b.text.includes('changes nothing about that choice') },
    alt: [
      '*Sōia le maumau=ina le taimi.* Stop wasting time.',
      '*ʻAua le maumau=ina le taimi.* Do not waste time.',
      'The difference between the two verbs is the one you already have.',
    ],
    scenes: [
      {
        key: 'taimi',
        tiles: {
          dn: [face('Sōia', 'verb', 'do-not verb'), face('ʻAua', 'verb', 'do-not verb')],
          le: [face('le', 'marker', 'article')],
          v: [face('maumau=ina', 'verb', 'long form')],
          obj: [face('le taimi', 'noun', 'noun phrase')],
        },
        before: { say: 'Sōia le maumau=ina le taimi.', en: 'Stop wasting time.' },
        after: { say: 'ʻAua le maumau=ina le taimi.', en: 'Do not waste time.' },
        states: [
          [['dn', 0], ['le', 0], ['v', 0], ['obj', 0]],
          [['dn', 1], ['le', 0], ['v', 0], ['obj', 0]],
        ],
        beats: [{ kind: 'swap', tile: 'dn', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
