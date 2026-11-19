// The visit counter's script tag, written into index.html at build time by the
// transformIndexHtml plugin in vite.config.js (and so into every prerendered page,
// which reads dist/index.html as its template). GoatCounter is private and sets no
// cookie, so there is no banner. Later page changes are counted by RouteChrome.
//
// Pure: it takes the template text and the code and returns the text, so a test can
// call it without a build. An empty code returns the template unchanged.
export function withCounter(html, code) {
  const c = String(code ?? '').trim()
  if (!c) return html
  if (!/^[a-z0-9-]+$/.test(c)) throw new Error(`GOATCOUNTER_CODE "${c}" is not a GoatCounter site code`)
  const tag = `<script data-goatcounter="https://${c}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
  return html.replace(/^([ \t]*)<\/head>/m, (close, indent) => `${indent}  ${tag}\n${close}`)
}
