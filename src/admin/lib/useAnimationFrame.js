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
// and again whenever redraw() is called or `deps` change.
export function useAnimationFrame(draw, deps = []) {
  const drawRef = useRef(draw)
  drawRef.current = draw
  const reduced = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)
  const redraw = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    if (reduced) {
      drawRef.current(0, 0, performance.now())
      return undefined
    }
    let id = 0
    const t0 = performance.now()
    let last = t0
    const loop = (now) => {
      drawRef.current(now - t0, now - last, now)
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, tick, ...deps])

  return { reduced, redraw }
}
