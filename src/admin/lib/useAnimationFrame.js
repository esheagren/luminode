import { useEffect, useRef, useState, useCallback } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Time-based rAF loop. draw(t, dt, now) receives elapsed ms since the loop started.
// Under prefers-reduced-motion the loop does not run; one static frame is drawn instead,
// and again whenever redraw() is called, `deps` change, or the web fonts finish loading.
// The loop reads the latest draw through drawRef, so `deps` never restart it.
export function useAnimationFrame(draw, deps = []) {
  const drawRef = useRef(draw)
  drawRef.current = draw
  const reduced = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)
  const redraw = useCallback(() => setTick((n) => n + 1), [])

  // static frame
  useEffect(() => {
    if (reduced) drawRef.current(0, 0, performance.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, tick, ...deps])

  // loop; t and dt count from the first frame's timestamp so neither is ever negative
  useEffect(() => {
    if (reduced) return undefined
    let id = 0
    let t0 = -1
    let last = 0
    const loop = (now) => {
      if (t0 < 0) {
        t0 = now
        last = now
      }
      drawRef.current(now - t0, now - last, now)
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [reduced])

  // a static frame drawn before the web fonts arrived used the fallback faces; draw it again
  useEffect(() => {
    let alive = true
    document.fonts?.ready?.then(() => {
      if (alive) redraw()
    })
    return () => {
      alive = false
    }
  }, [redraw])

  return { reduced, redraw }
}
