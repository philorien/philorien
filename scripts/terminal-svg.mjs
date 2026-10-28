// Builds the animated terminal at the top of the profile README.
// Writes assets/terminal.svg (animated) and assets/terminal-static.svg (the
// final frame, which the README serves to visitors who prefer reduced motion).
//
// GitHub renders README SVGs through <img>, which blocks scripts but still runs
// SMIL and CSS animations. SMIL drives the one-shot timeline (typing, lines
// appearing) and CSS keyframes drive the loops (tree sway, falling leaves).
//
// Run: node scripts/terminal-svg.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')

// Every glyph gets an explicit x, so the grid holds no matter which monospace
// font the viewer's system falls back to (an <img> SVG can't load web fonts).
const W = 720
const CW = 8.4 // advance width of a 14px monospace glyph (0.6em)
const LH = 20
const X0 = 24
const INFO_X = X0 + 29 * CW
const ART_X = 44

// GitHub dark palette. Every text color clears 4.5:1 against bg.
const C = {
  bg: '#0d1117',
  bar: '#161b22',
  border: '#30363d',
  text: '#c9d1d9',
  dim: '#8b949e',
  green: '#3fb950',
  bright: '#7ee787',
  blue: '#79c0ff',
}

// Segments are [text, fill, style], where style holds b (bold), i (italic), u (underline)
const PROMPT = [
  ['phil', C.green, 'b'],
  ['@', C.dim],
  ['github', C.green, 'b'],
  [':', C.dim],
  ['~', C.blue, 'b'],
  ['$ ', C.dim],
]

const field = (label, value, fill = C.text) => [
  [`${label}:`.padEnd(8), C.green, 'b'],
  [value, fill],
]

const INFO = [
  [['phil', C.bright, 'b'], ['@', C.text], ['github', C.bright, 'b']],
  [['-----------', C.dim]],
  field('Name', 'Phil Linley'),
  field('Based', 'Columbus, OH'),
  field('Stack', 'Vue/Nuxt, React/Next.js, Sanity'),
  field('Tests', 'Vitest, Playwright'),
  field('Studio', 'lorienweb.com'),
  field('Sites', 'Dragonfly Bookshop, Hope Church'),
  field('Status', 'open to roles', C.bright),
]

const SWATCHES = ['#ff7b72', '#ffa657', '#e3b341', '#3fb950', '#56d4dd', '#79c0ff', '#d2a8ff', '#c9d1d9']

const AXE_COMMAND = 'npx @axe-core/cli lorienweb.com hopechurchcolumbus.org'

// Real @axe-core/cli 4.14.0 output from that command (Oct 27, 2026). The only
// line dropped is "Please note that only 20% to 50%...", which is too wide.
// Blank lines render at half height. [seconds after the previous line, segments]
const testing = (url) => [
  ['Testing ', C.text, 'b'],
  [url, C.blue, 'bu'],
  [' ... please wait, this may take a minute.', C.text],
]
const AXE_OUTPUT = [
  [0.35, [['Running axe-core 4.14.0 in chrome-headless', C.text, 'b']]],
  [0.3, []],
  [0, testing('http://lorienweb.com')],
  [1.1, [[' 0 violations found!', C.green]]],
  [0.1, []],
  [0, testing('http://hopechurchcolumbus.org')],
  [1.1, [[' 0 violations found!', C.green]]],
  [0.15, [['Testing complete of 2 pages', C.text, 'b']]],
  [0.1, []],
  [0, [['Manual testing is always required. For more information see:', C.text, 'i']]],
  [0, [['https://dequeuniversity.com/class/testing', C.blue, 'iu']]],
]

const COMMENT = '# now unplug the mouse and turn on VoiceOver'

const TITLE = 'phil@github: neofetch and an accessibility scan'
const DESC =
  'Animated terminal. Running neofetch shows a green pixel-art tree next to: ' +
  'Name Phil Linley, based in Columbus, OH, stack Vue/Nuxt, React/Next.js and Sanity, ' +
  'tests Vitest and Playwright, studio lorienweb.com, sites Dragonfly Bookshop and Hope Church, ' +
  'status open to roles. Then an axe-core scan of lorienweb.com and hopechurchcolumbus.org ' +
  'finds 0 violations on both and reminds that manual testing is always required, ' +
  'and a comment reads: now unplug the mouse and turn on VoiceOver.'

// Green leaves (L light, g mid, d dark) over brown bark (B light, b mid, k dark).
// The top SWAY_ROWS rows move in the wind.
const TREE = [
  '....LLg.Lgg....',
  '..LLLLgLLgggg..',
  '.LLLggLgggggdg.',
  'LLggggLggggggdd',
  'Lggggggggdggggd',
  '.ggggdgggggggd.',
  '..dggggggggdd..',
  '...dd.Bbk.dd...',
  '......Bbk......',
  '......Bbk......',
  '......Bbk......',
  '.....BBbkk.....',
  '....BBBbkkk....',
]
const TREE_COLORS = { L: '#56d364', g: '#2ea043', d: '#1a7f37', B: '#c08552', b: '#9c6644', k: '#7f5539' }
const PX = 12 // pixel pitch
const SWAY_ROWS = 3
const SWAY = [0, 1, 0, -1] // column offset of the swaying rows in each frame
const SWAY_FRAME = 0.9 // seconds per frame

// [column, row, delay, cycle] for each falling leaf, in seconds
const FALLING = [
  [2, 6, 3.4, 9],
  [12, 6, 6.3, 11],
  [0, 4, 9.6, 13],
]

const r = (n) => Math.round(n * 1000) / 1000
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const length = (segs) => segs.reduce((n, [str]) => n + [...str].length, 0)

// Seeded so regenerating doesn't churn the diff
let seed = 1
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

// Offsets in seconds from the first keystroke, with uneven human-ish gaps
function keystrokes(chars) {
  const times = [0]
  for (let i = 1; i < chars.length; i++) {
    const pause = chars[i - 1] === ' ' ? 0.08 : 0
    times.push(times[i - 1] + 0.03 + rand() * 0.05 + pause)
  }
  return times
}

function tspans(segs, x) {
  let col = 0
  return segs
    .map(([str, fill, style = '']) => {
      const chars = [...str]
      const xs = chars.map((_, i) => r(x + (col + i) * CW)).join(' ')
      col += chars.length
      const attrs =
        (style.includes('b') ? ' font-weight="700"' : '') +
        (style.includes('i') ? ' font-style="italic"' : '') +
        (style.includes('u') ? ' text-decoration="underline"' : '')
      return `<tspan x="${xs}" fill="${fill}"${attrs}>${esc(str)}</tspan>`
    })
    .join('')
}

function pixels(rows, firstRow = 0, dx = 0) {
  const byColor = {}
  rows.forEach((row, ri) =>
    [...row].forEach((ch, ci) => {
      if (ch === '.') return
      ;(byColor[ch] ??= []).push(
        `<rect x="${(ci + dx) * PX}" y="${(ri + firstRow) * PX}" width="${PX - 1}" height="${PX - 1}" rx="1.5"/>`,
      )
    }),
  )
  return Object.entries(byColor)
    .map(([ch, rects]) => `<g fill="${TREE_COLORS[ch]}">${rects.join('')}</g>`)
    .join('')
}

// Stepped fall with a side-to-side wobble, a rest on the ground, then gone
function fallKeyframes(name, distance, cycle) {
  const steps = 14
  const fall = 2.8
  const rest = 1.2
  const wobble = [0, 2, 4, 5, 4, 2, 0, -2, -4, -5, -4, -2, 0, 2, 4]
  const pct = (s) => r((s / cycle) * 100)
  const frames = ['0%{opacity:1;transform:translate(0,0)}']
  for (let k = 1; k <= steps; k++) {
    frames.push(`${pct((k / steps) * fall)}%{transform:translate(${wobble[k]}px,${r((k / steps) * distance)}px)}`)
  }
  frames.push(`${pct(fall + rest)}%{opacity:0}`)
  return `@keyframes ${name}{${frames.join('')}}`
}

function build(animated) {
  const defs = []
  const body = []
  const css = []
  let t = 0.4
  let y = 60
  let typed = 0
  seed = 1

  const hidden = animated ? ' visibility="hidden"' : ''
  const show = (at) => (animated ? `<set attributeName="visibility" to="visible" begin="${r(at)}s" fill="freeze"/>` : '')

  function line(segs, x, ly, at) {
    if (segs.length) body.push(`<text y="${ly}"${hidden}>${tspans(segs, x)}${show(at)}</text>`)
  }

  // Prompt, a blinking wait, then the input types out behind a widening clip
  function command(input, fill = C.text) {
    const promptAt = t
    line(PROMPT, X0, y, promptAt)
    const x = r(X0 + length(PROMPT) * CW)

    if (!animated) {
      line([[input, fill]], x, y)
      y += LH
      return
    }

    const typeAt = promptAt + 0.7
    const keys = keystrokes([...input])
    const dur = keys.at(-1) + 0.05
    const enterAt = typeAt + keys.at(-1) + 0.35
    const keyTimes = keys.map((k) => r(k / dur)).join(';')
    const id = `type${typed++}`
    const timing = `keyTimes="${keyTimes}" calcMode="discrete" begin="${r(typeAt)}s" dur="${r(dur)}s" fill="freeze"`

    defs.push(
      `<clipPath id="${id}"><rect x="${x}" y="${y - 16}" width="0" height="24">` +
        `<animate attributeName="width" values="${keys.map((_, i) => r((i + 1) * CW)).join(';')}" ${timing}/></rect></clipPath>`,
    )
    body.push(`<text y="${y}" clip-path="url(#${id})">${tspans([[input, fill]], x)}</text>`)
    body.push(
      `<rect x="${x}" y="${y - 12}" width="${CW}" height="17" fill="${C.bright}"${hidden}>${show(promptAt)}` +
        `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1s" begin="${r(promptAt)}s" end="${r(typeAt)}s" repeatCount="indefinite"/>` +
        `<animate attributeName="x" values="${keys.map((_, i) => r(x + (i + 1) * CW)).join(';')}" ${timing}/>` +
        `<set attributeName="visibility" to="hidden" begin="${r(enterAt)}s" fill="freeze"/></rect>`,
    )
    t = enterAt + 0.12
    y += LH
  }

  function tree(x, top) {
    const h = TREE.length * PX
    const cols = TREE[0].length
    const still = pixels(TREE.slice(SWAY_ROWS), SWAY_ROWS)
    const top_ = TREE.slice(0, SWAY_ROWS)

    if (!animated) {
      body.push(`<g transform="translate(${x} ${top})" filter="url(#glow)">${pixels(top_)}${still}</g>`)
      return
    }

    // Rows print top to bottom, like neofetch drawing its logo
    defs.push(
      `<clipPath id="reveal"><rect x="${-2 * PX}" y="0" width="${(cols + 4) * PX}" height="0">` +
        `<animate attributeName="height" values="${TREE.map((_, i) => (i + 1) * PX).join(';')}" calcMode="discrete" begin="${r(t)}s" dur="${r(TREE.length * 0.03)}s" fill="freeze"/></rect></clipPath>`,
    )
    const frames = SWAY.map((dx, i) => `<g class="sway f${i}">${pixels(top_, 0, dx)}</g>`).join('')
    const leaves = FALLING.map(
      ([col, row], i) => `<rect class="leaf leaf${i}" x="${col * PX + 3}" y="${row * PX + 3}" width="5" height="5" fill="${TREE_COLORS.g}"/>`,
    ).join('')
    body.push(
      `<g transform="translate(${x} ${top})" clip-path="url(#reveal)"><g filter="url(#glow)">${frames}${still}</g>${leaves}</g>`,
    )

    css.push(
      `.sway{opacity:0;animation:sway ${r(SWAY.length * SWAY_FRAME)}s steps(1) infinite}`,
      ...SWAY.map((_, i) => `.f${i}{animation-delay:${r(i * SWAY_FRAME)}s}`),
      `@keyframes sway{0%{opacity:1}${r(100 / SWAY.length)}%{opacity:0}}`,
      '.leaf{opacity:0}',
      ...FALLING.flatMap(([, row, delay, cycle], i) => [
        `.leaf${i}{animation:fall${i} ${cycle}s steps(1) ${delay}s infinite}`,
        fallKeyframes(`fall${i}`, h - 6 - (row * PX + 3), cycle),
      ]),
      '@media (prefers-reduced-motion:reduce){.sway,.leaf{animation:none}.f0{opacity:1}}',
    )
  }

  function neofetch() {
    tree(ART_X, y + 12)
    INFO.forEach((segs, i) => line(segs, INFO_X, y + i * LH, t + i * 0.04))
    const swatchY = y + (INFO.length - 1) * LH + 22
    const swatches = SWATCHES.map(
      (fill, i) => `<rect x="${r(INFO_X + i * 3 * CW)}" y="${swatchY}" width="${r(3 * CW)}" height="16" fill="${fill}"/>`,
    ).join('')
    body.push(`<g${hidden}>${swatches}${show(t + INFO.length * 0.04 + 0.08)}</g>`)
    t += 0.9
    y = swatchY + 48
  }

  function finalPrompt() {
    line(PROMPT, X0, y, t)
    const x = r(X0 + length(PROMPT) * CW)
    const blink = animated
      ? `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1s" begin="${r(t)}s" repeatCount="indefinite"/>`
      : ''
    body.push(`<rect x="${x}" y="${y - 12}" width="${CW}" height="17" fill="${C.bright}"${hidden}>${show(t)}${blink}</rect>`)
  }

  command('neofetch')
  neofetch()
  command(AXE_COMMAND)
  for (const [delay, segs] of AXE_OUTPUT) {
    t += delay
    line(segs, X0, y, t)
    y += segs.length ? LH : LH / 2
  }
  t += 0.5
  command(COMMENT, C.dim)
  finalPrompt()

  const H = y + 18
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="title desc">
<title id="title">${esc(TITLE)}</title>
<desc id="desc">${esc(DESC)}</desc>
<style>
text{font:14px ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;white-space:pre}
.title{font-size:12px;fill:${C.dim}}
${css.join('\n')}
</style>
<defs>
<filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
<feGaussianBlur stdDeviation="2.4" result="blur"/>
<feComponentTransfer in="blur" result="soft"><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
<feMerge><feMergeNode in="soft"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
<pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#ffffff" fill-opacity="0.025"/></pattern>
<clipPath id="window"><rect width="${W}" height="${H}" rx="10"/></clipPath>
${defs.join('\n')}
</defs>
<g clip-path="url(#window)">
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="34" fill="${C.bar}"/>
<line x1="0" y1="34" x2="${W}" y2="34" stroke="${C.border}"/>
<circle cx="20" cy="17" r="6" fill="#ff5f56"/><circle cx="40" cy="17" r="6" fill="#ffbd2e"/><circle cx="60" cy="17" r="6" fill="#27c93f"/>
<text class="title" x="${W / 2}" y="21" text-anchor="middle">phil@github: ~</text>
<g xml:space="preserve">
${body.join('\n')}
</g>
<rect y="34" width="${W}" height="${H - 34}" fill="url(#scan)" pointer-events="none"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" stroke="${C.border}"/>
</svg>
`
}

mkdirSync(join(ROOT, 'assets'), { recursive: true })
for (const [file, animated] of [
  ['terminal.svg', true],
  ['terminal-static.svg', false],
]) {
  const svg = build(animated)
  writeFileSync(join(ROOT, 'assets', file), svg)
  console.log(`assets/${file}  ${(svg.length / 1024).toFixed(1)} KB`)
}
