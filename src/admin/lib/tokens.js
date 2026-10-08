// Read, write and reset the design tokens on document.documentElement.
// Components read tokens through useTokens(); canvases cache the values they need and
// re-read when `version` changes. Nothing here introduces a literal colour, size or duration.
import { useSyncExternalStore } from 'react'

export const COLOR_TOKENS = ['ink', 'field', 'raise', 'fg', 'mute', 'amber', 'ember', 'phosphor']
export const FONT_TOKENS = ['font-display', 'font-body', 'font-mono']
export const DURATION_TOKENS = ['eighth', 'quarter', 'beat', 'bar']

export const FONT_CHOICES = {
  'font-display': [
    { label: 'Cormorant Garamond', value: '"Cormorant Garamond", Georgia, "Times New Roman", serif', loaded: true },
    { label: 'Newsreader', value: '"Newsreader", Georgia, "Times New Roman", serif', loaded: false },
    { label: 'Spectral', value: '"Spectral", Georgia, "Times New Roman", serif', loaded: false },
  ],
  'font-body': [
    { label: 'Manrope', value: '"Manrope", "Helvetica Neue", Arial, sans-serif', loaded: true },
    { label: 'Instrument Sans', value: '"Instrument Sans", "Helvetica Neue", Arial, sans-serif', loaded: false },
    { label: 'IBM Plex Sans', value: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif', loaded: false },
  ],
  'font-mono': [
    { label: 'JetBrains Mono', value: '"JetBrains Mono", "SFMono-Regular", Menlo, monospace', loaded: true },
    { label: 'IBM Plex Mono', value: '"IBM Plex Mono", "SFMono-Regular", Menlo, monospace', loaded: false },
  ],
}

export const EASING_PRESETS = [
  { label: 'Luminode', value: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
  { label: 'Material standard', value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  { label: 'Swift out', value: 'cubic-bezier(0.16, 1, 0.3, 1)' },
]

// Every token in tokens.css, in file order, grouped for export.
const EXPORT_GROUPS = [
  { comment: 'colour', keys: ['ink', 'field', 'raise', 'line', 'fg', 'mute', 'amber', 'ember', 'phosphor'] },
  {
    comment: 'type',
    keys: ['font-display', 'font-body', 'font-mono', 'text-xs', 'text-sm', 'text-md', 'text-lg', 'text-xl', 'text-2xl', 'leading-body', 'tracking-label'],
  },
  { comment: 'space', keys: ['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8', 'radius-sm', 'radius-md', 'radius-pill'] },
  { comment: 'tempo', keys: ['beat', 'eighth', 'quarter', 'bar', 'ease'] },
  { comment: 'layers', keys: ['z-stage', 'z-rail', 'z-note', 'z-overlay'] },
]

const ALL_KEYS = EXPORT_GROUPS.flatMap((g) => g.keys)

const root = () => document.documentElement

let committed = null
let version = 0
const listeners = new Set()

function emit() {
  version += 1
  listeners.forEach((fn) => fn())
}

export function readToken(name) {
  return getComputedStyle(root()).getPropertyValue(`--${name}`).trim()
}

// The value a top-level `:root` rule gives a token, ignoring media overrides (prefers-reduced-motion
// rewrites the durations) and inline dial writes. Falls back to the computed value.
function readStylesheetToken(name) {
  let found = ''
  try {
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue // cross-origin sheet
      }
      for (const rule of rules) {
        if (rule.selectorText !== ':root' || rule.parentRule) continue
        const v = rule.style.getPropertyValue(`--${name}`).trim()
        if (v) found = v
      }
    }
  } catch {
    found = ''
  }
  return found || readToken(name)
}

// Snapshot the stylesheet values once, before any dial has written an inline override.
// Durations come from the stylesheet rule itself so the snapshot is the committed tempo, not the
// reduced-motion override.
export function getCommitted() {
  if (!committed) {
    committed = {}
    ALL_KEYS.forEach((k) => {
      committed[k] = DURATION_TOKENS.includes(k) ? readStylesheetToken(k) : readToken(k)
    })
    committed['base-size'] = getComputedStyle(root()).fontSize
  }
  return committed
}

// A duration as dialled or committed, never the reduced-motion override: the inline write if a dial
// made one, otherwise the committed stylesheet value.
export function readDuration(name) {
  return root().style.getPropertyValue(`--${name}`).trim() || getCommitted()[name]
}

export function setToken(name, value) {
  getCommitted()
  root().style.setProperty(`--${name}`, value)
  emit()
}

export function setTokens(map) {
  getCommitted()
  Object.entries(map).forEach(([k, v]) => root().style.setProperty(`--${k}`, v))
  emit()
}

export function setBaseSize(px) {
  getCommitted()
  root().style.setProperty('--base-size', `${px}px`)
  root().style.fontSize = `${px}px`
  emit()
}

export function resetTokens() {
  const r = root()
  ALL_KEYS.forEach((k) => r.style.removeProperty(`--${k}`))
  r.style.removeProperty('--base-size')
  r.style.removeProperty('font-size')
  emit()
}

// tempo
export function parseMs(value) {
  const v = String(value).trim()
  if (v.endsWith('ms')) return parseFloat(v)
  if (v.endsWith('s')) return parseFloat(v) * 1000
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export function bpmToDurations(bpm) {
  const beat = Math.round(60000 / bpm)
  return { beat, eighth: Math.round(beat / 4), quarter: Math.round(beat / 2), bar: beat * 2 }
}

export function beatToBpm(beatMs) {
  return Math.round(60000 / Math.max(1, beatMs))
}

export function setBpm(bpm) {
  const d = bpmToDurations(bpm)
  setTokens({ beat: `${d.beat}ms`, eighth: `${d.eighth}ms`, quarter: `${d.quarter}ms`, bar: `${d.bar}ms` })
}

// colour helpers for canvas code
export function parseColor(value) {
  const v = String(value).trim()
  if (v.startsWith('#')) {
    const h = v.slice(1)
    const full = h.length === 3 || h.length === 4 ? h.split('').map((c) => c + c).join('') : h
    const n = parseInt(full.slice(0, 6), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = v.match(/rgba?\(([^)]+)\)/)
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat)
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  }
  return [0, 0, 0]
}

export function toHex(value) {
  const [r, g, b] = parseColor(value)
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
}

export const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

// A bundle of everything the canvases need, read once per token version.
export function readPalette() {
  const p = {}
  COLOR_TOKENS.forEach((k) => {
    p[k] = parseColor(readToken(k))
  })
  p.line = readToken('line')
  p.fontDisplay = readToken('font-display')
  p.fontBody = readToken('font-body')
  p.fontMono = readToken('font-mono')
  p.beat = parseMs(readToken('beat')) || 500
  p.eighth = parseMs(readToken('eighth'))
  p.quarter = parseMs(readToken('quarter'))
  p.bar = parseMs(readToken('bar'))
  p.base = parseFloat(getComputedStyle(root()).fontSize) || 16
  p.textXs = parseFloat(readToken('text-xs')) * p.base
  p.textSm = parseFloat(readToken('text-sm')) * p.base
  p.textMd = parseFloat(readToken('text-md')) * p.base
  p.textLg = parseFloat(readToken('text-lg')) * p.base
  return p
}

export function exportTokensCss() {
  const current = {}
  ALL_KEYS.forEach((k) => {
    // durations normalised to ms: the built stylesheet minifies 500ms to .5s
    current[k] = DURATION_TOKENS.includes(k) ? `${parseMs(readDuration(k))}ms` : readToken(k)
  })
  const lines = [
    '/* Luminode design tokens. The only place colours, type sizes and durations are defined.',
    '   See docs/roadmap/textbook/DESIGN.md. Components reference these; they never introduce literals. */',
    ':root {',
    '  color-scheme: dark;',
  ]
  EXPORT_GROUPS.forEach((g) => {
    lines.push('')
    const label = g.comment === 'tempo' ? `tempo: ${beatToBpm(parseMs(current.beat))} bpm` : g.comment
    lines.push(`  /* ${label} */`)
    g.keys.forEach((k) => lines.push(`  --${k}: ${current[k]};`))
  })
  lines.push('}')
  lines.push('')
  lines.push('@media (prefers-reduced-motion: reduce) {')
  lines.push('  :root {')
  lines.push(`    --beat: ${current.quarter};`)
  lines.push('    --eighth: 0ms;')
  lines.push(`    --quarter: ${current.quarter};`)
  lines.push(`    --bar: ${current.quarter};`)
  lines.push('  }')
  lines.push('}')
  return lines.join('\n') + '\n'
}

// React subscription
function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getVersion = () => version

export function useTokenVersion() {
  return useSyncExternalStore(subscribe, getVersion, getVersion)
}
