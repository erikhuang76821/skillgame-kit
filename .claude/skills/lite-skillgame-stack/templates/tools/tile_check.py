#!/usr/bin/env python3
"""Acceptance check for generated ground-material tiles (knowledge-base/11 ⑤). Needs Pillow.

  python tools/tile_check.py art/tiles/moss.png [more.png ...] [--luma 0.10,0.45] [--sat-max 0.35]
        [--reserved 0-30,330-360] [--preview out_dir]

Per tile:
  seam     wrap-around edge difference vs. the tile's own neighbour-pixel difference (<= 1.5 passes:
           the seam is no stronger than ordinary texture). Checked both ways (left|right, top|bottom).
  luma     mean relative luminance in the allowed band (ground stays in the background)
  sat      95th-percentile HSV saturation <= --sat-max
  reserved share of saturated pixels whose hue falls in a reserved range (danger / pickup colours) < 1%
  alpha    fully opaque
--preview writes <name>_2x2.png (tile repeated 2x2) and <name>_offset.png (shifted by half: seams
show up as a cross in the middle) for a human look.
Exit code 1 when any tile fails.
"""
import argparse, colorsys, sys
from pathlib import Path
from PIL import Image, ImageChops


def mean_abs(a, b):
    d = ImageChops.difference(a, b).convert("L")
    return sum(i * n for i, n in enumerate(d.histogram())) / (d.width * d.height)


def seam_ratio(img):
    w, h = img.size
    inner_x = mean_abs(img.crop((0, 0, w - 1, h)), img.crop((1, 0, w, h)))
    inner_y = mean_abs(img.crop((0, 0, w, h - 1)), img.crop((0, 1, w, h)))
    seam_x = mean_abs(img.crop((w - 1, 0, w, h)), img.crop((0, 0, 1, h)))
    seam_y = mean_abs(img.crop((0, h - 1, w, h)), img.crop((0, 0, w, 1)))
    return max(seam_x / max(inner_x, 0.5), seam_y / max(inner_y, 0.5))


def stats(img, reserved):
    px = list(img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata())
    lum, sats, hits = 0.0, [], 0
    for r, g, b in px:
        lum += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        sats.append(s)
        if s > 0.25 and v > 0.15:
            if any(lo <= h * 360 <= hi for lo, hi in reserved):
                hits += 1
    sats.sort()
    return lum / len(px), sats[int(len(sats) * 0.95) - 1], hits / len(px)


def ranges(text):
    return [tuple(float(v) for v in part.split("-")) for part in text.split(",") if part]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tiles", nargs="+")
    ap.add_argument("--luma", default="0.05,0.50")
    ap.add_argument("--sat-max", type=float, default=0.35)
    ap.add_argument("--reserved", default="")
    ap.add_argument("--seam-max", type=float, default=1.5)
    ap.add_argument("--preview")
    a = ap.parse_args()
    lo, hi = (float(v) for v in a.luma.split(","))
    reserved = ranges(a.reserved)
    failed = False
    for path in map(Path, a.tiles):
        src = Image.open(path)
        opaque = src.mode not in ("RGBA", "LA") or src.getchannel("A").getextrema()[0] == 255
        img = src.convert("RGB")
        seam = seam_ratio(img)
        luma, sat, res = stats(img, reserved)
        checks = {
            "seam": (seam <= a.seam_max, f"{seam:.2f}"),
            "luma": (lo <= luma <= hi, f"{luma:.3f}"),
            "sat": (sat <= a.sat_max, f"{sat:.2f}"),
            "reserved": (res < 0.01, f"{res:.1%}"),
            "alpha": (opaque, "opaque" if opaque else "has transparency"),
        }
        ok = all(c[0] for c in checks.values())
        failed |= not ok
        print(f"{'PASS' if ok else 'FAIL'} {path.name}: " + "  ".join(f"{k}={'ok' if c[0] else 'X'}:{c[1]}" for k, c in checks.items()))
        if a.preview:
            out = Path(a.preview); out.mkdir(parents=True, exist_ok=True)
            w, h = img.size
            grid = Image.new("RGB", (w * 2, h * 2))
            for dx in (0, w):
                for dy in (0, h):
                    grid.paste(img, (dx, dy))
            grid.save(out / f"{path.stem}_2x2.png")
            ImageChops.offset(img, w // 2, h // 2).save(out / f"{path.stem}_offset.png")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
