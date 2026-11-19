// The visit counter's script tag (Build-Spec part d). The function takes the template
// text and a code, so this reads no dist/ (the deploy runs the tests before the build).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GOATCOUNTER_CODE } from '../src/seo/meta.js'
import { withCounter } from '../src/seo/counter.js'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = fs.readFileSync(path.join(APP, 'index.html'), 'utf8')

describe('seo counter', () => {
  it('returns the template unchanged for an empty code', () => {
    expect(withCounter(template, '')).toBe(template)
    expect(withCounter(template, '  ')).toBe(template)
    expect(withCounter(template, undefined)).toBe(template)
  })

  it('is absent while the shipped code is empty', () => {
    expect(GOATCOUNTER_CODE).toBe('')
    expect(withCounter(template, GOATCOUNTER_CODE)).not.toMatch(/goatcounter/i)
    expect(template).not.toMatch(/goatcounter/i)
  })

  it('writes exactly one script tag naming the code otherwise', () => {
    const out = withCounter(template, 'learnsamoan')
    expect(out.match(/<script[^>]*data-goatcounter/g)).toHaveLength(1)
    expect(out).toContain('data-goatcounter="https://learnsamoan.goatcounter.com/count"')
    expect(out).toContain('src="https://gc.zgo.at/count.js"')
    expect(out.indexOf('data-goatcounter')).toBeLessThan(out.indexOf('</head>'))
    expect(out.replace(/ {4}<script data-goatcounter[^\n]*\n {2}<\/head>/, '  </head>')).toBe(template)
  })

  it('refuses a code that is not a GoatCounter site code', () => {
    expect(() => withCounter(template, 'a"><script>alert(1)</script>')).toThrow(/not a GoatCounter site code/)
  })
})
