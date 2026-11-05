// Chapter 19's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-19.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 19 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// 19.1 replaces the morning toggle: the Build holds the root taeao still and turns over only
// the front, which answers the book's question "What has changed at the front?"; the toggle
// swapped the two whole words.
export const REPLACES = ['ch19-morning-directions']

export const FIGURES = [
  {
    id: '19.1',
    kind: 'build',
    title: 'What has changed at the front?',
    caption: 'The root *taeao* is the same in both, and only the front differs.',
    // After "The root taeao is the same in both", before the two ends of a sentence agree.
    after: { section: 'time-past-and-time-to-come', block: b => b.type === 'p' && b.text.includes('is the same in both, and only the front differs') },
    alt: ['*anataeao*. this morning', '*ātaeao*. tomorrow morning', 'The root *taeao* is the same in both, and only the front differs.'],
    scenes: [{
      key: 'taeao',
      role: 'marker',
      label: 'time word',
      from: { say: 'anataeao', en: 'this morning' },
      to: { say: 'ātaeao', en: 'tomorrow morning' },
      pieces: [{ text: 'ā', was: 'ana' }, { text: 'taeao' }],
    }],
  },
  {
    id: '19.2',
    kind: 'row',
    types: ['swap'],
    title: 'In these sentences the front of the sentence and the end point the same way.',
    caption: 'The second looks ahead: the future particle *ʻoleʻā* at the front, a word for a coming time at the end.',
    // After "The first sentence looks back", before the note and the table of past time words.
    after: { section: 'time-past-and-time-to-come', block: b => b.type === 'p' && b.text.includes('The first sentence looks back') },
    alt: [
      '*Na siva le teine anataeao.* The girl danced this morning.',
      '*ʻOleʻā siva le teine ātaeao.* The girl will dance tomorrow morning.',
      'In these sentences the front of the sentence and the end point the same way.',
    ],
    scenes: [{
      key: 'siva',
      tiles: {
        tense: [face('Na', 'tense', 'past particle'), face('ʻOleʻā', 'tense', 'future particle')],
        siva: [face('siva', 'verb')],
        teine: [face('le teine', 'noun', 'doer')],
        time: [face('anataeao', 'marker', 'time word'), face('ātaeao', 'marker', 'time word')],
      },
      before: { say: 'Na siva le teine anataeao.', en: 'The girl danced this morning.' },
      after: { say: 'ʻOleʻā siva le teine ātaeao.', en: 'The girl will dance tomorrow morning.' },
      // Both ends turn in one beat: the book never prints a sentence whose ends disagree.
      states: [
        [['tense', 0], ['siva', 0], ['teine', 0], ['time', 0]],
        [['tense', 1], ['siva', 0], ['teine', 0], ['time', 1]],
      ],
      beats: [
        { kind: 'swap', tile: ['tense', 'time'], to: 1 },
        { kind: 'en' },
      ],
    }],
  },
]
