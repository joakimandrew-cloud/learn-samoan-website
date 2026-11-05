// Chapter 16's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-16.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 16 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// Both toggles are replaced: 16.1 shows lē dropping into the gap the book names, and 16.2
// shows ʻo arriving after the not-word, where the toggles only swapped whole sentences.
export const REPLACES = ['ch16-negative-slot', 'ch16-habit-or-now']

export const FIGURES = [
  {
    id: '16.1',
    kind: 'row',
    types: ['add'],
    title: 'Which word is new, and where does it sit?',
    caption: 'Nothing else moves: the tense particle stays, the doer stays, the word order stays, and *lē* drops into the gap between the particle and the verb.',
    // After the paragraph that answers the question, before "The not-word keeps its place".
    after: { section: 'the-not-word-le', block: b => b.type === 'p' && b.text.includes('The new word is *lē*') },
    alt: [
      '*Sā siva le teine.* The girl danced.',
      '*Sā lē siva le teine.* The girl did not dance.',
      'Nothing else moves: the tense particle stays, the doer stays, the word order stays, and *lē* drops into the gap between the particle and the verb.',
    ],
    scenes: [{
      key: 'siva',
      tiles: {
        sa: [face('Sā', 'tense')],
        le: [face('lē', 'marker', 'not-word')],
        siva: [face('siva', 'verb')],
        teine: [face('le teine', 'noun')],
      },
      before: { say: 'Sā siva le teine.', en: 'The girl danced.' },
      after: { say: 'Sā lē siva le teine.', en: 'The girl did not dance.' },
      states: [
        [['sa', 0], ['siva', 0], ['teine', 0]],
        [['sa', 0], ['le', 0], ['siva', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'add', tile: 'le', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '16.2',
    kind: 'row',
    types: ['add'],
    title: 'Under the general particle the not-word does two jobs, told apart by one added word.',
    caption: '*ʻOu te lē ʻo alu* denies right now: I am not in the middle of going.',
    // After the paragraph that sets the two sentences side by side, before the table.
    after: { section: 'denying-a-change', block: b => b.type === 'p' && b.text.includes('denies the habit: going is not something I do') },
    alt: [
      '*ʻOu te lē alu.* I do not go.',
      '*ʻOu te lē ʻo alu.* I am not going.',
      '*ʻOu te lē alu* denies the habit: going is not something I do.',
      '*ʻOu te lē ʻo alu* denies right now: I am not in the middle of going.',
    ],
    scenes: [{
      key: 'alu',
      tiles: {
        ou: [face('ʻOu', 'pronoun')],
        te: [face('te', 'tense', 'general particle')],
        le: [face('lē', 'marker', 'not-word')],
        o: [face('ʻo', 'tense', 'happening-now particle')],
        alu: [{ text: 'alu', role: 'verb', label: '' }],
      },
      before: { say: 'ʻOu te lē alu.', en: 'I do not go.' },
      after: { say: 'ʻOu te lē ʻo alu.', en: 'I am not going.' },
      states: [
        [['ou', 0], ['te', 0], ['le', 0], ['alu', 0]],
        [['ou', 0], ['te', 0], ['le', 0], ['o', 0], ['alu', 0]],
      ],
      beats: [{ kind: 'add', tile: 'o', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '16.3',
    kind: 'row',
    types: ['swap'],
    title: 'The not-word *lē* and the not-yet word *leʻi* look alike, but they are two different words.',
    caption: 'They differ in meaning too.',
    // After the paragraph that compares the two words, before the Note on the general particle.
    after: { section: 'the-not-yet-word-lei', block: b => b.type === 'p' && b.text.includes('look alike, but they are two') },
    alt: [
      '*E lē siva le teine.*',
      'The girl does not dance.',
      '*E leʻi siva le teine.*',
      'The girl has not danced yet.',
      'The not-word *lē* and the not-yet word *leʻi* look alike, but they are two different words.',
      'They differ in meaning too.',
    ],
    scenes: [{
      key: 'siva',
      tiles: {
        e: [{ text: 'E', role: 'tense', label: '' }],
        neg: [face('lē', 'marker', 'not-word'), face('leʻi', 'marker', 'not-yet word')],
        siva: [face('siva', 'verb')],
        teine: [face('le teine', 'noun')],
      },
      before: { say: 'E lē siva le teine.', en: 'The girl does not dance.' },
      after: { say: 'E leʻi siva le teine.', en: 'The girl has not danced yet.' },
      states: [
        [['e', 0], ['neg', 0], ['siva', 0], ['teine', 0]],
        [['e', 0], ['neg', 1], ['siva', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'neg', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '16.4',
    kind: 'row',
    types: ['add'],
    title: 'The denial is added as a shell.',
    caption: 'The order inside does not change.',
    // After the paragraph on the shell, before the table of three.
    after: { section: 'saying-something-is-not-so', block: b => b.type === 'p' && b.text.includes('The denial is added as a shell.') },
    alt: [
      '*ʻO se uō le tama.* The boy is a friend.',
      '*E lē ʻo se uō le tama.* The boy is not a friend. (Lit. "It is not the case that the boy is a friend.")',
      'The presenting particle *ʻo* still marks the naming part, exactly as it did in the plain naming sentence; the general particle and the not-word wrap around the front.',
    ],
    scenes: [{
      key: 'uo',
      tiles: {
        e: [face('E', 'tense', 'general particle')],
        le: [face('lē', 'marker', 'not-word')],
        o: [face('ʻO', 'marker', 'presenting particle'), face('ʻo', 'marker', 'presenting particle')],
        uo: [face('se uō', 'noun')],
        tama: [face('le tama', 'noun')],
      },
      before: { say: 'ʻO se uō le tama.', en: 'The boy is a friend.' },
      after: { say: 'E lē ʻo se uō le tama.', en: 'The boy is not a friend.' },
      states: [
        [['o', 0], ['uo', 0], ['tama', 0]],
        [['e', 0], ['le', 0], ['o', 1], ['uo', 0], ['tama', 0]],
      ],
      beats: [{ kind: 'add', tile: ['e', 'le'], roll: 'o', to: 1 }, { kind: 'en' }],
    }],
  },
]
