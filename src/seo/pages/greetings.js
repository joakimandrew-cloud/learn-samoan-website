// /greetings: how Sāmoan says hello, goodbye, thank you and please.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/premium/components/ArticlePage.jsx renders it in the app, and
// scripts/lib/served-text.mjs renders the same blocks as static HTML, so a
// crawler that runs no JS reads the whole page.
//
// SOURCES. Every Sāmoan string below is word for word, mark for mark, a string
// printed in book/Chapter-10.md lines 1 to 202 or in lines 120, 127, 212, 216
// and 220 of book/Chapter-24.md, and every English translation of one is the
// book's own. Every statement about Sāmoan is one those lines make.
// test/topic-pages.test.js holds the first of these: a changed character fails.
//
// NOT ON THIS PAGE. Chapter 10 also teaches the invitation formulas and the
// respect vocabulary; they are named at the foot and left to the chapter. The
// second word a reply can carry beside the greeting is one the book does not
// teach, so it is not given here either.
//
// MARKUP. Inside a string `*…*` marks Sāmoan (rendered with lang="sm") and
// `**…**` bold (src/seo/inline.js). The `sm` side of an example is Sāmoan as
// it stands, with no asterisks.

export default {
  path: '/greetings',
  eyebrow: 'Greetings and courtesy',
  h1: 'Hello in Sāmoan: *Tālofa*, the reply and the goodbyes',
  chips: ['*Tālofa*', '*Tōfā soifua*', '*Faʻafetai*', '*Faʻamolemole*'],
  blocks: [
    { k: 'h2', text: 'How to say hello in Sāmoan' },
    {
      k: 'p',
      text:
        'Hello in Sāmoan is *tālofa*. It is the greeting a learner uses everywhere: it opens an ' +
        'encounter, and the person greeted answers with *tālofa* in return. A lighter, casual hi ' +
        'is *mālō*. To close, *Tōfā soifua* is goodbye, and the words for thank you and please ' +
        'are *faʻafetai* and *faʻamolemole*.',
    },
    {
      k: 'table',
      headers: ['Sāmoan', 'English', 'What it is for'],
      rows: [
        ['*Tālofa.*', 'Hello.', 'Opening an encounter, and answering the greeting.'],
        ['*Tōfā soifua.*', 'Goodbye.', 'Closing an encounter.'],
        ['*Soifua.*', 'Good health. (a farewell)', 'Closing one with a single word.'],
        ['*Faʻafetai.*', 'Thank you.', 'Thanking someone, and also declining.'],
        ['*Faʻamolemole.*', 'Please.', 'Making a polite request.'],
      ],
    },
    {
      k: 'p',
      text:
        'Those five lines are the short answer, and several of them do more than their English ' +
        'suggests. *Tālofa* has a second use that is no greeting at all, *faʻafetai* can also ' +
        'mean "no thank you", and the lines for a new year or for work well done are built on ' +
        'one pattern that the course teaches as grammar. The sections below take them in turn.',
    },

    { k: 'h2', text: 'Hello, and the hello back' },
    {
      k: 'p',
      text: '*Tālofa* opens an encounter, and the person greeted answers with the same word.',
    },
    {
      k: 'ex',
      items: [
        { sm: 'Tālofa.', en: 'Hello.' },
        { sm: 'Tālofa.', en: 'Hello.' },
      ],
    },
    {
      k: 'p',
      text:
        'The reply can also carry a second word alongside *tālofa*. The course does not teach ' +
        'that word, so the answer it gives a learner is *tālofa* on its own.',
    },
    {
      k: 'p',
      text:
        'There is a lighter greeting as well. *Mālō*, the same word that congratulates, also ' +
        'works as a casual "hi", and it comes back further down this page at the head of the ' +
        'congratulations.',
    },

    { k: 'h2', text: 'What *tālofa* means when it is not a greeting' },
    {
      k: 'p',
      text:
        'Said to someone in trouble or in grief, *tālofa* becomes an expression of sympathy, ' +
        'close to the English "I feel for you". The course asks a learner to recognize this ' +
        'second use and not to build it. It belongs to a small family of feeling words whose ' +
        'grammar the book does not teach, so the aim is to know what is meant when *tālofa* is ' +
        'said to you that way.',
    },

    { k: 'h2', text: 'Saying goodbye' },
    {
      k: 'p',
      text:
        'One way to close an encounter is to pair a word for goodbye with a word for good ' +
        'health, which gives *Tōfā soifua*. Either word on its own also closes one, and the ' +
        'chapter prints *Soifua* alone as a farewell, with "Good health" as its English.',
    },
    {
      k: 'ex',
      items: [
        { sm: 'Tōfā soifua.', en: 'Goodbye.' },
        { sm: 'Soifua.', en: 'Good health. (a farewell)' },
      ],
    },

    { k: 'h2', text: 'Asking a name' },
    {
      k: 'p',
      text:
        'A greeting often turns at once to names. Asking a person\'s name, and giving your own, ' +
        'is part of every first meeting, and the question is this one.',
    },
    {
      k: 'ex',
      items: [{ sm: 'ʻO ai lou igoa?', en: 'What is your name? (Lit. "Who is your name?")' }],
    },
    {
      k: 'p',
      text:
        'It is asked with the who-word *ai*, which Chapter 9 teaches, and it carries the word ' +
        'for "your", a possessive form. Possessive forms are taught in Chapter 11, where the ' +
        'question becomes grammar a learner can build. Until then the course says to take it ' +
        'whole, as a set phrase like the greetings.',
    },

    { k: 'h2', text: 'Thank you and please' },
    {
      k: 'p',
      text:
        'The thanks formula is *faʻafetai*, and the please formula, used for a polite request, ' +
        'is *faʻamolemole*.',
    },
    {
      k: 'ex',
      items: [
        { sm: 'Faʻafetai.', en: 'Thank you.' },
        { sm: 'Faʻamolemole.', en: 'Please.' },
      ],
    },
    {
      k: 'p',
      text:
        'Two things about *faʻafetai* do not match its English. Sāmoan speakers say thank you ' +
        'less often than English speakers do, and the chapter is clear that this comes from ' +
        'different conventions and not from any lack of courtesy. The formula also declines, ' +
        'because *faʻafetai* can mean "no thank you".',
    },

    { k: 'h2', text: 'Good wishes and congratulations' },
    {
      k: 'p',
      text:
        'Two verbs head these formulas: *manuia* is the well-wishing one and *mālō* the ' +
        'congratulating one. Each stands first, with no tense particle in front of it, and the ' +
        'noun phrase that follows names what is wished for or congratulated. Change the noun ' +
        'phrase and the wish moves to a new occasion.',
    },
    {
      k: 'table',
      headers: ['Sāmoan', 'English'],
      rows: [
        ['*Manuia le tausaga fou!*', 'Happy New Year!'],
        ['*Manuia le ʻāiga!*', 'Blessings on the family!'],
        ['*Mālō le gālue!*', 'Congratulations on your work!'],
        ['*Mālō le fāgota!*', 'Well done on the fishing!'],
        ['*Mālō le siva!*', 'Well done on the dancing!'],
      ],
    },
    {
      k: 'p',
      text:
        'The literal reading shows the shape: *Mālō le gālue!* is, word for word, "Congratulate ' +
        'the work". The describing verb *mānaia* (nice) fills the same frame to praise a thing ' +
        'outright, and *Mānaia le meaʻai!* is literally "Nice the food!".',
    },
    {
      k: 'table',
      headers: ['Sāmoan', 'English'],
      rows: [
        ['*Mānaia le meaʻai!*', 'The food is nice!'],
        ['*Mānaia le tala!*', 'The story is lovely!'],
        ['*Mānaia le nuʻu!*', 'The village is beautiful!'],
      ],
    },
    {
      k: 'p',
      text:
        'None of these lines has a tense particle. The chapter gives the reason for the praise ' +
        'line, which places no event in time and calls out a quality right now. A command drops ' +
        'the particle in the same way, and commands are where the course first teaches the ' +
        'shape.',
    },

    { k: 'h2', text: 'How the greetings sound in everyday speech' },
    {
      k: 'p',
      text:
        'Sāmoan has two speech styles. The course teaches the careful one, *tautala lelei*, and ' +
        'trains the ear for the everyday one, *tautala leaga*. Where the careful style has t, ' +
        'the everyday style says k; where it has n, the everyday style says the ng sound, which ' +
        'is written g; and where it has r, the everyday style says l. The greetings change with ' +
        'those sounds.',
    },
    {
      k: 'table',
      headers: ['Careful style', 'Everyday style', 'Meaning'],
      rows: [
        ['*tālofa*', '*kālofa*', 'hello'],
        ['*manuia*', '*maguia*', 'fine, blessed'],
        ['*faʻafetai*', '*faʻafekai*', 'thank you'],
      ],
    },
    {
      k: 'note',
      text:
        'The everyday forms are for recognition only, and the course asks you to keep speaking ' +
        'the careful style. The folding runs one way, so the ear can always work back from an ' +
        'everyday form to the careful one, and a *kālofa* called across a road need not leave ' +
        'you lost.',
    },

    { k: 'h2', text: 'The same words, later in the course' },
    {
      k: 'p',
      text:
        'Chapter 24 brings these formulas back in a conversation exercise in which two people ' +
        'meet. It opens and closes with the lines from the top of this page.',
    },
    {
      k: 'table',
      headers: ['Speaker', 'Sāmoan', 'English'],
      rows: [
        ['First speaker', '*Tālofa.*', 'Hello.'],
        ['Second speaker', '*Tālofa.*', 'Hello.'],
        ['First speaker', '*Faʻafetai.*', 'Thank you.'],
        ['Second speaker', '*Tōfā soifua.*', 'Goodbye.'],
      ],
    },
    {
      k: 'p',
      text:
        'In between, the two speakers ask and answer questions, and the exercise has the learner ' +
        'write those lines out as whole Sāmoan sentences.',
    },

    { k: 'h2', text: 'Practice them, then read the chapter' },
    {
      k: 'p',
      text:
        'All but that last section comes from Chapter 10 of the course, Greetings and Courtesy, ' +
        'which also teaches the invitation formulas and the respect vocabulary that this page ' +
        'leaves to it. ' +
        'Two drills from that chapter put the formulas to work.',
    },
    {
      k: 'next',
      items: [
        { to: '/chapters/10', label: 'Chapter 10: Greetings and Courtesy' },
        { to: '/drill/ch10-pick-first-meeting', label: 'Drill: a first meeting, start to finish' },
        { to: '/drill/ch10-match-courtesy', label: 'Drill: match the courtesy formulas' },
        { to: '/chapters/24', label: 'Chapter 24, where the conversation exercise is' },
        { to: '/alphabet', label: 'The Sāmoan alphabet, for saying these words aloud' },
      ],
    },
    { k: 'h3', text: 'These words in the dictionary' },
    {
      k: 'next',
      items: [
        { to: '/dictionary/talofa', label: '*Tālofa*' },
        { to: '/dictionary/tofa', label: '*Tōfā*' },
        { to: '/dictionary/soifua', label: '*Soifua*' },
        { to: '/dictionary/faafetai', label: '*Faʻafetai*' },
        { to: '/dictionary/faamolemole', label: '*Faʻamolemole*' },
        { to: '/dictionary/malo', label: '*Mālō*' },
        { to: '/dictionary/manuia', label: '*Manuia*' },
        { to: '/dictionary/manaia', label: '*Mānaia*' },
      ],
    },
  ],
}
