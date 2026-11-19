# Learn Samoan website

The Samoan course as a website, built the way the Tongan site at leafakatonga.org is built. The code is a fork of the live Tongan premium site (`Lea-Faka-Tonga/lea-faka-tonga-app`, `src/premium/` and the modules it imports), recoloured in the Samoan book's blue and fed the Samoan course files. React, Vite, `BrowserRouter`, static hosting.

## Pages

| Route | Page |
|---|---|
| `/` | Home: hero, Chapter 1 sentence builder, quiz and card preview, learning path |
| `/chapters` | All 52 chapters, searchable, by band |
| `/chapters/:n` | A chapter: reading, interactive exercises, Words to Learn table and cards, finish |
| `/quizzes`, `/quizzes/:n` | The 52 ten-question quizzes |
| `/cards` | Flip cards: by chapter, by list, by band |
| `/dictionary` | The words the course teaches, searchable in Samoan or English, with the glossary's own letter groups (search and letter live in the address fragment, `#q=`, `#letter=`) |
| `/dictionary/<slug>` | One page per word spelling: each entry with its printed meaning, the chapter that teaches it and up to three printed sentences |
| `/dictionary/english/<slug>` | "How to say X in Samoan": every word whose meaning holds that English word |
| `/glossary` | Sends the visitor to `/dictionary`; its built file is noindex with a canonical to `/dictionary` and it is not in the sitemap |
| `/reference` | Hub for the Introduction and the appendices |
| `/introduction`, `/pronunciation`, `/charts` | The Introduction, Pronunciation Guide and Reference Charts |

## Where the content comes from

`npm run sync` reads the course in the parent vault and writes the website's copy. It never writes to the course.

| Course file | Website copy |
|---|---|
| `../book/Chapter-NN.md`, `Introduction.md`, `appendix-*.md` | `book/` (learner copy) |
| the same chapters | `src/data/chapters.json`, `book-vocabulary.json`, `book-exercises.json`, `quick-practice.json` |
| `../book/appendix-glossary.md` | `src/data/glossary.json` |
| `book/Chapter-NN.md` (the website's copy) | `src/premium/data/dictionary-examples.json` (`npm run build:dictionary-data`, run by `npm run sync` after the course sync) |
| `../quizzes/samoan_grammar_quiz_chNN.md` | `src/data/quizzes.json` |

The learner copy removes HTML comments and each "Author Verification Required (removed at publication)" block, the same cut `filters/strip-verification.lua` makes for the PDF and EPUB. Nothing else changes: no spelling, diacritic or punctuation normalisation. Every Samoan string on the site is a substring of a course file.

Exercises: every item carries its own answer-key entry. Six exercises are tap-to-choose, used only where the book's instruction names the choices and exactly one choice turns the prompt into the printed answer. Lettered matching exercises are tap-to-match against the book's key. Everything else is reveal-the-answer with a self-check, as on the Tongan site. Lines the book prints as given (the other speaker in a conversation) are shown, not asked.

The sync fails loudly on anything it cannot place: a quiz without four options and one key, an answer with no question, a Words to Learn table it cannot name.

`npm run sync:check` reports whether the saved copy matches the current course without writing anything.

## Checks

```sh
npm ci
npm run sync:check   # needs the parent vault
npm run lint
npm test             # data guards; runs without the parent vault
npm run build
npm run check:dictionary   # reads the built dist/
npm run gates        # the ship gates: lint, test, check:interactives, check:bloom, check:figures
```

`npm run check:figures [-- N]` holds every string on a chapter's moving figures (`src/premium/figures/NN.js`) word for word to that chapter's `book/Chapter-NN.md`, and checks their joins, beats, roles, anchors and `REPLACES` ids. It runs in `npm run gates` and deliberately never in `build` or `prebuild` (`test/gates.test.js` holds that), so a later book repair can fail it and be fixed but can never fail a deploy. A book repair may need a figure repair; this check names which. The authoring card is `spec/Chapter-Figures-Method.md` in the course vault.

A test build (`npx vite --port 4191`, or `LS_TEST_BUILD=1 npm run build`) adds the capture flags (`?still`, `?solo=N.K`), the `/__proto/chapter/N` route and the `/scrub` figure scrubber. A production build leaves them out of the bundle.

`npm run check:dictionary` runs over the built `dist/` after `npm run build` and the deploy runs it too. It fails when any count is zero, a glossary entry is on no page or on two, two indexable pages share a title, a dictionary page lacks exactly one canonical or one `<h1>`, its structured data does not parse or holds the wrong number of DefinedTerm nodes, its title or description differs from what `src/seo/meta.js` returns, it holds U+2014 or "Page not found", a dictionary address is missing from the sitemap, or a `lang="sm"` string is not found in the course data or `book/*.md`. It prints the counts of rows, word pages and English pages and how many senses each English rule dropped. `npm run build:dictionary-data -- --check` writes nothing and fails when `dictionary-examples.json` is stale; `npm test` fails on a stale file too.

## Local preview

```sh
npm run build && npx vite preview --port 4190
```

then open http://127.0.0.1:4190/

## Publishing

`.github/workflows/deploy.yml` deploys to GitHub Pages on a push to `main`, as the Tongan site does. It builds with `VITE_BASE=/<repo name>/` for a project site; set it to `/` for a custom domain. `vite.config.js` writes the matching `404.html` so deep links survive a page refresh.

This folder is its own git repository, `joakimandrew-cloud/learn-samoan-website`, published at https://learnsamoan.org (GitHub Pages, custom domain). After a course change, run `npm run sync`, `npm test` and `npm run lint`, commit here and push to deploy.

## What differs from the Tongan site, and why

- Drills are the course's own practice, not Tongan decks: `/drills` lists the 55 chapter practice items (the same `src/data/interactives/NN.json` items the chapters show) plus Daily words, and `/drill/<id>` plays one. The groups are in `src/premium/data/drills-catalog.json`; every card and page is derived at run time from the item, so no Samoan is typed into a new file. `scripts/check-interactives.mjs` (run by `prebuild` and `npm test`) fails the build if the catalogue or the Daily words deck (rows of `book-vocabulary.json`) shows Samoan the course does not print. No tense machine, sentence builder or terminal build: they would compose Samoan.
- The dictionary is the course's own glossary and nothing else: no word from outside the course, and no text of any published dictionary. Words that fold to one address (`tama` and `tamā`) share a page as separate entries under their own marked headwords; a bound form (`=a`) has its own address (`a-form`). English pages are made only from entries in the Vocabulary and Words to carry lists whose meaning holds no colon, with a leading "also" stripped and a sense that opens with "of" dropped. Sentences come from the chapter that teaches the word or a later one, only where the English printed beside the sentence holds the word's sense.
- No topic articles, word lists or membership: they are built from Tongan-only data or are Tongan business pages.
- The homepage uses Andrew's approved Samoan Blue cover with the bolder author name, tactile matte finish and lighter charcoal paper (`public/covers/2026-10-28-charcoal/cover-blue-3d.webp`). The lossless asset preserves the approved mockup's lettering, geometry and transparency. Other site decoration still uses plain squares (`src/premium/components/Tile.jsx`).
- "Chapter", never "Lesson" (Samoan DECISIONS).
- No downloads. One private visit counter, GoatCounter: no cookies, no banner, no personal data kept. Its code lives once, as `GOATCOUNTER_CODE` in `src/seo/meta.js`, and ships empty: while it is empty no counter script is written, and when it is set the `visitCounter` plugin in `vite.config.js` writes the script tag into `index.html`, so every prerendered page carries it. `RouteChrome` counts later page changes through `window.goatcounter`.
- Titles and descriptions for every public route live in `src/seo/meta.js`, read by both `scripts/prerender.mjs` and the app (`RouteChrome` and the `useTitle` calls). The prerender also writes each page's readable text inside `#root` (`scripts/lib/served-text.mjs`; a chapter is served as its heading, two opening paragraphs and its section names, never whole) and one JSON-LD `@graph` (`scripts/lib/jsonld.mjs`), between markers so a second run replaces what the first wrote.

## The games

`/games` lists two games, each played in the browser and each with its own page: `/games/word-balloons` and `/games/sentence-tiles`. Their code is in `src/games/`, their pages are `src/premium/pages/{Games,WordBalloons,SentenceTiles}.jsx`, and their titles and descriptions are rows of `src/seo/meta.js` like every other page's.

- Word Balloons draws on `src/data/book-vocabulary.json`: one card per distinct `samoan` string among the rows of the Vocabulary and Words to carry lists whose headword is one word (no space, comma, `=` or `-`) and whose meaning, cut at the first note and the first list item, is 28 characters or fewer. A card carries every meaning its rows print; a wrong choice never shares a content word with the right answer over the whole printed meanings, notes included, and never folds to the same letters (`tama` and `tamā`). A choice shows the cut meaning; once answered, the card shows the meaning the book prints, in full. The sets are the three bands `/cards` offers, with its labels.
- Sentence Tiles draws on `src/data/book-exercises.json`: the items of the exercises titled "Translate into Sāmoan" whose answer is one `*...*` span of 3 to 8 words, with no bracket, slash or "or", each sentence played once, chapter by chapter, and a game only for a chapter that keeps three sentences or more. It marks against the order the book prints and says so: a tap in another order shows "Not the book's order" with the book's sentence, in no error colour and with no sound, because some Sāmoan sentences can be said in more than one order. An `accept` list on an exercise item, should one appear, adds its orders.

Neither game composes Sāmoan, inflects a word or builds a form: they re-order and re-show what the book prints, and `test/games-*.test.js` holds every word, meaning and sentence to the data files. A third game of the other site, with its dials and word forms, is not built, and none of that site's data files was carried over.
