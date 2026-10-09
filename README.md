# Learn Samoan website

The Samoan course as a website, built the way the Tongan site at leafakatonga.org is built. The code is a fork of the live Tongan premium site (`Lea-Faka-Tonga/lea-faka-tonga-app`, `src/premium/` and the modules it imports), recoloured in the Samoan book's blue and fed the Samoan course files. React, Vite, `BrowserRouter`, static hosting.

## Pages

| Route | Page |
|---|---|
| `/` | Home: hero, Chapter 1 sentence builder, quiz and card preview, learning path |
| `/chapters` | All 51 chapters, searchable, by band |
| `/chapters/:n` | A chapter: reading, interactive exercises, Words to Learn table and cards, finish |
| `/quizzes`, `/quizzes/:n` | The 51 ten-question quizzes |
| `/cards` | Flip cards: by chapter, by list, by band |
| `/glossary` | The Glossary appendix, searchable |
| `/reference` | Hub for the Introduction and the appendices |
| `/introduction`, `/pronunciation`, `/charts` | The Introduction, Pronunciation Guide and Reference Charts |

## Where the content comes from

`npm run sync` reads the course in the parent vault and writes the website's copy. It never writes to the course.

| Course file | Website copy |
|---|---|
| `../book/Chapter-NN.md`, `Introduction.md`, `appendix-*.md` | `book/` (learner copy) |
| the same chapters | `src/data/chapters.json`, `book-vocabulary.json`, `book-exercises.json`, `quick-practice.json` |
| `../book/appendix-glossary.md` | `src/data/glossary.json` |
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
```

## Local preview

```sh
npm run build && npx vite preview --port 4190
```

then open http://127.0.0.1:4190/

## Publishing

`.github/workflows/deploy.yml` deploys to GitHub Pages on a push to `main`, as the Tongan site does. It builds with `VITE_BASE=/<repo name>/` for a project site; set it to `/` for a custom domain. `vite.config.js` writes the matching `404.html` so deep links survive a page refresh.

This folder is its own git repository, `joakimandrew-cloud/learn-samoan-website`, published at https://joakimandrew-cloud.github.io/learn-samoan-website/. After a course change, run `npm run sync`, `npm test` and `npm run lint`, commit here and push to deploy.

## What differs from the Tongan site, and why

- No drills, tense machine, topic articles, word lists or membership: they are built from Tongan-only data or are Tongan business pages.
- No kupesi motifs, cover art or logo: Samoan has no approved pattern or logo yet. Plain squares stand in (`src/premium/components/Tile.jsx`), and the hero book is a text-only cover in the course blue, the ruled placeholder identity.
- "Chapter", never "Lesson" (Samoan DECISIONS).
- No analytics and no downloads.
