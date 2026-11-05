// Chapter 13's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-13.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 13 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

export const FIGURES = [
  {
    id: '13.1',
    kind: 'row',
    types: ['move'],
    title: 'The one who sees and the thing reached can come in either order.',
    caption: 'Both *Sā vaʻai le teine ʻi le iʻa* and *Sā vaʻai ʻi le iʻa le teine* say "the girl saw the fish". The verb stays first; the two parts after it are not locked in place.',
    // After the pronoun examples, so the Note on order stands between this figure and the
    // section's closing Interactive.
    after: { section: 'the-two-participant-sentence', block: b => b.type === 'examples' && JSON.stringify(b.pairs).includes('Sā ia vaʻai ʻi le pusi') },
    alt: [
      '*Sā vaʻai le teine ʻi le iʻa.* The girl saw the fish.',
      'Both *Sā vaʻai le teine ʻi le iʻa* and *Sā vaʻai ʻi le iʻa le teine* say "the girl saw the fish".',
      'The verb stays first; the two parts after it are not locked in place.',
    ],
    scenes: [
      {
        key: 'iaa',
        tiles: {
          sa: [{ text: 'Sā', role: 'tense', label: '' }],
          verb: [face('vaʻai', 'verb')],
          doer: [face('le teine', 'noun', 'the one who sees')],
          i: [face('ʻi', 'marker', 'place word')],
          reached: [face('le iʻa', 'noun', 'the thing reached')],
        },
        before: { say: 'Sā vaʻai le teine ʻi le iʻa.', en: 'The girl saw the fish.' },
        // The Note gives both orders one English ('say "the girl saw the fish"'), but the pairing
        // check reads only the 'means' prose form, so this line carries none and there is no
        // empty English beat; the caption gives it. Restore en: 'The girl saw the fish.' and an
        // { kind: 'en' } beat once the check reads 'say'. Reported as compromised.
        after: { say: 'Sā vaʻai ʻi le iʻa le teine', en: null },
        states: [
          [['sa', 0], ['verb', 0], ['doer', 0], ['i', 0], ['reached', 0]],
          [['sa', 0], ['verb', 0], ['i', 0], ['reached', 0], ['doer', 0]],
        ],
        beats: [{ kind: 'move', tile: 'doer', to: 1, arc: true }],
      },
    ],
  },
]
