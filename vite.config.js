import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(root, 'src')
// '/' for a custom domain; '/<repo>/' for a GitHub Pages project site.
const base = process.env.VITE_BASE || '/'

// GitHub Pages serves 404.html for any unknown path. This bounces the visitor
// back to index.html with the route in the query string, and index.html puts
// it back (the same Single Page Apps for GitHub Pages trick the Tongan site uses).
function spaFallback() {
  const keep = base.split('/').filter(Boolean).length
  return {
    name: 'spa-404',
    closeBundle() {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Learn Samoan</title>
  <script>
    var pathSegmentsToKeep = ${keep};
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body></body>
</html>
`
      const out = path.join(root, 'dist', '404.html')
      if (fs.existsSync(path.dirname(out))) fs.writeFileSync(out, html)
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  resolve: { alias: { '@app': src, '@book': path.join(root, 'book') } },
  server: { host: '127.0.0.1' },
  test: { exclude: ['**/node_modules/**', '**/dist/**'] },
})
