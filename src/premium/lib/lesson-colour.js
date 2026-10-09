/**
 * Each chapter's tile colour: one blue scale per band, stepping one point of
 * HSL lightness darker per chapter. Same method as the Tongan site's
 * progressive colour, in the Samoan blue (book template: brandblue #1E449C,
 * coverlight #4A72D4, coverdeep #14295E).
 */
export const LESSON_SEQUENCE = ['block', 'ring']

export function lessonTile(n, offset = 0) {
  const i = n - 1 + offset
  return { kind: LESSON_SEQUENCE[i % LESSON_SEQUENCE.length], invert: i % 2 === 0 }
}

const LEVEL_BASE = { beginner: '#4A72D4', intermediate: '#1E449C', advanced: '#14295E' }

function hsl(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  if (!d) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: ((h * 60) + 360) % 360, s: s * 100, l: l * 100 }
}

/** `chapters` in order, `levelOf(chapter)` → 'beginner' | 'intermediate' | 'advanced'. */
export function lessonColours(chapters, levelOf) {
  const byLevel = {}
  for (const c of chapters) (byLevel[levelOf(c)] ||= []).push(c.chapter)
  const out = {}
  for (const [lvl, list] of Object.entries(byLevel)) {
    const base = hsl(LEVEL_BASE[lvl] || LEVEL_BASE.beginner)
    const step = Math.min(1, 12 / Math.max(1, list.length))
    list.forEach((n, i) => {
      const l = base.l + ((list.length - 1) / 2 - i) * step
      out[n] = `hsl(${base.h.toFixed(3)} ${base.s.toFixed(3)}% ${l.toFixed(3)}%)`
    })
  }
  return out
}
