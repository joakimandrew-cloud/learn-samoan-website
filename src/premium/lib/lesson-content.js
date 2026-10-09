import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)
// Recognise the inherited book delimiter; this character is not UI copy.
const SOURCE_EM_DASH = '\u2014'

function textOf(node) {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  return (node.children || []).map(textOf).join('')
}

function inlineMarkdown(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value
  if (node.type === 'emphasis') return `*${node.children.map(inlineMarkdown).join('')}*`
  if (node.type === 'strong') return `**${node.children.map(inlineMarkdown).join('')}**`
  if (node.type === 'delete') return `~~${node.children.map(inlineMarkdown).join('')}~~`
  if (node.type === 'inlineCode') return `\`${node.value}\``
  if (node.type === 'link') return `[${node.children.map(inlineMarkdown).join('')}](${node.url})`
  // remark-directive reads the minute portion of bare times such as 8:15 as
  // a text directive. Reconstruct the literal source text for display.
  if (node.type === 'textDirective') return `:${node.name}${(node.children || []).map(inlineMarkdown).join('')}`
  if (node.type === 'break') return '\n'
  if (node.type === 'html') return node.value
  return (node.children || []).map(inlineMarkdown).join('')
}

function childrenMarkdown(node) {
  return (node.children || []).map(inlineMarkdown).join('')
}

function isBlankText(node) {
  return node.type === 'text' && /^\s*$/.test(node.value)
}

// Match production remark-examples: only soft newlines inside text nodes split
// a Markdown paragraph. Hard breaks remain inline content.
function splitParagraphOnNewlines(paragraph) {
  const children = paragraph.children || []
  if (!children.some(child => child.type === 'text' && child.value.includes('\n'))) return [paragraph]

  const groups = [[]]
  for (const child of children) {
    if (child.type !== 'text' || !child.value.includes('\n')) {
      groups.at(-1).push(child)
      continue
    }
    const parts = child.value.split('\n')
    parts.forEach((part, index) => {
      if (part) groups.at(-1).push({ ...child, value: part })
      if (index < parts.length - 1) groups.push([])
    })
  }
  return groups.filter(group => group.length).map(children => ({ ...paragraph, children }))
}

function stripLeadingWhitespace(nodes) {
  const out = [...nodes]
  while (out.length) {
    const first = out[0]
    if (first.type !== 'text') break
    const trimmed = first.value.replace(/^\s+/, '')
    if (!trimmed) {
      out.shift()
      continue
    }
    if (trimmed !== first.value) out[0] = { ...first, value: trimmed }
    break
  }
  return out
}

function trimEdges(nodes) {
  const out = stripLeadingWhitespace(nodes)
  while (out.length && out.at(-1).type === 'text') {
    const trimmed = out.at(-1).value.trimEnd()
    if (!trimmed) out.pop()
    else {
      if (trimmed !== out.at(-1).value) out[out.length - 1] = { ...out.at(-1), value: trimmed }
      break
    }
  }
  return out
}

const nodesMarkdown = nodes => nodes.map(inlineMarkdown).join('')
const firstTextStart = nodes => nodes[0]?.type === 'text' && nodes[0].value ? nodes[0].value : null

function classifyTrailing(text) {
  if (text.startsWith(SOURCE_EM_DASH)) return 'emdash'
  if (/^[A-Z]/.test(text)) return 'capital'
  if (text.startsWith('(')) return 'paren'
  return null
}

function parenIsAnnotation(text) {
  return text.startsWith('(') && text[1] && !/[A-Z]/.test(text[1])
}

function consumeLeadingArrow(nodes) {
  const first = nodes[0]
  if (first?.type !== 'text') return null
  const match = first.value.match(/^([↗↘])\s*(=\s*)?(.*)$/s)
  if (!match) return null
  const tail = []
  if (match[3]) tail.push({ ...first, value: match[3] })
  tail.push(...nodes.slice(1))
  return { arrow: `${match[1]}${match[2] ? ' =' : ''}`, tail: stripLeadingWhitespace(tail) }
}

// Production only recognises a standalone compact pair when the first
// meaningful inline is emphasis and the translation begins with a capital or
// a non-annotation parenthesis. An intonation arrow stays with the Samoan.
function compactPair(paragraph) {
  const children = paragraph.children || []
  const firstMeaningful = children.findIndex(child => !isBlankText(child))
  if (firstMeaningful < 0 || children[firstMeaningful].type !== 'emphasis') return null

  const emphasis = children[firstMeaningful]
  let tail = stripLeadingWhitespace(children.slice(firstMeaningful + 1))
  if (!tail.length) return null
  let arrow = ''
  const consumed = consumeLeadingArrow(tail)
  if (consumed) {
    arrow = ` ${consumed.arrow}`
    tail = consumed.tail
  }
  if (!tail.length) return null

  const firstText = firstTextStart(tail)
  if (firstText === null) return null
  const kind = classifyTrailing(firstText)
  if (kind !== 'capital' && kind !== 'paren') return null
  if (kind === 'paren' && parenIsAnnotation(firstText)) return null

  return {
    samoan: `${plainInline(nodesMarkdown(emphasis.children || []))}${arrow}`,
    english: nodesMarkdown(tail).trim(),
  }
}

function emDashPair(paragraph) {
  const children = paragraph.children || []
  const splitIndex = children.findIndex(child => child.type === 'text' && child.value.includes(SOURCE_EM_DASH))
  if (splitIndex < 0) return null

  const splitNode = children[splitIndex]
  const dashIndex = splitNode.value.indexOf(SOURCE_EM_DASH)
  const before = splitNode.value.slice(0, dashIndex)
  const after = splitNode.value.slice(dashIndex + 1)
  const samoan = [...children.slice(0, splitIndex)]
  const english = []
  if (before.trim()) samoan.push({ ...splitNode, value: before })
  if (after.trim()) english.push({ ...splitNode, value: after })
  english.push(...children.slice(splitIndex + 1))

  return {
    samoan: plainInline(nodesMarkdown(trimEdges(samoan))),
    english: nodesMarkdown(trimEdges(english)),
  }
}

// The Samoan book hard-wraps its prose, so a soft line break inside a
// paragraph is just a space. A paragraph splits into lines only when every
// line is its own Samoan/English pair.
function joinSoftBreaks(paragraph) {
  return {
    ...paragraph,
    children: (paragraph.children || []).map(child => child.type === 'text' ? { ...child, value: child.value.replace(/[ \t]*\n[ \t]*/g, ' ') } : child),
  }
}

function paragraphBlocks(node) {
  const lines = splitParagraphOnNewlines(node)
  const pairs = lines.map(compactPair)
  if (lines.length > 1 && pairs.every(Boolean)) return pairs.map(pair => ({ type: 'pairs', pairs: [pair] }))
  const whole = joinSoftBreaks(node)
  const pair = lines.length === 1 ? pairs[0] : null
  return [pair ? { type: 'pairs', pairs: [pair] } : { type: 'p', text: childrenMarkdown(whole).trim() }]
}

function examplePair(line) {
  const pair = emDashPair(line) || compactPair(line)
  if (pair) return pair
  return { samoan: null, english: '', line: childrenMarkdown(line).trim() }
}

// Inside an examples block a pair may wrap: a line that does not open with the
// Samoan in italics continues the line above it.
function exampleLines(paragraph) {
  const lines = splitParagraphOnNewlines(paragraph)
  const groups = []
  for (const line of lines) {
    const first = (line.children || []).find(child => !isBlankText(child))
    if (groups.length && first?.type !== 'emphasis') {
      const prev = groups.at(-1)
      groups[groups.length - 1] = { ...prev, children: [...prev.children, { type: 'text', value: ' ' }, ...line.children] }
    } else groups.push(line)
  }
  return groups
}

function listItems(node) {
  return node.children.map(item => {
    const own = item.children.filter(child => child.type !== 'list')
    const nested = item.children.filter(child => child.type === 'list')
    return {
      text: own.map(child => childrenMarkdown(child.type === 'paragraph' ? joinSoftBreaks(child) : child)).join(' ').trim(),
      children: nested.map(list => ({ ordered: Boolean(list.ordered), items: listItems(list) })),
    }
  })
}

function nodeBlock(node) {
  if (node.type === 'paragraph') return paragraphBlocks(node)
  if (node.type === 'thematicBreak') return { type: 'hr' }
  if (node.type === 'containerDirective' && node.name === 'examples') {
    return {
      type: 'examples',
      pairs: node.children
        .filter(child => child.type === 'paragraph')
        .flatMap(exampleLines)
        .map(examplePair),
    }
  }
  if (node.type === 'table') {
    const rows = node.children.map(row => row.children.map(cell => childrenMarkdown(cell).trim()))
    return { type: 'table', head: rows[0] || [], body: rows.slice(1) }
  }
  if (node.type === 'blockquote') {
    const raw = node.children.map(child => childrenMarkdown(joinSoftBreaks(child))).join(' ').replace(/\s*\n\s*/g, ' ').trim()
    const match = raw.match(/^\*{1,2}([^*]+?):\*{1,2}\s*([\s\S]*)$/)
    return { type: 'note', label: match ? match[1] : null, text: match ? match[2] : raw }
  }
  if (node.type === 'list') return { type: 'list', ordered: Boolean(node.ordered), items: listItems(node) }
  return null
}

function normalizeExamples(md) {
  return md.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')
}

// Samoan chapters use "## Section" and "### Subsection" (the Samoan book is one
// level deeper). Exercises printed inside a teaching section (the checkpoint
// chapters) and "Can You Do This?" become interactive blocks in place; the
// "## Exercises" section becomes the exercises slot, and "## Answers" ends the
// reading (its entries are already attached to each exercise).
//
// Interactives (src/data/interactives/NN.json) are placed after a heading:
// { id, anchor: '<heading slug>', place: 'lead' | 'end' }. "lead" puts it at
// the end of the heading's own text, before the next heading of any level;
// "end" (the default) at the end of the heading's whole section, after its
// subsections.
export function parseLessonContent(md, {
  chapter = null,
  quickPractices = [],
  exercises = [],
  interactives = [],
  slugify,
} = {}) {
  if (typeof slugify !== 'function') throw new TypeError('parseLessonContent requires the slugify function')
  const tree = parser.parse(normalizeExamples(md.replace(/\r/g, '')))
  const nodes = tree.children
  const titleNode = nodes.find(node => node.type === 'heading' && node.depth === 1)
  const title = titleNode ? childrenMarkdown(titleNode).replace(/^(Chapter|Lesson) \d+:\s*/, '').replace(/\s*\{[^}]*\}\s*$/, '').trim() : ''
  const blocks = []
  const intro = []
  let started = false
  const placed = new Set()
  const quickByLetter = new Map(quickPractices.map(q => [q.letter, q]))
  const exerciseByKey = new Map(exercises.map(ex => [ex.id.replace(/^ch\d+-/, ''), ex]))
  const push = output => (started ? blocks : intro).push(...output)
  // Open headings, innermost last, for placing interactives.
  const open = []
  const shown = new Set()
  const emit = (slug, place) => {
    for (const x of interactives) {
      if (x.anchor !== slug || shown.has(x.id) || (x.place || 'end') !== place) continue
      blocks.push({ type: 'interactive', id: x.id })
      shown.add(x.id)
    }
  }
  const endLead = () => {
    const top = open.at(-1)
    if (top && !top.leadDone) { emit(top.slug, 'lead'); top.leadDone = true }
  }
  const closeTo = depth => {
    endLead()
    while (open.length && open.at(-1).depth >= depth) {
      const heading = open.pop()
      if (!heading.leadDone) emit(heading.slug, 'lead')
      emit(heading.slug, 'end')
    }
  }
  const skipBody = (index, depth) => {
    // Advance past the body of a heading until the next heading at this depth
    // or higher (or a thematic break), returning the last consumed index.
    while (index + 1 < nodes.length) {
      const next = nodes[index + 1]
      if (next.type === 'heading' && next.depth <= depth) break
      if (next.type === 'thematicBreak') break
      index += 1
    }
    return index
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node.type === 'heading' && node.depth === 1) continue
    const text = node.type === 'heading' ? textOf(node).trim() : ''
    if (node.type === 'heading' && node.depth === 2 && /^(Exercises|Answers)$/i.test(text)) {
      closeTo(0)
      blocks.push({ type: 'exercises-slot' })
      break
    }
    if (node.type === 'heading' && node.depth === 2) {
      closeTo(2)
      blocks.push({ type: 'h2', text: childrenMarkdown(node).trim(), id: slugify(text) })
      open.push({ slug: slugify(text), depth: 2, leadDone: false })
      started = true
      if (/^Can You Do This\?$/i.test(text) && exerciseByKey.has('can')) {
        blocks.push({ type: 'exercise', id: exerciseByKey.get('can').id })
        placed.add('can')
        index = skipBody(index, 2)
      }
      continue
    }
    if (node.type === 'heading' && node.depth === 3) {
      const ex = text.match(/^Exercise (\d+)/)
      if (ex && exerciseByKey.has(`ex${ex[1]}`)) {
        endLead()
        blocks.push({ type: 'exercise', id: exerciseByKey.get(`ex${ex[1]}`).id })
        placed.add(`ex${ex[1]}`)
        index = skipBody(index, 3)
        continue
      }
      if (started) closeTo(3)
      push([{ type: 'h3', text: childrenMarkdown(node).trim(), id: slugify(text) }])
      if (started) open.push({ slug: slugify(text), depth: 3, leadDone: false })
      continue
    }
    if (node.type === 'paragraph' && node.children?.[0]?.type === 'strong') {
      const lead = textOf(node.children[0]).trim().match(/^Quick Practice ([A-Z])\.$/)
      const qp = lead && quickByLetter.get(lead[1])
      if (qp) {
        push([{ type: 'quick-practice', id: qp.id }])
        // The printed prompts and the "Answers:" line are what the block shows.
        while (index + 1 < nodes.length && nodes[index + 1].type === 'list') index += 1
        if (nodes[index + 1]?.type === 'paragraph' && /^Answers:/.test(textOf(nodes[index + 1]).trim())) index += 1
        continue
      }
    }
    const parsed = nodeBlock(node)
    if (!parsed) continue
    push(Array.isArray(parsed) ? parsed : [parsed])
  }

  closeTo(0)
  const rest = exercises.filter(ex => !placed.has(ex.id.replace(/^ch\d+-/, '')))
  if (rest.length && !blocks.some(block => block.type === 'exercises-slot')) blocks.push({ type: 'exercises-slot' })
  if (!rest.length) {
    const slot = blocks.findIndex(block => block.type === 'exercises-slot')
    if (slot >= 0) blocks.splice(slot, 1)
  }

  const unplacedInteractives = interactives.filter(x => !shown.has(x.id)).map(x => x.id)
  return { chapter, title, intro, blocks, slotExercises: rest, inlineCount: placed.size, unplacedInteractives }
}

export function plainInline(text) {
  return String(text ?? '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?span(?:\s+[^>]*)?>/gi, '')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[*_~`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inlineToken(node) {
  const children = (node.children || []).flatMap(inlineToken)
  if (node.type === 'text') return [{ t: 'text', v: node.value }]
  if (node.type === 'strong') return [{ t: 'bold', children }]
  if (node.type === 'emphasis') return [{ t: 'em', children }]
  if (node.type === 'delete') return [{ t: 'del', children }]
  if (node.type === 'inlineCode') return [{ t: 'code', v: node.value }]
  if (node.type === 'link') return [{ t: 'link', href: node.url, children }]
  if (node.type === 'break') return [{ t: 'text', v: '\n' }]
  if (node.type === 'textDirective') return [{ t: 'text', v: `:${node.name}${children.map(token => token.v || '').join('')}` }]
  if (node.type === 'html') return [{ t: 'text', v: node.value }]
  return children
}

export function parseInlineTokens(text) {
  // Sentinels keep leading +, -, >, and # characters in inline content from
  // being interpreted as block Markdown. Remove them after parsing.
  const prefix = 'INLINESTART '
  const suffix = ' INLINEEND'
  const tree = parser.parse(`${prefix}${String(text ?? '')}${suffix}`)
  const tokens = tree.children.flatMap(inlineToken)
  const textTokens = []
  const collect = token => {
    if (typeof token.v === 'string') textTokens.push(token)
    ;(token.children || []).forEach(collect)
  }
  tokens.forEach(collect)
  if (textTokens.length) {
    textTokens[0].v = textTokens[0].v.slice(prefix.length)
    const last = textTokens.at(-1)
    last.v = last.v.slice(0, -suffix.length)
  }
  return tokens
}
