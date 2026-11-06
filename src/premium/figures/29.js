// Chapter 29: the maker-prefix *faʻa-*. Every string is copied from book/Chapter-29.md.
export const FIGURES = [
  {
    id: '29.1',
    kind: 'build',
    title: 'Building a Word with *Faʻa-*',
    caption: 'The prefix never changes its own shape, the word behind it keeps its spelling and its marks, and the two are written together as one word.',
    after: { section: 'building-a-word-with-faa', block: b => b.type === 'p' && b.text.includes('two parts in a fixed order') },
    alt: [
      'The prefix never changes its own shape, the word behind it keeps its spelling and its marks, and the two are written together as one word.',
      'The pattern of this chapter has two parts in a fixed order: *faʻa-* first, then the noun or verb it is built on.',
    ],
    scenes: [
      {
        key: 'alu',
        role: 'verb',
        from: { say: 'alu', en: 'go' },
        to: { say: 'faʻaalu', en: 'make go' },
        pieces: [{ text: 'faʻa', added: true, label: 'maker-prefix' }, { text: 'alu' }],
      },
      {
        key: 'masima',
        role: 'quiet',
        from: { say: 'māsima', en: 'salt' },
        to: { say: 'faʻamāsima', en: 'to salt' },
        pieces: [{ text: 'faʻa', added: true, label: 'maker-prefix' }, { text: 'māsima' }],
      },
    ],
  },
  {
    id: '29.2',
    kind: 'build',
    title: 'Saying a Negative Gently',
    caption: 'The shape is the prefix, then *lē*, then the word being denied.',
    after: { section: 'saying-a-negative-gently', block: b => b.type === 'p' && b.text.includes('then the word being denied') },
    alt: [
      'Between *tonu* and the prefix stands *lē*, the not-word taught earlier in this book, and the three pieces are written as one word.',
      'The shape is the prefix, then *lē*, then the word being denied.',
    ],
    scenes: [
      {
        key: 'tonu',
        role: 'quiet',
        from: { say: 'tonu', en: 'right, correct' },
        to: { say: 'faʻalētonu', en: 'uncertain, doubtful' },
        pieces: [{ text: 'faʻa', added: true, label: 'maker-prefix' }, { text: 'lē', added: true, label: 'not-word' }, { text: 'tonu' }],
      },
      {
        key: 'aoga',
        role: 'quiet',
        from: { say: 'aogā', en: 'use, useful' },
        to: { say: 'faʻalēaogā', en: 'cancel, annul' },
        pieces: [{ text: 'faʻa', added: true, label: 'maker-prefix' }, { text: 'lē', added: true, label: 'not-word' }, { text: 'aogā' }],
      },
    ],
  },
]
