import { useEffect, useRef, useState } from 'react'
import { readPalette, useTokenVersion } from './tokens.js'

// Sizes a canvas to its container's CSS rect at devicePixelRatio and keeps it sized on resize.
// Returns the live {w, h} in CSS pixels; the 2D context is pre-transformed by dpr.
export function useCanvasSize(containerRef, canvasRef) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = containerRef.current
    const cv = canvasRef.current
    if (!el || !cv) return undefined
    let applied = { w: 0, h: 0, dpr: 0 }
    const apply = () => {
      const r = el.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      // assigning cv.width clears the bitmap, so skip when nothing changed (ResizeObserver fires once on observe)
      if (w === applied.w && h === applied.h && dpr === applied.dpr) return
      applied = { w, h, dpr }
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      cv.style.width = `${w}px`
      cv.style.height = `${h}px`
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
      setSize({ w, h })
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef, canvasRef])
  return size
}

// Palette and tempo read from the tokens, re-read whenever a dial writes a token.
export function usePalette() {
  const version = useTokenVersion()
  const ref = useRef(null)
  const verRef = useRef(-1)
  if (verRef.current !== version || !ref.current) {
    ref.current = readPalette()
    verRef.current = version
  }
  return ref.current
}
