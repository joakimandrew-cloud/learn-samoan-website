// Chapter 38's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-38.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. This file carries no colour, size, style or class.
// npm run check:figures -- 38 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The Drop figure shows *ʻo* leaving together with *lea* and staying when only *ona* goes,
// which the contrast steps only state in their notes.
export const REPLACES = ['ch38-then-shapes']

export const FIGURES = [
  {
    id: '38.1',
    kind: 'row',
    types: ['add'],
    // The section heading, the first author's title for the two-scene figure; the book's
    // question stands three blocks above the figure's new place and is 1 px too tall at 390.
    title: 'Adding *Loa* and the Pointing-Back Word',
    caption: 'It carries the succession by itself, so putting it inside a construction that already carries the succession changes little if anything.',
    // After the paragraph on what *ai* points back to, so both scenes follow their points
    // (the first author's placement, restored with the *ai* scene; Engine-Limits rows 41, 42).
    after: { section: 'adding-loa', block: b => b.type === 'p' && b.text.includes('is usually read as pointing not at the branches') },
    alt: [
      '*Ona alu lea ʻo le tama.* Then the boy went.',
      '*Ona alu loa lea ʻo le tama.* Then the boy went.',
      'The added word is *loa*, and the English did nothing at all.',
      '*ʻUa lilo atu ʻi le toga lālā le teine, ona oso lea ʻi lalo le tama.* The girl hid in the cluster of branches and then the boy jumped down.',
      '*ʻUa lilo atu ʻi le toga lālā le teine, ona oso ai lea ʻi lalo le tama.* The girl hid in the cluster of branches and then the boy jumped down.',
      '*Ai* here is usually read as pointing not at the branches or at the girl but at the hiding, and at everything the story has said up to that moment.',
    ],
    scenes: [
      {
        key: 'loa',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', '')],
          loa: [face('loa', 'marker', 'then-word')],
          lea: [face('lea', 'marker', 'closing word')],
          rest: [face('ʻo le tama', 'quiet')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Ona alu loa lea ʻo le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['rest', 0]],
          [['ona', 0], ['alu', 0], ['loa', 0], ['lea', 0], ['rest', 0]],
        ],
        beats: [{ kind: 'add', tile: 'loa', to: 1 }, { kind: 'en' }],
      },
      {
        key: 'ai',
        caption: '*Ai* here is usually read as pointing not at the branches or at the girl but at the hiding, and at everything the story has said up to that moment.',
        tiles: {
          first: [face('ʻUa lilo atu ʻi le toga lālā le teine,', 'quiet')],
          ona: [face('ona', 'marker', 'opening word')],
          oso: [face('oso', 'verb', '')],
          ai: [face('ai', 'marker', 'pointing-back word')],
          lea: [face('lea', 'marker', 'closing word')],
          rest: [face('ʻi lalo le tama', 'quiet')],
        },
        before: { say: 'ʻUa lilo atu ʻi le toga lālā le teine, ona oso lea ʻi lalo le tama.', en: 'The girl hid in the cluster of branches and then the boy jumped down.' },
        after: { say: 'ʻUa lilo atu ʻi le toga lālā le teine, ona oso ai lea ʻi lalo le tama.', en: 'The girl hid in the cluster of branches and then the boy jumped down.' },
        states: [
          [['first', 0], ['ona', 0], ['oso', 0], ['lea', 0], ['rest', 0]],
          [['first', 0], ['ona', 0], ['oso', 0], ['ai', 0], ['lea', 0], ['rest', 0]],
        ],
        beats: [{ kind: 'add', tile: 'ai', to: 1 }, { kind: 'en' }],
      },
    ],
  },
  {
    id: '38.2',
    kind: 'row',
    types: ['drop'],
    title: 'The Shorter Shapes of the Then-Construction',
    caption: 'What the clause names changes shape with them: with *lea* gone it stands in its plain form, and after *lea* it usually takes the presenting particle *ʻo*, whether *ona* is there or not.',
    // After the paragraph that says either word can drop, before the paragraph on modern writing.
    after: { section: 'the-shorter-shapes', block: b => b.type === 'p' && b.text.includes('runs the construction short') },
    alt: [
      '*Ona alu lea ʻo le tama.* Then the boy went.',
      '*Ona alu le tama.* Then the boy went.',
      '*Alu lea ʻo le tama.* Then the boy went.',
      'Drop *lea* and *ona* carries the succession on its own; drop *ona* and *lea* carries it.',
    ],
    scenes: [
      {
        key: 'nolea',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', '')],
          lea: [face('lea', 'marker', 'closing word')],
          o: [face('ʻo', 'marker', 'presenting particle')],
          tama: [face('le tama', 'noun')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Ona alu le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['o', 0], ['tama', 0]],
          [['ona', 0], ['alu', 0], ['tama', 0]],
        ],
        beats: [{ kind: 'drop', tile: ['lea', 'o'], to: 1 }, { kind: 'en' }],
      },
      {
        key: 'noona',
        tiles: {
          ona: [face('Ona', 'marker', 'opening word')],
          alu: [face('alu', 'verb', ''), face('Alu', 'verb', '')],
          lea: [face('lea', 'marker', 'closing word')],
          o: [face('ʻo', 'marker', 'presenting particle')],
          tama: [face('le tama', 'noun')],
        },
        before: { say: 'Ona alu lea ʻo le tama.', en: 'Then the boy went.' },
        after: { say: 'Alu lea ʻo le tama.', en: 'Then the boy went.' },
        states: [
          [['ona', 0], ['alu', 0], ['lea', 0], ['o', 0], ['tama', 0]],
          [['alu', 1], ['lea', 0], ['o', 0], ['tama', 0]],
        ],
        beats: [{ kind: 'drop', tile: 'ona', roll: 'alu', to: 1 }, { kind: 'en' }],
      },
    ],
  },
]
