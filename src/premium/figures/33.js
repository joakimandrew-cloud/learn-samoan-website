// Chapter 33's figures, as data (plan 2026-11-06-chapter-page-simplify). Every Sāmoan and
// English string here is copied from book/Chapter-33.md, every macron and ʻ kept; titles,
// captions, labels and text alternatives are phrases the book prints. Rich strings mark
// Sāmoan with *asterisks*. The look lives in chapter-page.css and the engine: this file
// carries no colour, size, style or class. npm run check:figures -- 33 holds it to the book.

const face = (text, role, label) => (label != null ? { text, role, label } : { text, role })

// The ending moving onto the direction word is a Move of the ending alone (attach: true), and
// it teaches what the Interactive ch33-ending-position toggled: the ending travels while the
// meaning holds still.
export const REPLACES = ['ch33-ending-position']

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
    kind: 'row',
    title: 'The Ending on a Direction Word',
    caption: 'Speakers accept both, and both mean the same thing.',
    // After the paragraph under the two example sentences, inside Building the Long Form.
    after: { section: 'building-the-long-form', block: b => b.type === 'p' && b.text.includes('Speakers accept both') },
    alt: [
      '*ʻO ai na faʻatau=a mai le tusi?* Who bought the book? (Lit. "Who traded the book toward here?")',
      '*ʻO ai na faʻatau mai=a le tusi?* Who bought the book?',
      'Speakers accept both, and both mean the same thing.',
    ],
    scenes: [{
      key: 'faatau',
      tiles: {
        o: [face('ʻO', 'quiet')],
        ai: [face('ai', 'quiet')],
        na: [face('na', 'tense', '')],
        verb: [face('faʻatau', 'verb', '')],
        a: [{ ...face('=a', 'marker', 'ending'), attach: true }],
        mai: [face('mai', 'marker', 'direction word')],
        tusi: [face('le tusi', 'noun', '')],
      },
      before: { say: 'ʻO ai na faʻatau=a mai le tusi?', en: 'Who bought the book?' },
      after: { say: 'ʻO ai na faʻatau mai=a le tusi?', en: 'Who bought the book?' },
      states: [
        [['o', 0], ['ai', 0], ['na', 0], ['verb', 0], ['a', 0], ['mai', 0], ['tusi', 0]],
        [['o', 0], ['ai', 0], ['na', 0], ['verb', 0], ['GHOST'], ['mai', 0], ['a', 0], ['tusi', 0]],
      ],
      beats: [{ kind: 'move', tile: 'a', to: 1, arc: true }, { kind: 'en' }],
    }],
  },
  {
    id: '33.3',
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
            // One ring round the pair: the book names *ʻaua le* as the unit that takes the long form
            // (lines 125, 218), and splits it into the do-not verb and the specific article (140-142).
            { ...face('ʻAua', 'verb', 'do-not verb'), ring: true },
            { ...face('le', 'marker', 'specific article'), ring: true },
            { slot: true, form: face('ʻaia', 'verb', 'long form') },
            face('le meaʻai lenā', 'noun'),
          ],
        },
      ],
    }],
  },
]
