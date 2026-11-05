// Chapter 18's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-18.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 18 holds it to the book.
//
// 18.1 replaces ch18-location-through-time: the same three sentences, but the particle slot
// turns over in place while ʻi le fale and le teine hold still, which is the book's point
// ("The place stays put; the tense particle in front of it carries the time").
// 18.2 swaps the where-word for the place: question and answer share one fronted shape.
// 18.3 adds the not-word in front of ʻi ai, which the toggle beside it does not show.
// ʻi ai is one tile in both figures that carry it, so it is never drawn two ways.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

export const REPLACES = ['ch18-location-through-time']

export const FIGURES = [
  {
    id: '18.1',
    kind: 'row',
    types: ['swap'],
    title: 'The Tense Particle on a Place',
    caption: 'The place stays put; the tense particle in front of it carries the time, just as it does for a verb.',
    // After the paragraph that names the three particles and states the point.
    after: { section: 'the-tense-particle-on-a-place', block: b => b.type === 'p' && b.text.includes('The place stays put') },
    alt: [
      '*Sā ʻi le fale le teine.* The girl was in the house.',
      '*ʻUa ʻi le fale le teine.* The girl is now in the house.',
      '*ʻOleʻā ʻi le fale le teine.* The girl will be in the house.',
      'The place stays put; the tense particle in front of it carries the time, just as it does for a verb.',
    ],
    chips: [
      { state: 0, sm: 'sā' },
      { state: 1, sm: 'ʻua' },
      { state: 2, sm: 'ʻoleʻā' },
    ],
    scenes: [{
      key: 'fale',
      tiles: {
        tp: [face('Sā', 'tense', 'past particle'), face('ʻUa', 'tense', 'change particle'), face('ʻOleʻā', 'tense', 'future particle')],
        i: [face('ʻi', 'marker', 'place word')],
        fale: [face('le fale', 'noun', 'place')],
        teine: [face('le teine', 'noun')],
      },
      lines: [
        { say: 'Sā ʻi le fale le teine.', en: 'The girl was in the house.' },
        { say: 'ʻUa ʻi le fale le teine.', en: 'The girl is now in the house.' },
        { say: 'ʻOleʻā ʻi le fale le teine.', en: 'The girl will be in the house.' },
      ],
      states: [
        [['tp', 0], ['i', 0], ['fale', 0], ['teine', 0]],
        [['tp', 1], ['i', 0], ['fale', 0], ['teine', 0]],
        [['tp', 2], ['i', 0], ['fale', 0], ['teine', 0]],
      ],
      beats: [
        { kind: 'swap', tile: 'tp', to: 1 },
        { kind: 'swap', tile: 'tp', to: 2 },
      ],
    }],
  },
  {
    id: '18.2',
    kind: 'row',
    types: ['swap'],
    title: 'The answer names the place in the same fronted shape',
    caption: 'The place leads with *ʻo*, and *ʻi ai* answers it.',
    // After the paragraph that follows the two answers, before the next section.
    after: { section: 'asking-where', block: b => b.type === 'p' && b.text.includes('The place leads with *ʻo*') },
    alt: [
      '*ʻO fea e ʻi ai le teine?* Where is the girl?',
      '*ʻO le fale e ʻi ai le teine.* The girl is in the house.',
      'The place leads with *ʻo*, and *ʻi ai* answers it.',
    ],
    scenes: [{
      key: 'teine',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        place: [face('fea', 'marker', 'where-word'), face('le fale', 'noun', 'place')],
        e: [face('e', 'tense', 'general particle')],
        iai: [face('ʻi ai', 'marker', 'the place where')],
        teine: [face('le teine', 'noun')],
      },
      before: { say: 'ʻO fea e ʻi ai le teine?', en: 'Where is the girl?' },
      after: { say: 'ʻO le fale e ʻi ai le teine.', en: 'The girl is in the house.' },
      states: [
        [['o', 0], ['place', 0], ['e', 0], ['iai', 0], ['teine', 0]],
        [['o', 0], ['place', 1], ['e', 0], ['iai', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'place', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '18.3',
    kind: 'row',
    types: ['add'],
    title: 'Location turns to *lē ʻi ai*',
    caption: 'In the second, a location is denied: the "not" is the separate not-word *lē* standing in front of *ʻi ai*.',
    // After the paragraph that tells the two negatives apart, before the Note.
    after: { section: 'the-where-sentence-and-the-there-is-verb', block: b => b.type === 'p' && b.text.includes('location turns to *lē ʻi ai*') },
    alt: [
      '*ʻO le nuʻu e ʻi ai le teine.* The girl is in the village.',
      '*ʻO le nuʻu e lē ʻi ai le teine.* The girl is not in the village.',
      'In the second, a location is denied: the "not" is the separate not-word *lē* standing in front of *ʻi ai*.',
    ],
    scenes: [{
      key: 'nuu',
      tiles: {
        o: [face('ʻO', 'marker', 'presenting particle')],
        nuu: [face('le nuʻu', 'noun', 'place')],
        e: [face('e', 'tense', '')],
        le: [face('lē', 'marker', 'not-word')],
        iai: [face('ʻi ai', 'marker', 'the place where')],
        teine: [face('le teine', 'noun')],
      },
      before: { say: 'ʻO le nuʻu e ʻi ai le teine.', en: 'The girl is in the village.' },
      after: { say: 'ʻO le nuʻu e lē ʻi ai le teine.', en: 'The girl is not in the village.' },
      states: [
        [['o', 0], ['nuu', 0], ['e', 0], ['iai', 0], ['teine', 0]],
        [['o', 0], ['nuu', 0], ['e', 0], ['le', 0], ['iai', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'add', tile: 'le', to: 1 }, { kind: 'en' }],
    }],
  },
]
