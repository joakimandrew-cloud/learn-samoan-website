// A small markdown-to-HTML serializer for the text the prerender serves inside
// #root. It reads the parse tree the app already builds (unified, remark-parse,
// remark-gfm, remark-directive) and throws on a node type it does not know, so a
// new kind of markup in a book file stops the build instead of being dropped.
//
// Italic spans that hold Sāmoan (the book's convention: italics are Sāmoan) get
// lang="sm", decided by the site's own looksSamoan. No rehype package is used.
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import { looksSamoan } from '../../src/lib/okinafy.js'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)

export const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

// The book writes an example block as `::: {.examples}`; remark-directive reads `:::examples`.
const normalise = md => md.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')

const text = node => (node.type === 'text' || node.type === 'inlineCode') ? node.value : (node.children || []).map(text).join('')

function inline(node) {
  switch (node.type) {
    case 'text': return esc(node.value)
    case 'emphasis': {
      const inner = node.children.map(inline).join('')
      return looksSamoan(text(node)) ? `<em lang="sm">${inner}</em>` : `<em>${inner}</em>`
    }
    case 'strong': return `<strong>${node.children.map(inline).join('')}</strong>`
    case 'delete': return `<del>${node.children.map(inline).join('')}</del>`
    case 'inlineCode': return `<code>${esc(node.value)}</code>`
    case 'break': return '<br />'
    case 'link': return `<a href="${esc(node.url)}">${node.children.map(inline).join('')}</a>`
    // remark-directive reads the minutes of a time such as 8:15 as a text directive.
    case 'textDirective': return `:${esc(node.name)}${node.children.map(inline).join('')}`
    default: throw new Error(`book-html: no serializer for inline node "${node.type}"`)
  }
}

const cellAlign = a => (a === 'left' || a === 'right' || a === 'center' ? ` style="text-align:${a}"` : '')

function block(node) {
  switch (node.type) {
    case 'heading': {
      // A trailing {.unnumbered} attribute block is Pandoc syntax, not words.
      const inner = node.children.map(inline).join('').replace(/\s*\{[^}]*\}\s*$/, '')
      return `<h${node.depth + 1}>${inner}</h${node.depth + 1}>`
    }
    case 'paragraph': return `<p>${node.children.map(inline).join('')}</p>`
    case 'thematicBreak': return '<hr />'
    case 'blockquote': return `<blockquote>${node.children.map(block).join('')}</blockquote>`
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul'
      return `<${tag}>${node.children.map(block).join('')}</${tag}>`
    }
    case 'listItem': return `<li>${node.children.map(c => (c.type === 'paragraph' ? c.children.map(inline).join('') : block(c))).join('')}</li>`
    case 'table': {
      const [head, ...rows] = node.children
      const cells = (row, tag) => row.children.map((c, i) => `<${tag}${cellAlign(node.align?.[i])}>${c.children.map(inline).join('')}</${tag}>`).join('')
      return `<table><thead><tr>${cells(head, 'th')}</tr></thead><tbody>${rows.map(r => `<tr>${cells(r, 'td')}</tr>`).join('')}</tbody></table>`
    }
    case 'containerDirective':
      if (node.name !== 'examples') throw new Error(`book-html: no serializer for directive "${node.name}"`)
      return `<div class="examples">${node.children.map(block).join('')}</div>`
    default: throw new Error(`book-html: no serializer for block node "${node.type}"`)
  }
}

/** A whole markdown file as an HTML fragment. The first heading is `<h2>`; the caller supplies the page `<h1>`. */
export function markdownToHtml(md) {
  return parser.parse(normalise(md)).children.map(block).join('\n')
}

/** The text of a markdown file's first level-1 heading, without attribute blocks or markup. */
export function firstHeading(md) {
  const tree = parser.parse(normalise(md))
  const h = tree.children.find(n => n.type === 'heading' && n.depth === 1)
  return h ? text(h).replace(/\s*\{[^}]*\}\s*$/, '').trim() : ''
}

/** One line of inline markdown (a title, a paragraph) as an HTML fragment. */
export function inlineMarkdownToHtml(md) {
  const tree = parser.parse(normalise(String(md)))
  return tree.children.map(n => (n.type === 'paragraph' ? n.children.map(inline).join('') : block(n))).join(' ')
}

/** The opening paragraphs of a chapter file: running prose before the first rule or `##` heading, at most `count`, none under 60 characters. */
export function introParagraphs(md, count = 2) {
  const kept = []
  let inDiv = false
  let inFence = false
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```')) { inFence = !inFence; continue }
    if (inFence) continue
    // An opening fence carries an attribute block; a bare ::: closes one.
    if (line.startsWith(':::')) { inDiv = line.length > 3; continue }
    if (inDiv) continue
    if (line.startsWith('---') || line.startsWith('##')) break
    if (line.startsWith('#') || line.startsWith('|') || line.startsWith('<!--')) { kept.push(''); continue }
    kept.push(raw)
  }
  const out = []
  for (const blockText of kept.join('\n').split(/\n\s*\n/)) {
    const b = blockText.trim().replace(/\n/g, ' ')
    if (b.length < 60) continue
    if (b.startsWith('*') && b.endsWith('*')) continue
    out.push(b)
    if (out.length >= count) break
  }
  return out
}
