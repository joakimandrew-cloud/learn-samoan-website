// /alphabet: the Sāmoan letters and how they sound.
//
// Content only. No JSX, no imports, so `node` can load this during the build:
// src/premium/components/ArticlePage.jsx renders it in the app, and
// scripts/lib/served-text.mjs renders the same blocks as static HTML, so a
// crawler that runs no JS reads the whole page.
//
// SOURCES. Every Sāmoan string below is word for word, mark for mark, a string
// printed in book/Introduction.md or book/appendix-pronunciation.md, and every
// English meaning beside one is the book's own. Every statement about Sāmoan
// is one those two files make. test/topic-pages.test.js holds the first of
// these: a changed character fails.
//
// THE COUNT. The book prints no count of the alphabet. The opening sentence,
// "five vowels and thirteen consonants", is the count as a shelf source of the
// course gives it: source-materials/sayit/01-Lesson-01.md, section 1.1, "The
// Samoan alphabet has five vowels and 13 consonants." [sayit p.1]. Hunkin's
// first chapter names the thirteen the same way (the nine, then h, k and r,
// then the glottal stop) [hunkin L1], and book/appendix-pronunciation.md says
// "The careful style has thirteen consonants". No total of letters is stated
// on the page, because no source the page may use prints one.
//
// MARKUP. Inside a string `*…*` marks a Sāmoan word (rendered with lang="sm")
// and `**…**` bold (src/seo/inline.js). Single letters are plain text, as the
// book prints them.

export default {
  path: '/alphabet',
  eyebrow: 'Sounds and spelling',
  h1: 'The Sāmoan alphabet: the letters and how each one sounds',
  chips: ['Five vowels', 'Thirteen consonants', 'The ʻ mark', 'The long-vowel mark'],
  blocks: [
    { k: 'h2', text: 'The letters of the Sāmoan alphabet' },
    {
      k: 'p',
      text:
        'The Sāmoan alphabet has five vowels and thirteen consonants. The vowels are a, e, i, o ' +
        'and u. The consonants are f, g, l, m, n, p, s, t and v, joined by h, k and r, which ' +
        'appear mainly in words borrowed from other languages, and by one more that is written ' +
        'with a mark, ʻ, in place of a letter.',
    },
    {
      k: 'table',
      headers: ['Written', 'Kind', 'To know'],
      rows: [
        ['a, e, i, o and u', 'Vowels', 'Each can be short or long.'],
        ['f, g, l, m, n, p, s, t and v', 'Consonants', 'The g is the ng sound.'],
        ['h, k and r', 'More consonants', 'Mainly in words borrowed from other languages.'],
        ['ʻ', 'One more consonant', 'A catch in the voice, written with a mark.'],
      ],
    },
    {
      k: 'p',
      text:
        'That list is the short answer, and it leaves out most of what a reader needs before ' +
        'saying a word aloud. The g is not the English g, a vowel with a line over it makes a ' +
        'different word, and so does the ʻ mark. Most printed Sāmoan drops both marks, and ' +
        'everyday speech says k where the careful style says t.',
    },

    { k: 'h2', text: 'The vowels' },
    {
      k: 'p',
      text:
        'Sāmoan has five vowels, and each of them can be short or long. They are simple, steady ' +
        'sounds, and a change of vowel alone is enough to make a different word, as in *tā* ' +
        '(strike) and *tū* (stand).',
    },
    {
      k: 'table',
      headers: ['Vowel', 'How it is said'],
      rows: [
        ['a', 'With the mouth open and the tongue low and central.'],
        ['e', 'Between the others, toward i.'],
        ['i', 'With the tongue high and at the front of the mouth, and the lips spread.'],
        ['o', 'Between the others, toward u.'],
        ['u', 'With the tongue high at the back, and the lips rounded.'],
      ],
    },
    {
      k: 'p',
      text:
        'At the end of a word, e and o close up a little, so that a final e drifts toward i and ' +
        'a final o toward u. You can hear it in *tele* (big, many). In Sāmoan a word that ends ' +
        'in e rhymes with one that ends in i, which is why *ate* (liver) and *ati* (to build) ' +
        'sit close together for an English ear.',
    },

    { k: 'h2', text: 'Long vowels and the line over the letter' },
    {
      k: 'p',
      text:
        'Every vowel comes in a short form and a long form. The long form is usually the same ' +
        'sound held longer, and it is written with a line over the letter: ā, ē, ī, ō and ū. ' +
        'The Sāmoan name of that line is the *faʻamamafa*, and the course calls it the ' +
        'long-vowel mark.',
    },
    {
      k: 'p',
      text:
        'Length carries meaning: many pairs of Sāmoan words differ by nothing but vowel length, ' +
        'and they mean different things.',
    },
    {
      k: 'table',
      headers: ['Sāmoan', 'English'],
      rows: [
        ['*tama*', 'child, boy'],
        ['*tamā*', 'father'],
        ['*fulu*', 'wash, clean'],
        ['*fulū*', 'influenza, cold'],
        ['*tala*', 'story'],
        ['*tālā*', 'dollar'],
      ],
    },
    {
      k: 'p',
      text:
        'In the first two pairs one vowel changes, and in the last pair both do. Hold the final ' +
        'a of *tama* short and you have said "child"; hold it long and you have said "father".',
    },

    { k: 'h2', text: 'The consonants' },
    {
      k: 'p',
      text:
        'Sāmoan is written with letters an English reader already knows, and the course calls g ' +
        'the one surprise among them. It is pronounced like the ng in English "song", never ' +
        'like the g in "go", and unlike the English ng it can begin a word. The Pronunciation ' +
        'Guide of the course says more about five of the consonants.',
    },
    {
      k: 'table',
      headers: ['Letter', 'What the guide adds'],
      rows: [
        ['g', 'In the careful style the ng sound seems most often to be made a little further forward in the mouth than the English ng of "song".'],
        ['t', 'Usually said with the flat of the tongue against the ridge behind the upper teeth. Before an i, many speakers today say it close to ts.'],
        ['h', 'It comes only at the start of a word, in borrowed words and a handful of exclamations.'],
        ['k', 'In the careful style it belongs mainly to borrowed words, most of them from English.'],
        ['r', 'It belongs only to borrowed words, and even in careful speech it is often said as l.'],
      ],
    },
    {
      k: 'p',
      text:
        'An English r usually becomes l when a word is borrowed, as in *leitio* (radio). The ' +
        'one old Sāmoan word regularly heard with an r is *talo* (taro), and both an l and an r ' +
        'are acceptable there.',
    },

    { k: 'h2', text: 'The ʻ mark is a consonant' },
    {
      k: 'p',
      text:
        'The ʻ is written as a turned comma, and its Sāmoan name, the *koma liliu*, says the ' +
        'same. It marks a catch in the voice, the break in the middle of English "uh-oh", and ' +
        'it counts as a full consonant, exactly as real as an f or a t. Compare *ava* (passage ' +
        'in the reef) with *ʻava* (beard): the only difference is that catch at the front.',
    },
    {
      k: 'p',
      text:
        'In running speech the catch is unsteady. At the start of a word it is often lost, ' +
        'except in very careful speech, and a vowel at the start of a word that is said with ' +
        'emphasis can pick up a catch where none is written. None of that changes what a ' +
        'learner does, which is to learn every word with its ʻ and say the catch every time.',
    },

    { k: 'h2', text: 'Where the stress falls' },
    {
      k: 'p',
      text:
        'In most Sāmoan words the stress lands on the next-to-last syllable. Most of the time a ' +
        'syllable is one vowel, so counting back two vowels finds it. When the last vowel of a ' +
        'word is long, it draws the stress to itself.',
    },
    {
      k: 'table',
      headers: ['Sāmoan', 'English', 'The stress falls on'],
      rows: [
        ['*tama*', 'boy', 'the first a'],
        ['*taeao*', 'morning', 'the second a: each of the four vowels is a syllable'],
        ['*tamā*', 'father', 'the final ā, because it is long'],
        ['*maile*', 'dog', 'the ai, said together as one syllable'],
        ['*falaoa*', 'bread', 'the la, one syllable further back than the habit predicts'],
      ],
    },
    {
      k: 'p',
      text:
        'The course asks you to read these as habits and not as laws. A few pairs of vowels are ' +
        'said as one syllable when they stand in that next-to-last place, as the ai of *maile* ' +
        'is, and some word endings pull the stress to a place of their own. So take each new ' +
        'word slowly and find its stress by ear.',
    },

    { k: 'h2', text: 'The same letters, printed without the marks' },
    {
      k: 'p',
      text:
        'Most of the Sāmoan a learner will meet, in newspapers and in most books by Sāmoan ' +
        'authors, is printed without either mark, so the same bare letters can hide several ' +
        'words. The bare letters m, a, l, o may be *malō* (hard, firm) or *mālō* (to win, a ' +
        'victory, or the government). Sāmoan readers meet this every day and resolve it from ' +
        'context, the way an English reader takes the word "lead" without noticing that it ' +
        'could be a metal or a verb. The course prints both marks on every word, so you always ' +
        'know which word you are learning.',
    },

    { k: 'h2', text: 'In everyday speech, t becomes k' },
    {
      k: 'p',
      text:
        'Everything above describes the careful style, which is the one the course teaches. The ' +
        'careful style has thirteen consonants and the everyday style has ten, because three ' +
        'pairs of sounds merge: t and k become k, n and g become g, and r and l become l. So ' +
        '*tōfā* (goodbye) can reach you with a k in place of its t. The course asks you to ' +
        'recognize the everyday style and to speak only the careful one.',
    },

    { k: 'h2', text: 'Say them aloud' },
    {
      k: 'p',
      text:
        'The long vowels, the catch of the ʻ mark and the stress live only in the voice, and ' +
        'the voice learns them only by doing. That is why the course asks you to say every ' +
        'Sāmoan word out loud and not in your head. Its Pronunciation Guide goes further into ' +
        'the vowels, the stress, the ʻ mark and the everyday style.',
    },
    {
      k: 'next',
      items: [
        { to: '/pronunciation', label: 'The Pronunciation Guide, in full' },
        { to: '/introduction', label: 'The Introduction: sounds, spelling and how words work' },
        { to: '/greetings', label: 'Hello, goodbye and thank you in Sāmoan' },
        { to: '/chapters/1', label: 'Chapter 1: The Basic Sentence' },
        { to: '/dictionary', label: 'The dictionary of the words the course teaches' },
      ],
    },
  ],
}
