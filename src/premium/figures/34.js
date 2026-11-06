const face = (text, role, label) => (label !== undefined ? { text, role, label } : { text, role })

export const REPLACES = ['ch34-report-time']

export const FIGURES = [
  {
    id: '34.1',
    kind: 'row',
    title: 'Which word changed?',
    caption: '*ʻUa iloa* became *Na iloa*, and the second half of the sentence stayed word for word the same, *ʻua sau le teine*, while the English moved from "has come" to "had come".',
    after: { section: 'reporting-what-someone-knew', block: b => b.type === 'p' && b.text.includes('became *Na iloa*') },
    alt: [
      '*ʻUa iloa e le tama ʻua sau le teine.* The boy knows that the girl has come.',
      '*Na iloa e le tama ʻua sau le teine.* The boy knew that the girl had come.',
      '*ʻUa iloa* became *Na iloa*, and the second half of the sentence stayed word for word the same, *ʻua sau le teine*, while the English moved from "has come" to "had come".',
    ],
    scenes: [{
      key: 'sau',
      tiles: {
        first: [face('ʻUa', 'tense'), face('Na', 'tense')],
        iloa: [face('iloa', 'verb', 'knowing word')],
        tama: [face('e le tama', 'quiet')],
        inner: [face('ʻua', 'tense')],
        teine: [face('sau le teine', 'quiet')],
      },
      before: { say: 'ʻUa iloa e le tama ʻua sau le teine.', en: 'The boy knows that the girl has come.' },
      after: { say: 'Na iloa e le tama ʻua sau le teine.', en: 'The boy knew that the girl had come.' },
      states: [
        [['first', 0], ['iloa', 0], ['tama', 0], ['inner', 0], ['teine', 0]],
        [['first', 1], ['iloa', 0], ['tama', 0], ['inner', 0], ['teine', 0]],
      ],
      beats: [{ kind: 'swap', tile: 'first', to: 1 }, { kind: 'en' }],
    }],
  },
  {
    id: '34.3',
    kind: 'fork',
    title: 'Reporting a Command',
    caption: '*ʻIa* fills that same first slot, and what stands after it is what somebody is to do.',
    after: { section: 'reporting-a-command', block: b => b.type === 'p' && b.text.includes('rather than with a tense particle') },
    alt: [
      '*ʻUa iloa e le tama ʻua sau le teine.* The boy knows that the girl has come.',
      '*ʻUa faʻatonu mai e le tama ʻia sau le teine.*',
      'The boy gave the order that the girl should come.',
      'When what is reported is a command, the reported clause opens with the mood particle *ʻia* rather than with a tense particle.',
    ],
    lanes: [{ label: 'after a knowing word' }, { label: 'after an ordering word' }],
    scenes: [{
      key: 'command',
      cases: [
        {
          lane: 0,
          say: 'ʻUa iloa e le tama ʻua sau le teine.',
          en: 'The boy knows that the girl has come.',
          row: [
            face('ʻUa', 'tense', ''),
            { ...face('iloa', 'verb', 'knowing word'), ring: true },
            face('e le tama', 'quiet'),
            { slot: true, form: face('ʻua', 'tense', 'tense particle') },
            face('sau le teine', 'quiet'),
          ],
        },
        {
          lane: 1,
          say: 'ʻUa faʻatonu mai e le tama ʻia sau le teine.',
          en: 'The boy gave the order that the girl should come.',
          row: [
            face('ʻUa', 'tense', ''),
            { ...face('faʻatonu mai', 'verb', 'ordering word'), ring: true },
            face('e le tama', 'quiet'),
            { slot: true, form: face('ʻia', 'tense', 'mood particle') },
            face('sau le teine', 'quiet'),
          ],
        },
      ],
    }],
  },
  {
    id: '34.4',
    kind: 'fork',
    ownSlots: true,
    title: 'The Say-Verb *Fai*',
    caption: 'That sentence may be quoted word for word, as in the first example, or reported in your own words, as in the second.',
    after: { section: 'the-say-verb-fai', block: b => b.type === 'p' && b.text.includes('reported in your own') },
    alt: [
      '*Fai atu le tamāloa: "ʻOleʻā ʻe faʻatali."* The man said: "You will wait." (Lit. "Say away the man: \'You will wait.\'")',
      '*Na fai atu le teine ʻi le tama e ʻavatu le tusi.* The girl told the boy to give the book. (Lit. "The girl said to the boy that the book be given.")',
      'That sentence may be quoted word for word, as in the first example, or reported in your own words, as in the second.',
    ],
    lanes: [{ label: 'quoted word for word' }, { label: 'reported in your own words' }],
    scenes: [{
      key: 'fai',
      cases: [
        {
          lane: 0,
          say: 'Fai atu le tamāloa: "ʻOleʻā ʻe faʻatali."',
          en: 'The man said: "You will wait."',
          row: [
            face('Fai atu', 'verb', 'say-verb'),
            face('le tamāloa:', 'noun', 'the person who spoke'),
            { slot: true, form: face('"ʻOleʻā ʻe faʻatali."', 'quiet', 'what was said') },
          ],
        },
        {
          lane: 1,
          say: 'Na fai atu le teine ʻi le tama e ʻavatu le tusi.',
          en: 'The girl told the boy to give the book.',
          row: [
            face('Na', 'tense', ''),
            face('fai atu', 'verb', 'say-verb'),
            face('le teine', 'noun', 'the person who spoke'),
            face('ʻi le tama', 'quiet'),
            { slot: true, form: face('e ʻavatu le tusi', 'quiet', 'what was said') },
          ],
        },
      ],
    }],
  },
]
