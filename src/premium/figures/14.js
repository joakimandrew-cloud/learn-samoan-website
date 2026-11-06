// Chapter 14's figures, as data (plan 2026-11-06-chapter-page-simplify; the plan for them is
// reviews/lesson-simplify-2026-11-06/Direction.md part 6). Every Sāmoan and English string
// here is copied from book/Chapter-14.md, every macron and ʻ kept; titles, captions, lane
// labels and text alternatives are phrases the book prints. Rich strings mark Sāmoan with
// *asterisks*. The look lives in chapter-page.css and the engine: this file carries no colour,
// size, style or class. npm run check:figures -- 14 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// The toggle of the two sentences is replaced by Figure 14.1, which shows the student which
// words went where, the question the book asks (Figure-Ledger.md has the reason).
export const REPLACES = ['ch14-particle-position']

export const FIGURES = [
  {
    id: '14.1',
    kind: 'row',
    types: ['drop', 'add'],
    title: 'Where does the particle sit?',
    caption: 'This is the one place the order you have used in every sentence so far flips.',
    // After the paragraph that answers the question, before "One thing to recognize rather than to build".
    after: { section: 'when-a-pronoun-comes-in-te', block: b => b.type === 'p' && b.text.includes('it is the plain *e*') },
    alt: [
      '*Sā ʻou alu.* I went.',
      '*ʻOu te alu.* I go.',
      'In *ʻOu te alu* the pronoun *ʻou* comes first, and the particle follows it.',
    ],
    scenes: [
      {
        key: 'alu',
        tiles: {
          sa: [face('Sā', 'tense')],
          ou: [face('ʻou', 'pronoun'), face('ʻOu', 'pronoun')],
          te: [face('te', 'tense', 'general particle')],
          alu: [face('alu', 'verb')],
        },
        before: { say: 'Sā ʻou alu.', en: 'I went.' },
        after: { say: 'ʻOu te alu.', en: 'I go.' },
        states: [
          [['sa', 0], ['ou', 0], ['alu', 0]],
          [['GHOST'], ['ou', 0], ['alu', 0]],
          [['ou', 1], ['te', 0], ['alu', 0]],
        ],
        // Sā leaves its place open; then the pronoun closes up to lead and te rises in after it;
        // then the English. The gap stays drawn until te lands, so no held frame reads as a
        // sentence the book never prints (the in-between rule, Step 9 batch 3).
        beats: [
          { kind: 'drop', tile: 'sa', to: 1 },
          { kind: 'add', tile: 'te', roll: 'ou', to: 2 },
          { kind: 'en' },
        ],
      },
    ],
  },
  {
    id: '14.2',
    kind: 'fork',
    types: ['fork-readings'],
    ownSlots: true,
    title: 'The general particle *te* is what tells the two apart.',
    // After the Note on na, before "The general particle carries the same four senses".
    after: { section: 'when-a-pronoun-comes-in-te', block: b => b.type === 'note' && b.text.includes('is what tells the two apart') },
    lanes: [
      { label: 'past particle', forms: [] },
      { label: 'the word for he or she', forms: [] },
    ],
    alt: [
      'In *Na te alu*, *na* is the word for he or she and *te* is the general particle, so the sentence means he goes.',
      'The same shape *na* also serves as a past particle from earlier in this book, so *Na alu*, with no *te*, means he went (Lit. “past go”).',
    ],
    scenes: [
      {
        key: 'na',
        cases: [
          // No te in this lane: an empty slot drawn open where te would sit, ringed as the decider,
          // and no ring on alu, because the book's test is the absent te ("Na alu, with no te,
          // means he went").
          {
            lane: 0, say: 'Na alu', en: 'he went',
            row: [{ ...face('Na', 'tense', 'past particle'), reads: true }, { slot: true, ring: true }, face('alu', 'verb')],
          },
          {
            lane: 1, say: 'Na te alu.', en: 'He goes. She goes.',
            row: [{ ...face('Na', 'pronoun', 'the word for he or she'), reads: true }, { ...face('te', 'tense', 'general particle'), ring: true }, face('alu', 'verb')],
          },
        ],
      },
    ],
  },
]
