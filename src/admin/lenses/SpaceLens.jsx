import { useRef, useEffect, useMemo } from 'react'
import { useCanvasSize, usePalette } from '../lib/useCanvas.js'
import { useAnimationFrame } from '../lib/useAnimationFrame.js'
import { rgba, mix } from '../lib/tokens.js'
import ui from '../ui.module.css'
import s from './lens.module.css'

// Example words placed by hand into four clusters (royalty, vehicles, music, mind) plus bridge words.
// Positions are made up; they stand in for a 2D projection of real embeddings.
const WORDS = [
  ['king', 0.70, 0.28, true], ['queen', 0.76, 0.22, true], ['man', 0.62, 0.36], ['woman', 0.68, 0.31],
  ['throne', 0.80, 0.33], ['crown', 0.74, 0.40], ['prince', 0.84, 0.26], ['realm', 0.86, 0.38],
  ['car', 0.18, 0.70], ['truck', 0.12, 0.76], ['road', 0.24, 0.78], ['engine', 0.15, 0.62],
  ['wheel', 0.26, 0.66], ['bus', 0.08, 0.68], ['garage', 0.20, 0.86],
  ['violin', 0.44, 0.20], ['melody', 0.50, 0.14], ['chord', 0.38, 0.26], ['rhythm', 0.55, 0.24],
  ['tempo', 0.47, 0.32], ['song', 0.60, 0.17], ['echo', 0.34, 0.16],
  ['neuron', 0.52, 0.62], ['synapse', 0.58, 0.68], ['signal', 0.46, 0.72], ['memory', 0.62, 0.58],
  ['thought', 0.55, 0.52], ['dream', 0.66, 0.66], ['mind', 0.48, 0.56], ['nerve', 0.42, 0.64],
  ['light', 0.38, 0.44], ['path', 0.32, 0.52], ['space', 0.44, 0.46], ['time', 0.52, 0.42], ['word', 0.40, 0.36],
]
const K = 3
const MAX_DEPTH = 3

function buildGraph() {
  const nodes = WORDS.map(([w, x, y, q]) => ({ w, x, y, q: !!q, a: 0, born: 0 }))
  const edges = []
  const adj = nodes.map(() => [])
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => [Math.hypot(a.x - b.x, (a.y - b.y) * 0.75), j])
      .filter((e) => e[1] !== i)
      .sort((p, q) => p[0] - q[0])
      .slice(0, K)
      .forEach(([dist, j]) => {
        if (!adj[i].includes(j)) {
          adj[i].push(j)
          adj[j].push(i)
          edges.push([i, j, dist])
        }
      })
  })
  return { nodes, edges, adj }
}

export default function SpaceLens() {
  const wrap = useRef(null)
  const canvas = useRef(null)
  const { w: W, h: H } = useCanvasSize(wrap, canvas)
  const p = usePalette()
  const graph = useMemo(buildGraph, [])
  const st = useRef({ pulses: [], hover: -1, lastBeat: -1, focus: -1 })

  // Fire a node: it lights, and after half a beat each neighbour fires one hop further out.
  const fire = (i, depth, start) => {
    const n = graph.nodes[i]
    n.a = 1
    n.born = start
    if (depth >= MAX_DEPTH) return
    graph.adj[i].forEach((j) => st.current.pulses.push({ from: i, to: j, start, depth, delivered: false }))
  }

  const { reduced, redraw } = useAnimationFrame(
    (t, dt, now) => {
      const ctx = canvas.current?.getContext('2d')
      if (!ctx || !W || !H) return
      const S = st.current
      const BEAT = p.beat
      const AMBER = p.amber
      const EMBER = p.ember
      const PHOS = p.phosphor
      const ALAB = p.fg
      const px = (n) => [p.textLg * 3 + n.x * (W - p.textLg * 6), p.textLg * 3.5 + n.y * (H - p.textLg * 7.5)]

      if (reduced) {
        graph.nodes.forEach((n) => {
          if (n.q) {
            n.a = 0.6
            n.born = now
          }
        })
      } else {
        const beat = Math.floor(t / BEAT)
        if (beat !== S.lastBeat) {
          S.lastBeat = beat
          if (beat % 8 === 0) {
            const qs = graph.nodes.map((n, i) => (n.q ? i : -1)).filter((i) => i >= 0)
            fire(qs[(beat / 8) % qs.length], 0, now)
          }
        }
        // deliver pulses that have arrived
        S.pulses.forEach((pl) => {
          if (!pl.delivered && now - pl.start >= BEAT / 2) {
            pl.delivered = true
            if (graph.nodes[pl.to].a < 0.5) fire(pl.to, pl.depth + 1, now)
          }
        })
        S.pulses = S.pulses.filter((pl) => now - pl.start < BEAT / 2 + BEAT * 0.4)
      }

      const breath = 0.5 + 0.5 * Math.sin((t / (BEAT * 4)) * Math.PI * 2)
      // on a narrow stage only the query, fired and hovered words carry labels
      const dense = W < p.textLg * 30
      ctx.clearRect(0, 0, W, H)
      const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.7)
      g.addColorStop(0, rgba(p.field, 1))
      g.addColorStop(1, rgba(p.ink, 1))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)

      // ambient rose: the field's background texture
      if (!reduced) {
        const cx = W * 0.5
        const cy = H * 0.52
        const R = 0.42 * Math.min(W, H)
        const tt = (t / 1000) * 0.3
        const n = 180
        for (let i = 0; i < n; i++) {
          const th = (i / n) * Math.PI * 2 + tt
          const r = R * (0.2 + 0.8 * Math.sin(2 * th + tt))
          const x = cx + Math.cos(th) * r
          const y = cy + Math.sin(th) * r * 0.8
          const sz = 0.6 + 0.5 * Math.sin(3 * th + tt)
          ctx.fillStyle = rgba(AMBER, 0.05 + 0.04 * Math.sin(th + tt))
          ctx.beginPath()
          ctx.arc(x, y, sz, 0, 7)
          ctx.fill()
        }
      }

      // filaments
      ctx.lineWidth = 1
      graph.edges.forEach(([i, j]) => {
        const a = graph.nodes[i]
        const b = graph.nodes[j]
        const [x1, y1] = px(a)
        const [x2, y2] = px(b)
        const act = Math.max(a.a, b.a)
        const al = 0.06 + 0.03 * breath + act * 0.35
        ctx.strokeStyle = rgba(act > 0.2 ? mix(PHOS, AMBER, act) : ALAB, al)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // pulses along filaments
      S.pulses.forEach((pl) => {
        const a = px(graph.nodes[pl.from])
        const b = px(graph.nodes[pl.to])
        const u = Math.min(1, (now - pl.start) / (BEAT / 2))
        const e = 1 - Math.pow(1 - u, 3)
        const x = a[0] + (b[0] - a[0]) * e
        const y = a[1] + (b[1] - a[1]) * e
        const c = mix(EMBER, PHOS, pl.depth / MAX_DEPTH)
        const gg = ctx.createRadialGradient(x, y, 0, x, y, 10)
        gg.addColorStop(0, rgba(c, 0.9))
        gg.addColorStop(1, rgba(c, 0))
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.arc(x, y, 10, 0, 7)
        ctx.fill()
      })

      // nodes
      graph.nodes.forEach((n, i) => {
        if (n.a > 0 && !reduced) n.a = Math.max(0, 1 - (now - n.born) / (BEAT * 3))
        const [x, y] = px(n)
        const base = n.q ? AMBER : ALAB
        const col = n.a > 0 ? mix(base, EMBER, n.a * 0.8) : base
        const r = (n.q ? 4.5 : 3) + n.a * 3
        const halo = (n.q ? 22 : 12) + n.a * 22
        const gg = ctx.createRadialGradient(x, y, 0, x, y, halo)
        gg.addColorStop(0, rgba(col, (n.q ? 0.35 : 0.12) + n.a * 0.45))
        gg.addColorStop(1, rgba(col, 0))
        ctx.fillStyle = gg
        ctx.beginPath()
        ctx.arc(x, y, halo, 0, 7)
        ctx.fill()
        ctx.fillStyle = rgba(col, n.q ? 1 : 0.55 + n.a * 0.45)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 7)
        ctx.fill()
        if (S.focus === i) {
          ctx.strokeStyle = rgba(PHOS, 0.9)
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(x, y, r + 5, 0, 7)
          ctx.stroke()
          ctx.lineWidth = 1
        }
        // label in the display face with a halo stroke
        const show = n.q || n.a > 0 || S.hover === i || S.focus === i || (!dense && i % 2 === 0)
        if (show) {
          const sz = (n.q ? p.textLg : p.textMd) * (dense ? 0.85 : 1)
          ctx.font = `italic ${sz}px ${p.fontDisplay}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          const al = n.q ? 1 : 0.35 + n.a * 0.65 + (S.hover === i ? 0.4 : 0)
          ctx.lineWidth = 4
          ctx.lineJoin = 'round'
          ctx.strokeStyle = rgba(p.ink, 0.85)
          ctx.strokeText(n.w, x, y - r - 5)
          ctx.fillStyle = rgba(n.q || n.a > 0 ? mix(ALAB, AMBER, n.q ? 0.9 : n.a) : ALAB, Math.min(1, al))
          ctx.fillText(n.w, x, y - r - 5)
          ctx.lineWidth = 1
        }
      })
    },
    [W, H, p],
  )

  // pointer + keyboard interaction
  useEffect(() => {
    const cv = canvas.current
    if (!cv) return undefined
    const px = (n) => [p.textLg * 3 + n.x * (W - p.textLg * 6), p.textLg * 3.5 + n.y * (H - p.textLg * 7.5)]
    const hit = (ev) => {
      const r = cv.getBoundingClientRect()
      const mx = ev.clientX - r.left
      const my = ev.clientY - r.top
      let best = -1
      let bd = 22
      graph.nodes.forEach((n, i) => {
        const [x, y] = px(n)
        const d = Math.hypot(x - mx, y - my)
        if (d < bd) {
          bd = d
          best = i
        }
      })
      return best
    }
    const onMove = (e) => {
      st.current.hover = hit(e)
      cv.style.cursor = st.current.hover >= 0 ? 'pointer' : 'default'
      if (reduced) redraw()
    }
    const onClick = (e) => {
      const i = hit(e)
      if (i < 0) return
      fire(i, 0, performance.now())
      if (reduced) redraw()
    }
    const onKey = (e) => {
      const N = graph.nodes.length
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        st.current.focus = (st.current.focus + 1 + N) % N
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        st.current.focus = (st.current.focus - 1 + N) % N
      } else if ((e.key === 'Enter' || e.key === ' ') && st.current.focus >= 0) {
        fire(st.current.focus, 0, performance.now())
      } else return
      e.preventDefault()
      if (reduced) redraw()
    }
    const onBlur = () => {
      st.current.focus = -1
      if (reduced) redraw()
    }
    cv.addEventListener('mousemove', onMove)
    cv.addEventListener('click', onClick)
    cv.addEventListener('keydown', onKey)
    cv.addEventListener('blur', onBlur)
    return () => {
      cv.removeEventListener('mousemove', onMove)
      cv.removeEventListener('click', onClick)
      cv.removeEventListener('keydown', onKey)
      cv.removeEventListener('blur', onBlur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [W, H, p, reduced, redraw])

  return (
    <div className={s.lens}>
      <div ref={wrap} className={s.stage}>
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label="Space lens: thirty-five words as glowing points joined by filaments. Click or press Enter on a word to fire it; activation spreads along the filaments."
        />
      </div>
      <p className={s.hint}>click a word to fire it · arrows + enter from the keyboard · query words fire every 8 beats</p>
      <p className={ui.caption}>
        <em>Fake:</em> the positions (hand-placed into four clusters) and therefore the neighbour filaments.{' '}
        <em>Real:</em> k=3 nearest-neighbour wiring, activation spreading one hop per half beat and fading over three
        beats, pulses on the edges, labels with a halo, colour from the tokens.
      </p>
    </div>
  )
}
