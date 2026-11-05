/**
 * The figure shell and its stages: row (Move, Swap, Add and Drop), fork (by a word, a
 * position or a meaning; of forms or of readings), path, build (a word that changes
 * inside itself), and grid (kept so engine fixes port; no new chapter figure uses it).
 * The shell holds the number, title, caption, text alternative and controls; a stage
 * draws one exact frame from (scene, t). Nothing on a stage uses a CSS transition or
 * animation. Copied from the sister course's engine at the commit Build-Notes.md names, with
 * every word, colour and motif of that course taken out
 * (reviews/lesson-simplify-2026-11-06/Build-Notes.md).
 */
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { useFigureClock } from './lib/clock.js'
import { enLineCount, enWidth, textWidth, uiWidth, useTileFont, useWidth } from './lib/metrics.js'
import { land, ramp, travel } from './lib/motion.js'
import { labelBox, rowFrame, rowGeometry, rowLayouts, rowSizes, rowStateAt, rowTimeline } from './row.js'
import { forkFrame, forkGeometry, forkLabelOf, forkLayouts, forkLines, forkSizes, forkTimeline } from './fork.js'
import { gridTimeline } from './grid-timeline.js'
import { pathTimeline } from './path.js'
import { OUTLINE_SKEW, buildFrame, buildGeometry, buildLayout, buildSizes, buildTimeline } from './build.js'
import { PERSON_LABEL, ROLE_LABEL } from './key.js'
import { PathChips, PathStage } from './PathStage.jsx'
import { PersonMark } from './Marks.jsx'
import '../styles/chapter-page.css'

/** Marks Sāmoan in a rich string (*like this*); each piece carries data-samoan for the sweep. */
export function Rich({ text }) {
  return String(text).split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) => (
    part.startsWith('*') && part.endsWith('*')
      ? <span key={i} className="fx-sm" lang="sm" data-samoan={part.slice(1, -1)}>{part.slice(1, -1)}</span>
      : <span key={i}>{part}</span>
  ))
}

export function Label({ role, label }) {
  const text = label ?? ROLE_LABEL[role] ?? null
  return text == null ? null : <Rich text={text} />
}

function TileFace({ face, style }) {
  return (
    <span className={`ft-face role-${face.role}`} style={style}>
      <span className="ft-word" lang="sm" data-samoan={face.text}>{face.text}</span>
    </span>
  )
}

/** One tile in its resting form, for the hero's still row and the limit row. */
export function StaticTile({ face, ring = false, showLabel = true, small = false }) {
  return (
    <span className={`ft-static ${small ? 'is-small' : ''}`}>
      <span className={`ft-static-box role-${face.role} ${ring ? 'has-ring' : ''}`}>
        <span className="ft-word" lang="sm" data-samoan={face.text}>{face.text}</span>
      </span>
      {showLabel && <span className={`ft-label label-${face.role}`}><Label role={face.role} label={face.label} /></span>}
    </span>
  )
}

/* ──────────── Row stage ──────────── */

function beforeWidth(before) {
  const en = before.en ? 8 + uiWidth(before.en, `400 14px 'Inter Variable', Inter, sans-serif`) : 0
  return textWidth(before.say, 17) + en
}

/** The muted starting line: any word whose tile leaves is struck through as it goes (Direction.md part 8). */
function BeforeSay({ say, struck }) {
  const parts = String(say).split(/(\s+)/)
  return parts.map((part, i) => {
    const bare = part.replace(/[.,!?]+$/, '')
    const p = struck.get(bare)
    if (!p) return <span key={i}>{part}</span>
    return <span key={i}><span className="ft-strike" style={{ '--strike': p }}>{bare}</span>{part.slice(bare.length)}</span>
  })
}

/** Every English line a Row scene can show. */
function rowEnglish(scene) {
  return [scene.before?.en, scene.after?.en, ...(scene.lines ?? []).map(line => line.en ?? line.note)].filter(Boolean)
}

function RowStage({ scene, timeline, t, width, def, override, epoch }) {
  // Every measure is taken again once the tile font has loaded (epoch), so no scene wraps on stale widths.
  const sizes = useMemo(() => rowSizes(def, width), [def, width, epoch]) // eslint-disable-line react-hooks/exhaustive-deps
  const layout = useMemo(() => rowLayouts(scene, width, sizes), [scene, width, sizes])
  // On a phone a long sentence takes two lines, in every scene, so the stage never changes height.
  const twoLineBefore = width < 480 && def.scenes.some(item => item.before && item.before.say.length + (item.before.en ?? '').length > 40)
  const lines = useMemo(() => Math.max(...def.scenes.map(item => rowLayouts(item, width, sizes).lines)), [def, width, sizes])
  const reserveBefore = def.scenes.some(item => item.before)
  // A long English line wraps; the stage keeps room for it in every scene, so its height holds.
  const enLines = Math.max(1, ...def.scenes.flatMap(rowEnglish).map(text => enLineCount(text, width)))
  // One height for the figure: the headroom and the English gap of its tallest scene, in every scene.
  const geometry = useMemo(() => rowGeometry(sizes, def.scenes, twoLineBefore, lines, reserveBefore, enLines), [sizes, def, twoLineBefore, lines, reserveBefore, enLines])
  const frame = rowFrame(scene, timeline, t, layout, geometry, override)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  // The sentence lines start at the row's left edge, unless that would run off the stage.
  const left = layout.x0
  const fitting = rowEnglish(scene).map(text => enWidth(text, width)).filter(w => w <= width)
  const enLeft = Math.max(0, Math.min(left, ...fitting.map(w => width - w)))
  const enWraps = Boolean(frame.en?.text) && enWidth(frame.en.text, width) > width
  const beforeLeft = scene.before && !twoLineBefore ? Math.max(0, Math.min(left, width - beforeWidth(scene.before))) : twoLineBefore ? Math.min(left, 8) : left
  return (
    <div className="ft-row" style={vars}>
      {scene.before && (
        <p className={`ft-before ${twoLineBefore ? 'is-two' : ''}`} style={{ opacity: frame.beforeOpacity, left: beforeLeft }}>
          <span className="fx-sm" lang="sm" data-samoan={scene.before.say}><BeforeSay say={scene.before.say} struck={frame.struck} /></span>
          {scene.before.en && <span className="ft-before-en" data-en={scene.before.en}>{scene.before.en}</span>}
        </p>
      )}
      <svg className="ft-over" width={width} height={geometry.height} aria-hidden="true">
        {frame.arc && (
          <>
            <path d={frame.arc.d} className="ft-arc" pathLength="1" strokeDasharray={`${frame.arc.progress} 1`} />
            {frame.arc.arrow && <Arrow arc={frame.arc} />}
          </>
        )}
        {frame.line > 0 && <AbsenceLine frame={frame} geometry={geometry} left={left} />}
      </svg>
      {frame.tiles.map(tile => (
        <RowTile key={tile.id} tile={tile} frame={frame} geometry={geometry} s={s} slotLabel={scene.slotLabel} />
      ))}
      {frame.olds.map(old => (
        <span key={old.text} className="ft-old" lang="sm" data-samoan={old.text} style={{ transform: `translate(${old.x}px, ${old.y}px)`, opacity: old.opacity }}>{old.text}</span>
      ))}
      {frame.marks.map(mark => (
        <span key={mark.n} className={`ft-mark ${mark.onArc ? 'is-on-arc' : ''}`} style={{ transform: `translate(${mark.x}px, ${mark.y}px) translate(-50%, -50%) scale(${mark.scale})` }}>{mark.n}</span>
      ))}
      <p className={`ft-en ${frame.isLine ? 'is-line' : ''} ${enWraps ? 'is-wrap' : ''}`} data-en={frame.en?.text} style={{ left: enWraps ? 0 : enLeft, right: enWraps ? 0 : undefined, top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)` }}>
        <EnglishLine text={frame.en?.text} first={scene.enFirstWord} />
      </p>
    </div>
  )
}

function EnglishLine({ text, first }) {
  if (!text) return null
  if (first && text.startsWith(`${first} `)) return <><span className="ft-en-it">{first}</span>{text.slice(first.length)}</>
  return text
}

function Arrow({ arc }) {
  const len = Math.hypot(arc.tx, arc.ty) || 1
  const ux = arc.tx / len
  const uy = arc.ty / len
  const size = 7
  const wing = 0.5
  const x = arc.endX
  const y = arc.y0
  const ax = x - size * (ux - wing * uy)
  const ay = y - size * (uy + wing * ux)
  const bx = x - size * (ux + wing * uy)
  const by = y - size * (uy - wing * ux)
  return <path d={`M ${ax} ${ay} L ${x} ${y} L ${bx} ${by}`} className="ft-arc ft-arrow" />
}

/** The line from the English subject word that reaches nothing in the Sāmoan row. */
function AbsenceLine({ frame, geometry, left }) {
  const slot = frame.tiles.find(tile => tile.id === 'SLOT')
  if (!slot) return null
  const x0 = left + 7
  const y0 = geometry.enTop + 6
  const x1 = slot.x + slot.w / 2
  const y1 = geometry.rowTop + frame.s.h
  const d = `M ${x0} ${y0} C ${x0} ${y0 - 22}, ${x1} ${y1 + 38}, ${x1} ${y1 + 6}`
  return (
    <>
      <path d={d} className="ft-arc" pathLength="1" strokeDasharray={`${frame.line} 1`} />
      {frame.line > 0.98 && <circle cx={x1} cy={y1 + 3} r="3.25" className="ft-end" />}
    </>
  )
}

/** A tile's label, on two lines where its row fits one line only that way (labelBox). */
function TileLabel({ role, label, s, tileW, style }) {
  const box = labelBox({ role, label }, s, tileW)
  const two = box.lines > 1
  return (
    <span className={`ft-label label-${role} ${two ? 'is-two' : ''}`} style={two ? { ...style, width: Math.ceil(box.width) + 2 } : style}>
      <Label role={role} label={label} />
    </span>
  )
}

function RowTile({ tile, frame, geometry, s, slotLabel = 'no subject' }) {
  const style = {
    width: tile.w,
    top: geometry.rowTop,
    height: s.h,
    transform: `translate3d(${tile.x}px, ${tile.y}px, 0)`,
    opacity: tile.opacity,
    zIndex: tile.z,
  }
  if (tile.id === 'GHOST') return <span className="ft-tile ft-ghost" style={style} />
  if (tile.id === 'SLOT') {
    const w = tile.w
    const h = s.h
    return (
      <span className="ft-tile" style={style}>
        <svg className="ft-slot-line" width={w} height={h} aria-hidden="true">
          {frame.slot > 0 && <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="9.5" pathLength="1" className="ft-slot-rect" strokeDasharray={frame.slot >= 1 ? '0.018 0.012' : `${frame.slot} 1`} />}
        </svg>
        <span className="ft-slot-label" style={{ opacity: ramp(frame.slot, 0.6, 1) }}>{slotLabel}</span>
      </span>
    )
  }
  const rolling = tile.roll > 0 && tile.roll < 1 && tile.faceA !== tile.faceB
  const finalFace = tile.roll >= 1 ? tile.faceB : tile.faceA
  return (
    <span className="ft-tile" style={style}>
      <span className={`ft-box ${tile.outline > 0 ? 'is-outlining' : ''} ${rolling ? 'is-rolling' : ''}`} style={tile.outline > 0 ? { '--outline': tile.outline } : undefined}>
        {rolling ? (
          <>
            <TileFace face={tile.faceA} style={{ transform: `translateY(${-tile.roll * 100}%)` }} />
            <TileFace face={tile.faceB} style={{ transform: `translateY(${(1 - tile.roll) * 100}%)` }} />
          </>
        ) : (
          <TileFace face={finalFace} />
        )}
      </span>
      <TileLabel role={tile.labelFace.role} label={tile.labelFace.label} s={s} tileW={tile.w} style={{ opacity: tile.labelOpacity, top: s.h + 7 }} />
    </span>
  )
}

/* ──────────── Fork stage ──────────── */

/** The people above a Fork's lanes: a ring asks about one mark, a frame lands on each member. */
function ForkPeople({ people, frame, width, thirdLabel }) {
  const phone = width < 480
  const w = phone ? 40 : 46
  const gap = phone ? 14 : 16
  const total = people.length * w + (people.length - 1) * gap
  const x0 = (width - total) / 2
  return (
    <div className="ff-people" style={{ height: phone ? 92 : 104 }}>
      {people.map((who, i) => {
        const inGroup = frame.frames?.members.includes(i)
        const groupStart = i === 0 || people[i - 1] !== who
        const run = people.filter((item, k) => k >= i && item === who && people.slice(i, k + 1).every(x => x === who)).length
        return (
          <span key={i} className="ff-person" style={{ left: x0 + i * (w + gap), width: w }}>
            <PersonMark who={who} w={w} frame={inGroup ? frame.frames.opacity : 0} />
            {frame.personRing?.index === i && frame.personRing.opacity > 0 && <span className="ff-person-ring" style={{ opacity: frame.personRing.opacity }} />}
            {groupStart && (who === 'third' ? thirdLabel : PERSON_LABEL[who]) && <span className="ft-label ff-person-l" style={{ left: `${(run * w + (run - 1) * gap) / 2}px` }}>{who === 'third' ? thirdLabel : PERSON_LABEL[who]}</span>}
          </span>
        )
      })}
    </div>
  )
}

function ForkStage({ def, scene, timeline, t, width, onLane, epoch }) {
  // Measured again once the tile font has loaded (epoch): widths taken before it go stale.
  const sizes = useMemo(() => forkSizes(def, width), [def, width, epoch]) // eslint-disable-line react-hooks/exhaustive-deps
  const layout = useMemo(() => forkLayouts(scene, width, sizes), [scene, width, sizes])
  const lines = useMemo(() => forkLines(def, width, sizes), [def, width, sizes])
  const enLines = Math.max(1, ...def.scenes.flatMap(item => item.cases.map(c => enLineCount(c.en, width))))
  const geometry = useMemo(() => forkGeometry(sizes, width, def, lines, enLines), [sizes, width, def, lines, enLines])
  const frame = forkFrame(scene, timeline, t, layout, geometry, width)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  return (
    <div className="ff" style={vars}>
      {def.people && <ForkPeople people={def.people} frame={frame} width={width} thirdLabel={def.thirdLabel} />}
      <div className="ff-lanes" style={{ gap: geometry.laneGap, height: geometry.laneH, gridTemplateColumns: `repeat(${geometry.count}, minmax(0, 1fr))` }}>
        {def.lanes.map((lane, i) => (
          <button key={lane.label} type="button" className="ff-lane" style={{ '--lit': frame.lit[i] ?? 0 }} onClick={() => onLane(i)} aria-pressed={(frame.lit[i] ?? 0) > 0.5}>
            <span className="ff-lane-l"><Rich text={lane.label} /></span>
            {lane.forms?.length > 0 && (
              <span className="ff-lane-f">
                {lane.forms.map(form => <span key={form} className="ft-word" lang="sm" data-samoan={form}>{form}</span>)}
              </span>
            )}
          </button>
        ))}
      </div>
      <svg className="ft-over" width={width} height={geometry.height} aria-hidden="true">
        {frame.branches.filter(branch => branch.d).map(branch => (
          <g key={branch.lane}>
            {branch.track && <path d={branch.d} className="ff-branch" />}
            {branch.progress > 0 && <path d={branch.d} className="ff-branch is-lit" pathLength="1" strokeDasharray={`${branch.progress} 1`} />}
          </g>
        ))}
      </svg>
      <div className={`ff-row ${lines > 1 ? 'is-wrapped' : ''}`} aria-hidden="true" style={{ opacity: frame.rowOpacity }}>
        {frame.row.items.map((item, i) => {
          const style = { width: item.w, top: geometry.rowTop, height: s.h, transform: `translate3d(${item.x}px, ${item.y}px, 0)` }
          const shown = forkLabelOf(item)
          if (item.slot) {
            return (
              <span key={i} className="ft-tile" style={style}>
                <span className="ft-ghost is-slot" style={{ opacity: frame.slotOpacity }} />
                {shown && <TileLabel role={shown.role} label={shown.label} s={s} tileW={item.w} style={{ top: s.h + 7 }} />}
              </span>
            )
          }
          if (item.reads) {
            // A reading Fork: the word reads two ways until its neighbour decides, so it stays quiet
            // until the lane lights, then takes its role and its label (Direction.md part 4).
            return (
              <span key={i} className="ft-tile" style={style}>
                <span className="ft-box">
                  <TileFace face={item} style={{ opacity: frame.readP }} />
                  <TileFace face={{ ...item, role: 'quiet' }} style={{ opacity: 1 - frame.readP }} />
                </span>
                <TileLabel role={item.role} label={item.label} s={s} tileW={item.w} style={{ top: s.h + 7, opacity: frame.readP }} />
              </span>
            )
          }
          return (
            <span key={i} className="ft-tile" style={style}>
              <span className="ft-box"><TileFace face={item} /></span>
              {/* A ringed word's label arrives with the ring; any other label it names (a marker's) stands from the start. */}
              {shown && (
                <TileLabel role={shown.role} label={shown.label} s={s} tileW={item.w} style={{ top: s.h + 7, opacity: item.ring ? frame.ringLabel : 1 }} />
              )}
            </span>
          )
        })}
        {frame.ring && (
          <span className="ff-ring" style={{ top: geometry.rowTop, height: s.h, width: frame.ring.w, transform: `translate3d(${frame.ring.x}px, ${frame.ring.y}px, 0)`, opacity: frame.ring.opacity }} />
        )}
        {frame.form && frame.form.opacity > 0 && (
          <span className="ft-tile ff-form" style={{ width: frame.form.w, top: 0, height: s.h, opacity: frame.form.opacity, transform: `translate3d(${frame.form.x}px, ${frame.form.y}px, 0) scale(${frame.form.scale})` }}>
            <span className="ft-box"><TileFace face={frame.form.face} /></span>
          </span>
        )}
      </div>
      <p className={`ft-en ${frame.en?.text && enWidth(frame.en.text, width) > width ? 'is-wrap' : ''}`} data-en={frame.en?.text} style={{ top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)`, textAlign: 'center', left: 0, right: 0 }}>
        {frame.en?.text}
      </p>
    </div>
  )
}

/* ──────────── Grid stage ──────────── */

/** A cell's sentence with the marks: who the word means is framed, who it leaves out is not. */
function GridPeople({ cell, phone }) {
  const w = phone ? 30 : 36
  return (
    <span className="fg-people" aria-hidden="true">
      {cell.people.map((who, i) => <PersonMark key={i} who={who} w={w} frame={cell.members.includes(i) ? 1 : 0} />)}
    </span>
  )
}

function GridStage({ def, timeline, t, picked, onPick, width }) {
  const { beats } = timeline
  const selBeat = beats.at(-1)
  const selP = ramp(t, selBeat.start, selBeat.travelEnd)
  const chosen = picked || (selP > 0 ? def.rest : null)
  const chosenCell = chosen ? def.rows[chosen.row].cells[chosen.col] : null
  const sentenceP = picked ? 1 : ramp(selP, 0.35, 1)
  const litAt = b => (picked ? 0 : ramp(t, b.start, b.start + 220) * (1 - ramp(t, b.end - 40, b.end + 180)))
  const colLit = c => {
    const b = beats.find(item => item.kind === 'col' && item.col === c)
    return b ? litAt(b) : 0
  }
  return (
    <div className={`fg ${def.lightColumns ? 'is-people' : ''}`}>
      <table className="fg-t">
        <thead>
          <tr>
            {def.head.map((head, i) => (
              <th key={head || 'row'} scope="col" className={i === 0 ? 'fg-th-tense' : ''} style={i > 0 ? { color: `color-mix(in srgb, var(--ink) ${colLit(i - 1) * 100}%, var(--muted))` } : undefined}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {def.rows.map((row, r) => {
            const b = beats.find(item => item.kind === 'row' && item.row === r)
            const rowLit = b ? litAt(b) : 0
            const tag = picked || !b ? 1 : land(ramp(t, b.start + 120, b.travelEnd))
            return (
              <tr key={row.tense} style={{ '--lit': rowLit }} className="fg-row">
                <th scope="row" className="fg-rowhead">
                  <span className="fg-tense"><Rich text={row.tense} /></span>
                  {row.tag && <span className={`fg-tag ${row.tagStrong ? 'is-changes' : ''}`} style={{ opacity: tag, transform: `translateY(${(1 - tag) * 4}px)` }}>{row.tag}</span>}
                </th>
                {row.cells.map((cell, c) => {
                  const isOn = chosen?.row === r && chosen?.col === c
                  const fill = isOn ? (picked ? 1 : travel(ramp(selP, 0, 0.5))) : 0
                  if (cell.none) return <td key={c}><span className="fg-cell is-none" lang="sm" data-samoan={cell.form}>{cell.form}</span></td>
                  return (
                    <td key={c} style={{ '--col': colLit(c) }}>
                      <button type="button" className={`fg-cell ${c === 1 && !cell.form ? 'is-noun' : 'is-pron'} ${cell.form ? 'is-form' : ''}`} style={{ '--fill': fill }} aria-pressed={isOn} aria-label={cell.form ? `${cell.form}: ${cell.say} ${cell.en}` : undefined} onClick={() => onPick({ row: r, col: c })} data-samoan={cell.say} lang="sm">
                        {cell.form ? (
                          <>
                            <span className="fg-mini" aria-hidden="true">{cell.count.map((who, i) => <PersonMark key={i} who={who} w={width < 480 ? 15 : 18} />)}</span>
                            <span className="fg-form" data-samoan={cell.form}>{cell.form}</span>
                          </>
                        ) : (
                          <><span className="fg-marker">{cell.marker}</span>{cell.rest}</>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="fg-out">
        {/* Every cell's sentence is laid in the same place, unseen, so the panel holds the tallest
            one's height from the start and the figure never grows when a cell fills. */}
        <div className="fg-says">
          {def.rows.flatMap(row => row.cells).filter(cell => !cell.none && cell !== chosenCell).map((cell, i) => (
            <p key={i} className="fg-say is-sizer" aria-hidden="true">
              {cell.people && <GridPeople cell={cell} phone={width < 480} />}
              <span className="fx-sm">{cell.say}</span>
              <span className="fg-en">{cell.en}</span>
            </p>
          ))}
          <p className="fg-say" style={{ opacity: chosenCell ? sentenceP : 0 }}>
            {chosenCell?.people && <GridPeople cell={chosenCell} phone={width < 480} />}
            {chosenCell && <span className="fx-sm" lang="sm" data-samoan={chosenCell.say}>{chosenCell.say}</span>}
            {chosenCell && <span className="fg-en" data-en={chosenCell.en}>{chosenCell.en}</span>}
          </p>
        </div>
        {def.caption && <p className="fg-caption"><Rich text={def.caption} /></p>}
      </div>
    </div>
  )
}

/* ──────────── Build stage ──────────── */

/** A word that changes inside itself: open into pieces, the added piece arrives, close, English. */
function BuildStage({ def, scene, timeline, t, width, epoch }) {
  const s = useMemo(() => buildSizes(width), [width])
  const layout = useMemo(() => buildLayout(scene, width, s), [scene, width, s, epoch]) // eslint-disable-line react-hooks/exhaustive-deps
  const geometry = useMemo(() => buildGeometry(s, def.scenes), [s, def])
  const frame = buildFrame(scene, timeline, t, layout, geometry, s)
  const added = frame.pieces.filter(piece => piece.added)
  const changed = frame.pieces.filter(piece => piece.was != null)
  const labelled = added.filter(piece => piece.label)
  return (
    <div className={`fb text-${scene.role}`} style={{ '--fs': `${s.fs}px`, '--h': `${s.h}px`, height: geometry.height }}>
      <p className="fb-before" style={{ opacity: frame.beforeOpacity }}>
        <span className="fx-sm" lang="sm" data-samoan={scene.from.say}>{scene.from.say}</span>
      </p>
      <span className={`fb-tile role-${scene.role}`} style={{ left: frame.tileX, width: frame.tileW, top: geometry.rowTop, height: s.h, opacity: frame.merged }} />
      {frame.pieces.map((piece, i) => (
        <span key={`box-${i}`} className={`fb-tile role-${scene.role} ${piece.added ? 'is-added' : ''}`} style={{ left: piece.openX, width: piece.openW, top: geometry.rowTop + piece.y, height: s.h, opacity: frame.split * piece.opacity }} />
      ))}
      {/* The outline leans with the italic letters it marks and keeps to their own advance, so it lines up
          with them and never reaches into a neighbour's letters (OUTLINE_SKEW). */}
      {added.map((piece, i) => (
        <span key={`ring-${i}`} className="fb-outline" style={{ left: piece.closedX - 1, width: piece.w + 2, top: geometry.rowTop + 8, height: s.h - 16, opacity: frame.outline, transform: OUTLINE_SKEW }} />
      ))}
      {changed.map((piece, i) => (
        <span key={`changed-${i}`} className="fb-outline" style={{ left: piece.closedX - 1, width: piece.w + 2, top: geometry.rowTop + 8, height: s.h - 16, opacity: frame.changeOutline, transform: OUTLINE_SKEW }} />
      ))}
      {frame.pieces.map((piece, i) => (piece.change ? (
        <span key={`w-${i}`}>
          {piece.change.oldOpacity > 0 && <span className="fb-word ft-word" lang="sm" style={{ top: geometry.rowTop, height: s.h, transform: `translate3d(${piece.change.oldX}px, ${piece.change.oldY}px, 0)`, opacity: piece.change.oldOpacity }}>{piece.was}</span>}
          {piece.change.newOpacity > 0 && <span className="fb-word ft-word" lang="sm" style={{ top: geometry.rowTop, height: s.h, transform: `translate3d(${piece.change.newX}px, ${piece.change.newY}px, 0)`, opacity: piece.change.newOpacity }}>{piece.text}</span>}
        </span>
      ) : (
        <span key={`w-${i}`} className="fb-word ft-word" lang="sm" style={{ top: geometry.rowTop, height: s.h, transform: `translate3d(${piece.x}px, ${piece.y}px, 0)`, opacity: piece.opacity }}>{piece.text}</span>
      )))}
      <span className={`ft-label label-${scene.role}`} style={{ left: layout.centre, top: geometry.labelTop, opacity: clampLabel(frame.labelP) }}>
        <Label role={scene.role} label={scene.label} />
      </span>
      {labelled.map((piece, i) => (
        <span key={`l-${i}`} className="ft-label fb-piece-l" style={{ left: lerpLabel(piece, frame), top: geometry.labelTop, opacity: Math.min(piece.addP, 1 - clampLabel(frame.labelP) * 0.999) }}>
          <Label role="marker" label={piece.label} />
        </span>
      ))}
      <p className="ft-en" data-en={frame.en?.text} style={{ top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)`, textAlign: 'center', left: 0, right: 0 }}>
        {frame.en?.text}
      </p>
    </div>
  )
}

const clampLabel = v => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerpLabel = piece => piece.openX + piece.openW / 2

/* ──────────── Shell ──────────── */

function Alt({ def, scene }) {
  if (def.kind === 'grid') return null // A real table: a screen reader reads it directly.
  const lines = def.alt || scene.alt || []
  return (
    <ul className="visually-hidden">
      {lines.map(line => <li key={line}><Rich text={line} /></li>)}
    </ul>
  )
}

function LimitRow({ limit, p }) {
  return (
    <div className="ft-limit" aria-hidden="true" style={{ opacity: p, transform: `translateY(${(1 - land(p)) * 10}px)` }}>
      <div className="ft-limit-row">
        {limit.row.map(item => <StaticTile key={item.text} face={item} ring={item.ring} showLabel={false} small />)}
        <span className="ft-limit-en">{limit.en}</span>
      </div>
      <p className="ft-limit-cap">{limit.caption}</p>
    </div>
  )
}

/** The book caption under the figure. A scene may carry its own (`scene.caption`); the others
 *  fall back to the figure's. Every caption is laid in one cell, so the height holds. */
function Caption({ def, scene }) {
  const own = def.scenes.map(item => item.caption ?? def.caption ?? null)
  if (!own.some(Boolean)) return null
  if (!def.scenes.some(item => item.caption)) return <figcaption className="fx-caption"><Rich text={def.caption} /></figcaption>
  const shown = own[scene]
  const others = [...new Set(own.filter(text => text && text !== shown))]
  return (
    <figcaption className="fx-caption is-set">
      {others.map(text => <span key={text} className="is-sizer" aria-hidden="true"><Rich text={text} /></span>)}
      <span>{shown && <Rich text={shown} />}</span>
    </figcaption>
  )
}

/** Sets the list item's underlay from the frame, so the clock stays the only cause. */
function useListLink(def, rootRef) {
  return useCallback((scene, t, timeline) => {
    if (!def.linkList) return
    const root = rootRef.current
    const list = root?.closest('.blk')?.querySelector('ol.lst')
    if (!list) return
    const items = [...list.children]
    items.forEach(item => item.style.setProperty('--lit', 0))
    timeline.beats.forEach(b => {
      if (b.li == null || !items[b.li]) return
      const v = ramp(t, b.start - 120, b.start + 160) * (1 - ramp(t, b.end - 80, b.end + 120))
      if (v > 0) items[b.li].style.setProperty('--lit', v.toFixed(3))
    })
  }, [def, rootRef])
}

/** `number` is the figure's place in the chapter's one figure sequence (Direction.md part 5); it
 *  defaults to the id the chapter file gives. */
export default function Figure({ def, number = null, external = null, autoplay = true, compact = false }) {
  const epoch = useTileFont()
  const [stageRef, width] = useWidth()
  const headingId = useId()
  const [picked, setPicked] = useState(null)
  const [chipOverride, setChipOverride] = useState(null)
  const [pathPick, setPathPick] = useState(null)
  const timelines = useMemo(() => def.scenes.map(scene => (
    def.kind === 'row' ? rowTimeline(scene) : def.kind === 'fork' ? forkTimeline(scene, Boolean(def.limit)) : def.kind === 'path' ? pathTimeline(scene) : def.kind === 'build' ? buildTimeline(scene) : gridTimeline(def)
  )), [def])
  const rootRef = useRef(null)
  const onFrame = useListLink(def, rootRef)
  const clock = useFigureClock({ id: def.id, rootRef, timelines, external, autoplay, scenes: def.scenes.length, onFrame })

  const scene = def.scenes[clock.scene]
  const atEnd = clock.atRest
  const onInteract = () => clock.stopAuto()

  // A lane plays its example; if this scene has none for the lane, the scene that does comes up.
  const onLane = lane => {
    setPicked(null)
    const span = clock.timeline.spans.find(item => item.lane === lane)
    if (span) { clock.playSpan(span.start, span.end); return }
    const index = timelines.findIndex(tl => tl.spans?.some(item => item.lane === lane))
    if (index < 0) return
    const there = timelines[index].spans.find(item => item.lane === lane)
    clock.playSpan(there.start, there.end, index)
  }
  const nextChange = () => {
    if (atEnd) setPicked(null)
    setChipOverride(null)
    clock.next()
  }
  const another = () => {
    setPicked(null)
    setChipOverride(null)
    setPathPick(null)
    clock.another()
  }
  // A Swap's chip: that form turns over from whichever form is showing.
  const swapState = def.chips ? rowStateAt(clock.timeline, clock.t, chipOverride) : null
  const onSwapChip = state => {
    const beat = Math.max(0, state - 1)
    setChipOverride({ beat, from: swapState, to: state })
    const b = clock.timeline.beats[beat]
    clock.playSpan(b.start, b.end)
  }
  const onPathChip = index => {
    setPathPick(index)
    const span = clock.timeline.spans[index]
    clock.playSpan(span.start, span.end)
  }
  const pathCurrent = def.kind === 'path' ? (pathPick ?? [...clock.timeline.beats].reverse().find(b => b.kind === 'draw' && clock.t > b.start)?.caseIndex ?? 0) : null

  const limitP = def.limit ? ramp(clock.t, clock.timeline.beats.find(b => b.kind === 'limit')?.start ?? 0, clock.timeline.beats.find(b => b.kind === 'limit')?.travelEnd ?? 1) : 0

  return (
    <figure
      ref={rootRef}
      className={`fig fx fx-${def.kind} ${compact ? 'is-compact' : ''}`}
      id={`fig-${def.id.replace('.', '-')}`}
      data-figure={def.id}
      data-scene={clock.scene}
      data-at-rest={atEnd ? 'true' : 'false'}
      aria-labelledby={headingId}
      onPointerDownCapture={onInteract}
      onKeyDownCapture={onInteract}
    >
      {/* The same head as an Interactive figure's (Shells.jsx), so the page has one figure system. */}
      <div className="fig-head fx-head">
        <span className="fig-k fx-k">{`Figure ${number ?? def.id}`}</span>
        <span className="fig-t fx-t" id={headingId}><Rich text={def.title} /></span>
      </div>
      <div className="fx-stage" ref={stageRef} aria-hidden={def.kind === 'row' || def.kind === 'path' || def.kind === 'build' ? 'true' : undefined}>
        {width > 0 && def.kind === 'row' && <RowStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} override={chipOverride} epoch={epoch} />}
        {width > 0 && def.kind === 'path' && <PathStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} picked={pathPick} />}
        {width > 0 && def.kind === 'fork' && <ForkStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} onLane={onLane} epoch={epoch} />}
        {width > 0 && def.kind === 'grid' && <GridStage def={def} timeline={clock.timeline} t={clock.t} picked={picked} onPick={setPicked} width={width} />}
        {width > 0 && def.kind === 'build' && <BuildStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} epoch={epoch} />}
      </div>
      <Alt def={def} scene={scene} />
      {def.chips && (
        <div className="fx-chips" style={{ '--n': def.chips.length }}>
          {def.chips.map(chip => (
            <button key={chip.state} type="button" className={`fx-chip ${swapState === chip.state ? 'is-on' : ''}`} aria-pressed={swapState === chip.state} onClick={() => onSwapChip(chip.state)}>
              <span className="fx-chip-sm" lang="sm" data-samoan={chip.sm}>{chip.sm}</span>
              <span className="fx-chip-en" data-en={chip.en}>{chip.en}</span>
            </button>
          ))}
        </div>
      )}
      {def.kind === 'path' && <PathChips scene={scene} current={pathCurrent} onPick={onPathChip} />}
      {(!def.chips && def.kind !== 'path') || def.scenes.length > 1 ? (
        <div className="fx-controls">
          {!def.chips && def.kind !== 'path' && <button type="button" className="fx-b is-main" onClick={nextChange}>{atEnd ? 'Play again' : 'Next change'}</button>}
          {def.scenes.length > 1 && <button type="button" className="fx-b" onClick={another}>Another example</button>}
        </div>
      ) : null}
      {def.limit && <LimitRow limit={def.limit} p={limitP} />}
      <Caption def={def} scene={clock.scene} />
    </figure>
  )
}
