export function conciseQuizExplanation(text) {
  return String(text ?? '').replace(/^Correct(?:\s+(?:on|in)\b[^:]*:|[:,])\s*/i, '')
}
