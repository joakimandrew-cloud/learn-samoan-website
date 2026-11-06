// Chapter 27's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-27.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 27 holds it to the book.

// No figure on the frame itself: the Interactive grid ch27-spatial-frame already sets the five
// printed rows side by side, and the book prints no pair that changes the spatial noun alone.
// No figure on the stretched vowels (lalō, lugā, utā): the book keeps them for recognition only.

export const FIGURES = [
  {
    id: '27.1',
    kind: 'build',
    title: 'What is gone from the shorter one?',
    caption: '*Tua* joins straight onto *fale*, and the vowel at the join lengthens.',
    // After the answer to the book's question, before the note that only tua and luma fuse.
    after: { section: 'words-that-fuse', block: b => b.type === 'p' && b.text.includes('and the vowel at the join lengthens') },
    alt: ['*tua o le fale*. the space behind the house', '*tuāfale*. the space behind the house', 'The belonging word and the article.', '*Tua* joins straight onto *fale*, and the vowel at the join lengthens.'],
    scenes: [{
      key: 'tuafale',
      role: 'noun',
      label: 'noun',
      from: { say: 'tua o le fale', en: 'the space behind the house', label: '' },
      to: { say: 'tuāfale', en: 'the space behind the house' },
      pieces: [{ text: 'tu' }, { text: 'ā', was: 'a' }, { text: ' o le ', removed: true }, { text: 'fale' }],
    }],
  },
]
