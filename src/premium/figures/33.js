// Chapter 33's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-33.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 33 holds it to the book.

const face = (text, role, label) => (label ? { text, role, label } : { text, role })

// No REPLACES. The ending moving onto the direction word (faʻatau=a mai to faʻatau mai=a) wants
// a Move of the ending alone, which needs a tile that joins its neighbour with no space; the
// engine joins every tile with a space, so the Interactive ch33-ending-position stays.

export const FIGURES = [
  {
    id: '33.1',
    kind: 'build',
    title: 'Compare them. What has happened to the verb?',
    caption: 'An ending has arrived on it. The verb is *fasi* in the first sentence and *fasi=a* in the second, and everything else about the verb is unchanged.',
    // After the paragraph that answers the question, before "Verbs that take the agent marker".
    after: { section: 'the-two-shapes-of-the-verb', block: b => b.type === 'p' && b.text.includes('An ending has arrived on it') },
    alt: [
      '*Sā fasi le tama e le teine.* The girl hit the boy.',
      '*Sā lē fasi=a le tama e le teine.* The girl did not hit the boy.',
      'An ending has arrived on it.',
    ],
    scenes: [{
      key: 'fasi',
      role: 'verb',
      from: { say: 'fasi', en: 'hit, beat' },
      to: { say: 'fasi=a', en: 'hit, beat' },
      pieces: [{ text: 'fasi' }, { text: '=a', added: true, label: 'ending' }],
    }],
  },
  {
    id: '33.2',
    kind: 'fork',
    ownSlots: true,
    title: 'Commands: The Two Rules That Hold',
    caption: 'The first sentence tells someone to do something, and its verb is the short form. The second forbids the same action, and its verb is the long form.',
    // After the paragraph under the two example sentences, before "A Command Takes the Short Form".
    after: { section: 'commands-the-two-rules-that-hold', block: b => b.type === 'p' && b.text.includes('The first sentence tells someone to do something') },
    alt: [
      '*ʻAi.* Eat.',
      '*ʻAua le ʻaia le meaʻai lenā.* Don\'t eat that food.',
      'The first sentence tells someone to do something, and its verb is the short form. The second forbids the same action, and its verb is the long form.',
    ],
    lanes: [
      { label: 'a command', forms: ['ʻAi'] },
      { label: 'forbidding', forms: ['ʻaia'] },
    ],
    scenes: [{
      key: 'ai',
      cases: [
        { lane: 0, say: 'ʻAi.', en: 'Eat.', row: [{ slot: true, form: face('ʻAi', 'verb', 'short form') }] },
        {
          lane: 1,
          say: 'ʻAua le ʻaia le meaʻai lenā.',
          en: 'Don\'t eat that food.',
          row: [
            // One ringed tile: the book names *ʻaua le* as the unit that takes the long form (lines 125, 218).
            { ...face('ʻAua le', 'verb', 'forbids an action'), ring: true },
            { slot: true, form: face('ʻaia', 'verb', 'long form') },
            face('le meaʻai lenā', 'noun'),
          ],
        },
      ],
    }],
  },
]
