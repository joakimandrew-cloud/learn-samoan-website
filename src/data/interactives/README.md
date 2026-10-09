# Chapter interactives

Each chapter page can carry figures (they illustrate a point) and practice
(the learner answers). They live here, one file per chapter: `NN.json`
(`01.json` to `51.json`). The chapter page places each one after a heading of
the chapter, numbers the figures (Figure 7.1, 7.2...) and wraps practice in
the "Interactive practice" band, the same frames the Tongan site uses.

## The honesty contract

No fabricated Samoan, ever (DECISIONS, the iron rule; composed output never
enters app content, 2026-08-27 rulings 6 and 7; printed spellings are kept,
2026-09-18). So:

- Every Samoan string is printed in the book: in this chapter's learner copy
  (`book/Chapter-NN.md`) or an earlier chapter's, matched at word edges.
- Every English line paired with a Samoan string is printed right beside that
  Samoan (a table row, an example line, a gloss in brackets), so it is the
  chapter's own translation of it.
- A fill-the-blank prompt completed with its answer is a printed sentence.
  A word-order target is a printed sentence cut into its own words.
- Samoan inside free English (titles, captions, notes, why-lines) is written
  in `*italics*`, and each italic span is printed too.
- Site copy has no em dash, no level codes, and says "chapter", never "lesson".

`npm run check:interactives` (or `node scripts/check-interactives.mjs 7` for
one chapter) checks all of that mechanically, and `npm test` fails when it
fails. The gate cannot judge meaning: whether an explanation is faithful,
whether a distractor is truly wrong, whether a figure teaches the point. That
is the author's job, and the reviewer's.

Never edit a Samoan string to make the gate pass. Pick a different printed
sentence.

## File shape

```json
{
  "chapter": 7,
  "items": [
    { "id": "ch7-...", "kind": "anatomy", "anchor": "naming-without-a-verb", "place": "lead",
      "title": "...", "caption": "...", "intro": "...", "data": { } }
  ]
}
```

- `id`: unique in the file, `chN-` plus a short slug.
- `anchor`: the slug of a `##` or `###` heading in the chapter's teaching part
  (lowercase, macrons and ʻ folded away, spaces to hyphens: "The Past Particle
  *Sā*" is `the-past-particle-sa`). The gate lists the valid slugs when one is
  wrong. Never `exercises` or `answers`.
- `place`: `"end"` (default) puts the item at the end of the heading's whole
  section, after its subsections; `"lead"` puts it at the end of the heading's
  own text, before its first subheading. For a `###` heading they are the same.
  Items with the same anchor and place appear in file order.
- `title`: short, sentence case, a claim or a task ("Only the tune changes",
  "Put the three parts in order").
- `caption` (figures): one or two sentences under the figure saying what to
  notice, in the chapter's own terms.
- `intro` (practice): one line on what to do.

## The kinds

Figures: `anatomy`, `builder`, `contrast`, `grid`, `scale`, `dialogue`.
Practice: `pick`, `order`, `match`, `sort`, `type`. The exact data shapes are
in `scripts/check-interactives.mjs`; each kind has a worked example in
`src/premium/components/interactive/fixtures/<kind>.json`, and `01.json` is a
complete chapter.

| Kind | Use it when the chapter... | Data |
|---|---|---|
| `anatomy` | introduces a sentence pattern whose parts have jobs | `sentence {sm, en}`, `parts [{sm, gloss, role, note}]` (parts joined with spaces spell the sentence) |
| `builder` | prints a substitution table: the same frame with one or two slots changing | `slots [{key, label, options [{id, sm, en}]}]`, `sentences [{pick, sm, en}]` (only printed sentences) |
| `contrast` | sets printed forms side by side: statement and question, singular and plural, with and without a particle, a base word and its derived form | `mode toggle/steps`, `states [{label, sm?, en, tune?, note?}]` |
| `grid` | prints a paradigm: pronouns by person and number, demonstratives by distance, possessive forms | `cols`, `rows [{label, cells [{sm, en?, note?, example?} or null]}]`, `quiz` |
| `scale` | orders forms on a line (time, distance, degree) or places them in space (directions, positions) | `layout line/map`, `axis {from, to}`, `points [{x, y?, label, gloss, sm?, en?, note?}]` |
| `dialogue` | prints a conversation or a greeting and its reply | `speakers`, `lines [{who, sm, en}]` |
| `pick` | teaches a closed set to choose from (particles, articles, pronouns, question words) in printed sentences, or when recognising which printed sentence says an English one is the skill | `question`, `options`, `prompts [{sm with ___ or en, answer, why}]` |
| `order` | fixes a word order the learner must produce | `items [{en, sm, extra?, accept?, why}]` |
| `match` | has a vocabulary or phrase table worth recalling both ways | `pairs [{sm, en}]` |
| `sort` | classifies printed items one by one (a-class and o-class, everyday and respect words) | `bins`, `items [{sm, en, bin, why}]` |
| `type` | has a handful of key words whose spelling (macrons, the glottal stop) matters | `items [{en, sm, accept?, why?}]` |

## Authoring rules

1. **Read the whole chapter first**, including its exercises and answers.
   Interactives add to the printed exercises; they never copy one item for
   item.
2. **Three to five items per teaching chapter**, at least one figure and at
   least one practice; two or three for a words chapter or a checkpoint; never
   more than six. Spread them through the chapter, each after the section it
   serves. At most two at the same spot (a figure followed by its practice is
   the good pair: see it, then do it).
3. **Fit the kind to the point.** The figure must show the very thing the
   section explains (the slot that moves, the particle that changes, the tune
   that falls). Practice must exercise the section's skill, not trivia.
4. **One right answer.** Every `pick` prompt has exactly one correct option
   for its English under the chapter's rules. Distractors are printed forms
   that are plainly wrong in that place for that English. If the chapter
   allows two, use `acceptAlso` or choose another sentence.
5. **Word order.** Use an `order` sentence only if the chapter gives no other
   order for that English. If it prints an alternative, add it to `accept`.
   Extra tiles must not let the learner build a different correct sentence
   for the same English.
6. **Explanations restate the chapter.** Every why-line, note and caption says
   what the chapter says, in plain words, and nothing it does not. No grammar
   claims from outside the book, no forward references to later chapters'
   material as if taught.
7. **Only what is taught by now.** Strings from this chapter or earlier
   chapters, never later ones.
8. **Glosses** come from the chapter: the gate requires each English to sit
   beside its Samoan in print. When a word's gloss in the Words to Learn table
   differs from the gloss in the prose, either is fine.
9. **Copy.** Short, warm, plain. No em dashes (use a colon, comma or full
   stop), no exclamation marks, no "lesson", no level codes, no "Let's".
   Samoan in captions and why-lines goes in `*italics*`.

## Checking your work

```sh
node scripts/check-interactives.mjs 7      # the gate for one chapter
npx vitest run test/interactives.test.js   # gate plus placement
```

Then open the chapter in the dev server (`npm run dev`, then
`/chapters/7`) and use every item at desktop and phone width.
