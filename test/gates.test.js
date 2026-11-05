// check:figures holds every string on a figure to its chapter's book text. It must sit in
// `npm run gates` and never in `build` or `prebuild`, so a later book repair can fail the check
// and be fixed, and can never fail a deploy (plan 2026-11-06-chapter-page-simplify).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'))
const deploy = fs.readFileSync(path.join(APP, '.github', 'workflows', 'deploy.yml'), 'utf8')

describe('the ship gates', () => {
  it('runs lint, test, check:interactives, check:bloom and check:figures', () => {
    for (const step of ['npm run lint', 'npm test', 'npm run check:interactives', 'npm run check:bloom', 'npm run check:figures']) {
      expect(pkg.scripts.gates).toContain(step)
    }
    expect(pkg.scripts['check:figures']).toBe('node scripts/premium/check-figures.mjs')
  })

  it('keeps check:figures out of build and prebuild', () => {
    for (const name of ['build', 'prebuild', 'postbuild']) {
      const script = pkg.scripts[name] || ''
      expect(script).not.toMatch(/check:figures|check-figures|gates/)
    }
  })

  it('leaves the deploy running only npm ci and npm run build', () => {
    expect(deploy).not.toMatch(/check:figures|check-figures|npm run gates/)
  })
})
