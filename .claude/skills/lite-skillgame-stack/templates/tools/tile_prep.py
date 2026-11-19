#!/usr/bin/env python3
"""Post-process a generated ground texture into a game tile (knowledge-base/11 §3.2). Needs Pillow.

  python tools/tile_prep.py raw.png out.png [--size 128] [--colors 8] [--luma 0.10,0.30] [--sat-max 0.30]
        [--band 0.25] [--seed 1]

Steps (each one fixes a failure the generator commonly makes):
  1. centre-crop to a square, box-downscale to --size art px (the generator draws "pixels" as blocks)
  2. make it wrap: blend the image with its half-offset copy, using the offset copy near the borders
     (its edges already wrap) and the original in the middle; the blend is a per-pixel dithered pick,
     not an alpha fade, so pixel art stays crisp
  3. pull mean luminance into --luma and cap saturation at --sat-max (ground stays in the background)
  4. quantise to --colors without dithering (hard pixel clusters, small PNG)
Then runs the same checks as tools/tile_check.py and exits 1 if they fail.
"""
import argparse, colorsys, hashlib, sys
from pathlib import Path
from PIL import Image, ImageChops

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tile_check  # noqa: E402


def wrap_blend(img, band, seed):
    w, h = img.size
    off = ImageChops.offset(img, w // 2, h // 2)
    a, b = img.load(), off.load()
    out = Image.new("RGB", (w, h))
    o = out.load()
    bw, bh = max(1, int(w * band)), max(1, int(h * band))
    for y in range(h):
        for x in range(w):
            ex = max(0.0, 1 - min(x, w - 1 - x) / bw)      # 1 at the border, 0 beyond the band
            ey = max(0.0, 1 - min(y, h - 1 - y) / bh)
            m = max(ex, ey)
            r = int.from_bytes(hashlib.blake2b(f"{seed},{x},{y}".encode(), digest_size=2).digest(), "big") / 65535
            o[x, y] = b[x, y] if r < m else a[x, y]
    return out


def tone(img, lo, hi, sat_max):
    px = list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata())
    luma = sum(0.2126 * r + 0.7152 * g + 0.0722 * b for r, g, b in px) / (255 * len(px))
    k = 1.0 if lo <= luma <= hi else (lo if luma < lo else hi) / max(luma, 1e-6)
    out = []
    for r, g, b in px:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        s = min(s, sat_max)
        v = min(1.0, v * k)
        out.append(tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, s, v)))
    res = Image.new("RGB", img.size)
    res.putdata(out)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("raw"); ap.add_argument("out")
    ap.add_argument("--size", type=int, default=128)
    ap.add_argument("--colors", type=int, default=8)
    ap.add_argument("--luma", default="0.10,0.30")
    ap.add_argument("--sat-max", type=float, default=0.30)
    ap.add_argument("--band", type=float, default=0.25)
    ap.add_argument("--seed", type=int, default=1)
    a = ap.parse_args()
    lo, hi = (float(v) for v in a.luma.split(","))

    img = Image.open(a.raw).convert("RGB")
    s = min(img.size)
    img = img.crop(((img.width - s) // 2, (img.height - s) // 2, (img.width + s) // 2, (img.height + s) // 2))
    img = img.resize((a.size, a.size), Image.Resampling.BOX)
    before = tile_check.seam_ratio(img)
    img = wrap_blend(img, a.band, a.seed)
    img = tone(img, lo, hi, a.sat_max)
    img = img.quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    img.save(a.out, optimize=True)

    seam = tile_check.seam_ratio(img)
    luma, sat, _ = tile_check.stats(img, [])
    ok = seam <= 1.5 and lo - 0.02 <= luma <= hi + 0.02 and sat <= a.sat_max + 0.02
    print(f"{'PASS' if ok else 'FAIL'} {Path(a.out).name}: seam {before:.2f} -> {seam:.2f}  luma {luma:.3f}  sat95 {sat:.2f}  "
          f"{a.size}x{a.size} {a.colors} colours  {Path(a.out).stat().st_size} B")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
