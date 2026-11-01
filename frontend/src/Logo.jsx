import { useEffect, useRef } from 'react'
import POLYS from './logo-polys.json'

// Animated ET mark, ported from resources/eubank-et-glitch.html: wavy letterforms,
// breathing coral/teal shadows. Hovering amps up the distortion and triggers glitch jumps.
const wave = (t, k) =>
  POLYS.map(
    (pl) =>
      pl
        .map(([x, y], i) => {
          const nx = x + k * (4.5 * Math.sin(y / 62 + 0.9 + t * 0.9) + 2 * Math.sin(y / 23 + x / 90 + t * 1.3))
          const ny = y + k * 2.5 * Math.sin(x / 75 + 0.4 + t * 0.7)
          return `${i ? 'L' : 'M'}${nx.toFixed(1)} ${ny.toFixed(1)}`
        })
        .join('') + 'Z',
  ).join('')

export default function Logo() {
  const el = useRef(null)

  useEffect(() => {
    const [shape, coral, teal, main] = ['shape', 'coral', 'teal', 'main'].map((id) => el.current.querySelector(`#et-${id}`))
    const move = (node, x, y) => node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`)
    const draw = (t, k = 1) => shape.setAttribute('d', wave(t, k))
    draw(0)
    move(coral, -11, 5)
    move(teal, 11, -5)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0, glitchUntil = 0, nextGlitch = 0, hovered = false, h = 0 // h: eased hover amount, 0..1
    let gj = [0, 0, 0, 0, 0, 0]
    const start = performance.now()
    const svg = el.current
    const over = () => { hovered = true }
    const out = () => { hovered = false }
    svg.addEventListener('pointerenter', over)
    svg.addEventListener('pointerleave', out)
    const frame = (now) => {
      const t = (now - start) / 1000
      h += ((hovered ? 1 : 0) - h) * 0.12
      draw(t, 1 + 2.5 * h)
      const breathe = 2 * Math.sin(t * 1.1)
      let [cx, cy, tx, ty, mx, my] = [-11 - breathe, 5, 11 + breathe, -5, 0, 0]
      if (hovered && now >= nextGlitch && now > glitchUntil) {
        glitchUntil = now + 80 + Math.random() * 120
        nextGlitch = now + 150 + Math.random() * 350
        gj = gj.map(() => (Math.random() - 0.5) * 2)
      }
      if (now < glitchUntil) {
        cx += gj[0] * 28; cy += gj[1] * 10
        tx += gj[2] * 28; ty += gj[3] * 10
        mx = gj[4] * 6; my = gj[5] * 2.5
      }
      move(coral, cx, cy); move(teal, tx, ty); move(main, mx, my)
      raf = requestAnimationFrame(frame)
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(frame)
    }
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      svg.removeEventListener('pointerenter', over)
      svg.removeEventListener('pointerleave', out)
    }
  }, [])

  return (
    <svg ref={el} viewBox="170 105 480 310" role="img" aria-label="Eubank Technologies" style={{ overflow: 'visible' }}>
      <defs><path id="et-shape" d="" /></defs>
      <use id="et-coral" href="#et-shape" fill="var(--color-coral)" />
      <use id="et-teal" href="#et-shape" fill="var(--color-teal)" />
      <use id="et-main" href="#et-shape" fill="var(--text)" />
    </svg>
  )
}
