import { useEffect, useRef } from 'react'
import { contours } from 'd3-contour'

// Live topographic background: fetches AWS Terrain Tiles (Terrarium encoding), builds contour
// lines in the browser and draws them on a canvas, fading the levels in from low to high.
const LAT = 38.1834, LON = -83.4327, Z = 11 // Morehead, KY
const TILES = 2, SIZE = TILES * 256
const tileUrl = (x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`

const loadTile = (x, y) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // the tile bucket sends CORS headers, needed to read pixels
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = tileUrl(x, y)
  })

async function elevation() {
  const n = 2 ** Z
  const fx = ((LON + 180) / 360) * n
  const fy = ((1 - Math.asinh(Math.tan((LAT * Math.PI) / 180)) / Math.PI) / 2) * n
  const x0 = Math.round(fx) - TILES / 2, y0 = Math.round(fy) - TILES / 2
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  ctx.canvas.width = ctx.canvas.height = SIZE
  const jobs = []
  for (let i = 0; i < TILES; i++)
    for (let j = 0; j < TILES; j++) jobs.push(loadTile(x0 + i, y0 + j).then((img) => ctx.drawImage(img, i * 256, j * 256)))
  await Promise.all(jobs)
  const px = ctx.getImageData(0, 0, SIZE, SIZE).data
  const out = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < out.length; i++) out[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768
  return out
}

// Separable box blur, repeated: approximates the Gaussian the offline script uses.
function blur(a, r = 3, passes = 3) {
  const tmp = new Float32Array(a.length)
  const run = (src, dst, stride, lineStride) => {
    for (let l = 0; l < SIZE; l++) {
      let sum = 0
      const at = (k) => src[l * lineStride + Math.min(SIZE - 1, Math.max(0, k)) * stride]
      for (let k = -r; k <= r; k++) sum += at(k)
      for (let k = 0; k < SIZE; k++) {
        dst[l * lineStride + k * stride] = sum / (2 * r + 1)
        sum += at(k + r + 1) - at(k - r)
      }
    }
  }
  for (let p = 0; p < passes; p++) { run(a, tmp, 1, SIZE); run(tmp, a, SIZE, 1) }
  return a
}

function buildPaths() {
  return elevation().then((raw) => {
    const e = blur(raw)
    let lo = Infinity, hi = -Infinity
    for (const v of e) { if (v < lo) lo = v; if (v > hi) hi = v }
    const interval = [100, 50, 25, 20, 10, 5].find((i) => (hi - lo) / i >= 14) ?? 5
    const levels = []
    for (let l = Math.ceil(lo / interval) * interval; l < hi; l += interval) levels.push(l)
    // one Path2D per elevation level, low to high, so the intro can fade them in one after another
    const paths = contours().size([SIZE, SIZE]).thresholds(levels)(e).map(({ coordinates }) => {
      const path = new Path2D()
      for (const poly of coordinates)
        for (const ring of poly) {
          ring.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)))
          path.closePath()
        }
      return path
    })
    return paths
  })
}

export default function Topo() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let paths = null, progress = 0, cancelled = false // progress 0..1: the intro fades levels in from low to high
    const STAGGER = 4 // how many levels are mid-fade at once
    const draw = () => {
      if (!paths) return
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth, h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      const s = Math.max(w, h) / SIZE * 1.2 // cover the box, slightly zoomed
      ctx.setTransform(dpr * s, 0, 0, dpr * s, (dpr * (w - SIZE * s)) / 2, (dpr * (h - SIZE * s)) / 2)
      ctx.lineWidth = 1.25 / s
      ctx.lineJoin = 'round'
      paths.forEach((p, i) => {
        const a = Math.min(1, Math.max(0, (progress * (paths.length + STAGGER) - i) / STAGGER))
        ctx.strokeStyle = `rgba(255,255,255,${0.14 * a})`
        ctx.stroke(p)
      })
    }
    const intro = (t0) => {
      const step = (now) => {
        progress = Math.min(1, (now - t0) / 3000)
        draw()
        if (progress < 1 && !cancelled) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    buildPaths()
      .then((p) => {
        if (cancelled) return
        paths = p
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { progress = 1; draw() }
        else intro(performance.now())
      })
      .catch((err) => console.warn('topo: could not load terrain', err))
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => { cancelled = true; ro.disconnect() }
  }, [])

  return <canvas ref={ref} className="topo" aria-hidden="true" />
}
