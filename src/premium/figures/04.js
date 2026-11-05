// Chapter 4's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-04.md, every macron and ʻ kept; titles,
// captions, lane labels and text alternatives are phrases the book prints. The lane labels
// follow the 2026-11-02 ruling's wording: na "it happened", sā "that's how it was". Mosel's
// rarer uses stay out of the figure, as the ruling says. The look lives in chapter-page.css
// and the engine: this file carries no colour, size, style or class.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })
const past = text => ({ slot: true, form: face(text, 'tense', 'past particle') })

export const FIGURES = [
  {
    id: '4.1',
    kind: 'fork',
    types: ['fork-meaning'],
    title: 'One rule decides which',
    caption: 'How long ago it happened does not decide the choice; the test does.',
    // After the test paragraph, before the table of na and sā pairs.
    after: { section: 'the-two-pasts', block: b => b.type === 'p' && b.text.includes('the test does') },
    lanes: [
      { label: 'it happened', forms: ['na'] },
      { label: "that's how it was", forms: ['sā'] },
    ],
    alt: [
      '*Na ʻou maʻi.* I fell sick. (at that moment)',
      '*Sā ʻou maʻi.* I was sick. (all that time)',
      '*Na ʻou fāgota.* I went fishing. (that one trip)',
      '*Sā ʻou fāgota.* I used to go fishing, I was fishing. (in those days)',
      '*Na ʻou ala.* I woke up. (at that moment)',
      '*Sā ʻou ala.* I was awake. (all that time)',
    ],
    scenes: [
      {
        key: 'mai',
        cases: [
          { lane: 0, say: 'Na ʻou maʻi.', en: 'I fell sick. (at that moment)', row: [past('Na'), face('ʻou', 'pronoun'), face('maʻi', 'verb')] },
          { lane: 1, say: 'Sā ʻou maʻi.', en: 'I was sick. (all that time)', row: [past('Sā'), face('ʻou', 'pronoun'), face('maʻi', 'verb')] },
        ],
      },
      {
        key: 'fagota',
        cases: [
          { lane: 0, say: 'Na ʻou fāgota.', en: 'I went fishing. (that one trip)', row: [past('Na'), face('ʻou', 'pronoun'), face('fāgota', 'verb')] },
          { lane: 1, say: 'Sā ʻou fāgota.', en: 'I used to go fishing, I was fishing. (in those days)', row: [past('Sā'), face('ʻou', 'pronoun'), face('fāgota', 'verb')] },
        ],
      },
      {
        key: 'ala',
        cases: [
          { lane: 0, say: 'Na ʻou ala.', en: 'I woke up. (at that moment)', row: [past('Na'), face('ʻou', 'pronoun'), face('ala', 'verb')] },
          { lane: 1, say: 'Sā ʻou ala.', en: 'I was awake. (all that time)', row: [past('Sā'), face('ʻou', 'pronoun'), face('ala', 'verb')] },
        ],
      },
    ],
  },
  {
    // Something that goes on for a while, the kind 4.1's scenes do not show (a state, a habit):
    // nofo and siva, with the English the book prints for each line.
    id: '4.2',
    kind: 'fork',
    types: ['fork-meaning'],
    title: 'Things Going On',
    caption: 'English "was ...ing" and "stayed" show a *sā* line of this kind.',
    after: { section: 'things-going-on', block: b => b.type === 'p' && b.text.includes('all that time, I stayed') },
    lanes: [
      { label: 'it happened', forms: ['na'] },
      { label: "that's how it was", forms: ['sā'] },
    ],
    alt: [
      '*Na ʻou nofo.* I sat down.',
      '*Sā ʻou nofo.* I stayed.',
      'A simple past that names the event, "sat down" or "danced", shows a *na* line.',
      'English "was ...ing" and "stayed" show a *sā* line of this kind.',
    ],
    scenes: [
      {
        key: 'nofo',
        cases: [
          { lane: 0, say: 'Na ʻou nofo.', en: 'I sat down.', row: [past('Na'), face('ʻou', 'pronoun'), face('nofo', 'verb')] },
          { lane: 1, say: 'Sā ʻou nofo.', en: 'I stayed.', row: [past('Sā'), face('ʻou', 'pronoun'), face('nofo', 'verb')] },
        ],
      },
      {
        key: 'siva',
        cases: [
          { lane: 0, say: 'Na mātou siva.', en: 'We danced.', row: [past('Na'), face('mātou', 'pronoun'), face('siva', 'verb')] },
          { lane: 1, say: 'Sā mātou siva.', en: 'We were dancing.', row: [past('Sā'), face('mātou', 'pronoun'), face('siva', 'verb')] },
        ],
      },
    ],
  },
  {
    // The same verb, ʻāmata, both ways: the book prints Na ʻāmata at the head of the section and
    // Sā ʻāmata after the paragraph that follows, so the reader would otherwise compare two places.
    id: '4.3',
    kind: 'fork',
    types: ['fork-meaning'],
    title: 'Beginnings and Ends',
    caption: 'A beginning that came round again and again is a regular pattern, and a regular pattern takes *sā*',
    after: { section: 'beginnings-and-ends', block: b => b.type === 'p' && b.text.includes('week after week') },
    lanes: [
      { label: 'it happened', forms: ['na'] },
      { label: "that's how it was", forms: ['sā'] },
    ],
    alt: [
      '*Na ʻāmata.* It began. (Lit. "past begin")',
      '*Sā ʻāmata.* It used to begin. (Lit. "past begin")',
    ],
    scenes: [
      {
        key: 'amata',
        cases: [
          { lane: 0, say: 'Na ʻāmata.', en: 'It began.', row: [past('Na'), face('ʻāmata', 'verb')] },
          { lane: 1, say: 'Sā ʻāmata.', en: 'It used to begin.', row: [past('Sā'), face('ʻāmata', 'verb')] },
        ],
      },
    ],
  },
]
