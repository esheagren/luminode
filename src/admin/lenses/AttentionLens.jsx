import { useRef, useState, useMemo } from 'react'
import { useCanvasSize, usePalette } from '../lib/useCanvas.js'
import { useAnimationFrame } from '../lib/useAnimationFrame.js'
import { rgba, mix } from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './lens.module.css'

const SENTENCE = 'The quick brown fox jumps over the lazy dog while the cat sleeps by the fire'.split(' ')
const REPEAT = ['vex', 'orb', 'tul', 'sap', 'mir', 'kol', 'dra', 'fen']
const INDUCTION = [...REPEAT, ...REPEAT]

const PATTERNS = [
  { id: 'previous', label: 'Previous token' },
  { id: 'first', label: 'Positional (first token)' },
  { id: 'induction', label: 'Induction (repeated sequence)' },
]

// deterministic noise so a given layer/head always looks the same
function noise(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Fake attention weights: W[i][j] for j <= i, rows sum to 1.
function buildWeights(pattern, layer, head) {
  const n = pattern === 'induction' ? INDUCTION.length : SENTENCE.length
  const seed = layer * 12 + head
  const W = []
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0)
    for (let j = 0; j <= i; j++) row[j] = 0.02 + 0.06 * noise(seed * 131 + i * 17 + j)
    if (pattern === 'previous') {
      if (i > 0) row[i - 1] += 0.85
      else row[0] += 0.85
    } else if (pattern === 'first') {
      row[0] += 0.8
      if (i > 0) row[i] += 0.1
    } else {
      const half = REPEAT.length
      if (i >= half) row[i - half + 1] += 0.8
      else row[0] += 0.7
    }
    const sum = row.reduce((a, b) => a + b, 0)
    W.push(row.map((v) => v / sum))
  }
  return W
}

export default function AttentionLens() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const { w: W, h: H } = useCanvasSize(wrap, canvas)
  const p = usePalette()
  const [pattern, setPattern] = useState('induction')
  const [layer, setLayer] = useState(5)
  const [head, setHead] = useState(5)
  const [hover, setHover] = useState(-1)
  const tokens = pattern === 'induction' ? INDUCTION : SENTENCE
  const weights = useMemo(() => buildWeights(pattern, layer, head), [pattern, layer, head])

  const { reduced, redraw } = useAnimationFrame(
    (t) => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx || !W || !H) return
      const BEAT = p.beat
      const n = tokens.length
      const active = reduced ? -1 : Math.floor(t / BEAT) % n
      const phase = reduced ? 1 : (t % BEAT) / BEAT
      const focus = hover >= 0 ? hover : active

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = rgba(p.field, 1)
      ctx.fillRect(0, 0, W, H)

      const pad = p.textSm * 1.2
      const slot = (W - pad * 2) / n
      const x = (i) => pad + slot * (i + 0.5)
      const baseY = H - p.textMd * 2.6
      const small = slot < p.textSm * 3.2

      // arcs from each token back to the tokens it reads
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
          const wgt = weights[i][j]
          if (wgt < 0.04) continue
          const isFocus = focus === i
          const dim = focus >= 0 && !isFocus ? 0.3 : 1
          const lift = Math.min(H * 0.8, Math.abs(x(i) - x(j)) * 0.55 + p.textMd)
          const col = isFocus ? mix(p.phosphor, p.amber, wgt) : p.phosphor
          ctx.strokeStyle = rgba(col, wgt * dim)
          ctx.lineWidth = 0.5 + wgt * 3
          ctx.beginPath()
          ctx.moveTo(x(i), baseY)
          ctx.quadraticCurveTo((x(i) + x(j)) / 2, baseY - lift, x(j), baseY)
          ctx.stroke()
          // a pulse travels back along the strongest reads of the active token
          if (isFocus && wgt > 0.3 && !reduced) {
            const u = 1 - Math.pow(1 - phase, 3)
            const mx = (x(i) + x(j)) / 2
            const my = baseY - lift
            const bx = (1 - u) * (1 - u) * x(i) + 2 * (1 - u) * u * mx + u * u * x(j)
            const by = (1 - u) * (1 - u) * baseY + 2 * (1 - u) * u * my + u * u * baseY
            const gg = ctx.createRadialGradient(bx, by, 0, bx, by, 8)
            gg.addColorStop(0, rgba(p.ember, 0.9))
            gg.addColorStop(1, rgba(p.ember, 0))
            ctx.fillStyle = gg
            ctx.beginPath()
            ctx.arc(bx, by, 8, 0, 7)
            ctx.fill()
          }
        }
      }
      ctx.lineWidth = 1

      // token row
      for (let i = 0; i < n; i++) {
        const isFocus = focus === i
        const reads = focus >= 0 ? weights[focus][i] : 0
        const tokCol = isFocus ? p.amber : reads > 0.3 ? mix(p.fg, p.amber, reads) : p.fg
        ctx.fillStyle = rgba(tokCol, isFocus ? 1 : 0.55 + reads)
        ctx.beginPath()
        ctx.arc(x(i), baseY, isFocus ? 4 : 2.5, 0, 7)
        ctx.fill()
        ctx.font = `${small ? p.textXs : p.textSm}px ${p.fontMono}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = rgba(tokCol, isFocus ? 1 : 0.7 + reads * 0.3)
        if (small) {
          ctx.save()
          ctx.translate(x(i), baseY + p.textXs * 0.8)
          ctx.rotate(Math.PI / 4)
          ctx.textAlign = 'left'
          ctx.fillText(tokens[i], 0, 0)
          ctx.restore()
        } else {
          ctx.fillText(tokens[i], x(i), baseY + p.textSm * 0.7)
        }
      }

      ctx.font = `${p.textXs}px ${p.fontMono}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = rgba(p.mute, 1)
      ctx.fillText(`L${layer}H${head} · ${PATTERNS.find((q) => q.id === pattern).label.toLowerCase()}`, pad, pad * 0.6)
    },
    [W, H, p, weights, hover, layer, head, pattern, tokens],
  )

  const select = (next) => {
    if (next !== hover) {
      setHover(next)
      if (reduced) redraw()
    }
  }
  const onMove = (e) => {
    const r = canvas.current.getBoundingClientRect()
    const pad = p.textSm * 1.2
    const slot = (W - pad * 2) / tokens.length
    const i = Math.floor((e.clientX - r.left - pad) / slot)
    select(i >= 0 && i < tokens.length ? i : -1)
  }
  const onKey = (e) => {
    const n = tokens.length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') select((hover + 1 + n) % n)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') select((hover - 1 + n) % n)
    else if (e.key === 'Escape') select(-1)
    else return
    e.preventDefault()
  }

  // what the isolated token reads, for the live region
  const announce = (() => {
    if (hover < 0) return ''
    const reads = weights[hover]
      .map((w, j) => [w, j])
      .filter(([, j]) => j !== hover)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3)
      .map(([w, j]) => `${tokens[j]} ${Math.round(w * 100)}%`)
      .join(', ')
    return `${tokens[hover]}, token ${hover + 1} of ${tokens.length}. Reads ${reads}.`
  })()

  return (
    <div className={s.lens}>
      <div className={s.controls}>
        <label className={`${ui.field} ${s.grow}`}>
          <span className={ui.label}>Pattern</span>
          <select className={ui.select} value={pattern} onChange={(e) => setPattern(e.target.value)}>
            {PATTERNS.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span className={ui.label}>Layer</span>
          <select className={`${ui.select} ${ui.mono}`} value={layer} onChange={(e) => setLayer(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                L{i}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          <span className={ui.label}>Head</span>
          <select className={`${ui.select} ${ui.mono}`} value={head} onChange={(e) => setHead(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                H{i}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div ref={wrap} className={`${s.stage} ${s.stageShort}`}>
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="Attention lens: sixteen tokens in a row; arcs from each token back to the tokens it attends to, opacity equal to the weight. Arrow keys move between tokens."
          onPointerMove={onMove}
          onPointerLeave={() => select(-1)}
          onKeyDown={onKey}
          onFocus={() => {
            if (hover < 0) select(0)
          }}
          onBlur={() => select(-1)}
        />
      </div>
      <div className={ui.srOnly} aria-live="polite">
        {announce}
      </div>
      <p className={s.hint}>hover or arrow to a token to isolate its reads · the active token advances one per beat</p>
      <p className={ui.caption}>
        <em>Fake:</em> the weights. They are generated from the chosen pattern type plus deterministic noise seeded by
        layer and head; the 12×12 selectors change the noise, not the pattern. <em>Real:</em> arcs with alpha = weight,
        the three canonical head shapes (previous-token, first-token, induction on an 8-token sequence repeated).
      </p>
    </div>
  )
}
