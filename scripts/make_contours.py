"""Build a seamless contour-line SVG from real terrain (AWS Terrain Tiles, Terrarium encoding).

Usage: python scripts/make_contours.py LAT LON OUT.svg [ZOOM]
Needs: numpy, pillow, contourpy (dev-only, not required to run the site).
"""
import io
import math
import sys
import urllib.request

import numpy as np
from contourpy import contour_generator
from PIL import Image

SIZE = 500  # output square, px of terrain at the chosen zoom
URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"


def elevation(lat, lon, z):
    n = 2**z
    cx = (lon + 180) / 360 * n * 256
    cy = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n * 256
    x0, y0 = int(cx - SIZE / 2), int(cy - SIZE / 2)
    canvas = Image.new("RGB", (SIZE + 512, SIZE + 512))
    for tx in range(x0 // 256, (x0 + SIZE) // 256 + 1):
        for ty in range(y0 // 256, (y0 + SIZE) // 256 + 1):
            with urllib.request.urlopen(URL.format(z=z, x=tx, y=ty), timeout=30) as r:
                tile = Image.open(io.BytesIO(r.read())).convert("RGB")
            canvas.paste(tile, (tx * 256 - x0 // 256 * 256, ty * 256 - y0 // 256 * 256))
    ox, oy = x0 % 256, y0 % 256
    a = np.asarray(canvas.crop((ox, oy, ox + SIZE, oy + SIZE)), dtype=np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768


def blur(a, sigma=3):
    k = np.exp(-(np.arange(-3 * sigma, 3 * sigma + 1) ** 2) / (2 * sigma**2))
    k /= k.sum()
    for axis in (0, 1):
        a = np.apply_along_axis(lambda v: np.convolve(np.pad(v, len(k) // 2, mode="edge"), k, "valid"), axis, a)
    return a


def smooth_path(pts, step=8):
    closed = np.allclose(pts[0], pts[-1])
    kept = [pts[0]]
    for p in pts[1:-1]:
        if math.dist(p, kept[-1]) >= step:
            kept.append(p)
    kept.append(pts[-1])
    if closed:
        kept = kept[:-1]
    n = len(kept)
    if n < 4:
        return ""
    g = (lambda i: kept[i % n]) if closed else (lambda i: kept[max(0, min(n - 1, i))])
    d = f"M{g(0)[0]:.1f} {g(0)[1]:.1f}"
    for i in range(n if closed else n - 1):  # Catmull-Rom -> cubic Bezier
        p0, p1, p2, p3 = g(i - 1), g(i), g(i + 1), g(i + 2)
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}"
    return d + ("Z" if closed else "")


def main(lat, lon, out, z=11):
    elev = elevation(lat, lon, z)
    elev = blur(elev)
    lo, hi = float(elev.min()), float(elev.max())
    interval = next(i for i in (100, 50, 25, 20, 10, 5) if (hi - lo) / i >= 14)
    gen = contour_generator(z=elev)
    paths = []
    for level in np.arange(math.ceil(lo / interval) * interval, hi, interval):
        for line in gen.lines(level):
            if len(line) > 8 and (d := smooth_path(line)):
                paths.append(f'<path d="{d}"/>')
    print(f"relief {lo:.0f}-{hi:.0f} m, every {interval} m, {len(paths)} lines")
    body = "".join(paths)
    # 2x2 mirrored copies so the tile repeats with no seams
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{2*SIZE}" height="{2*SIZE}" viewBox="0 0 {2*SIZE} {2*SIZE}">'
        f'<defs><g id="c">{body}</g></defs>'
        '<g fill="none" stroke="#fff" stroke-opacity="0.06" stroke-width="1" stroke-linejoin="round">'
        '<use xlink:href="#c"/>'
        f'<use xlink:href="#c" transform="translate({2*SIZE} 0) scale(-1 1)"/>'
        f'<use xlink:href="#c" transform="translate(0 {2*SIZE}) scale(1 -1)"/>'
        f'<use xlink:href="#c" transform="translate({2*SIZE} {2*SIZE}) scale(-1 -1)"/>'
        "</g></svg>"
    )
    open(out, "w").write(svg)


if __name__ == "__main__":
    main(float(sys.argv[1]), float(sys.argv[2]), sys.argv[3], *map(int, sys.argv[4:5]))
