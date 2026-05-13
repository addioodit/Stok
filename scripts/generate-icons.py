#!/usr/bin/env python3
"""Generate Stok app icons + splash assets from a single design.

Run: python3 scripts/generate-icons.py

Produces:
  assets/icon.png            1024x1024  iOS / generic icon (filled bg)
  assets/adaptive-icon.png   1024x1024  Android adaptive foreground (transparent)
  assets/splash-icon.png     1024x1024  Splash logo (transparent, ~50% of canvas)
  assets/favicon.png          192x 192  Web favicon
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, "..", "assets"))
os.makedirs(ASSETS, exist_ok=True)

BRAND = (31, 111, 235, 255)
WHITE = (255, 255, 255, 255)
GREEN = (52, 211, 110, 255)
TRANSPARENT = (0, 0, 0, 0)

FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"


def draw_logo(img: Image.Image, *, scale: float, accent: bool) -> None:
    """Draw the Stok mark centered, scaled to `scale` of canvas size."""
    w, h = img.size
    draw = ImageDraw.Draw(img)

    cx, cy = w // 2, h // 2
    font_px = int(w * 0.62 * scale)
    font = ImageFont.truetype(FONT_PATH, font_px)
    # Tiny upward nudge so the S sits visually centered with the accent line.
    draw.text(
        (cx, cy - int(h * 0.015 * scale)),
        "S",
        font=font,
        fill=WHITE,
        anchor="mm",
    )

    if accent:
        line_w = max(4, int(w * 0.018 * scale))
        # Anchor: bottom-right of the scaled area.
        right = cx + int(w * 0.30 * scale)
        bottom = cy + int(h * 0.30 * scale)
        span = int(w * 0.30 * scale)
        pts = [
            (right - span, bottom - int(span * 0.10)),
            (right - int(span * 0.66), bottom - int(span * 0.40)),
            (right - int(span * 0.33), bottom - int(span * 0.20)),
            (right, bottom - int(span * 0.65)),
        ]
        draw.line(pts, fill=GREEN, width=line_w, joint="curve")
        # Dot at the rising end.
        r = line_w
        draw.ellipse(
            (right - r, bottom - int(span * 0.65) - r, right + r, bottom - int(span * 0.65) + r),
            fill=GREEN,
        )


def make_icon(path: str, size: int = 1024) -> None:
    img = Image.new("RGBA", (size, size), BRAND)
    draw_logo(img, scale=1.0, accent=True)
    img.save(path)


def make_adaptive_icon(path: str, size: int = 1024) -> None:
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    # Android adaptive icon foreground gets cropped — keep content in safe zone (~66%).
    draw_logo(img, scale=0.66, accent=True)
    img.save(path)


def make_splash_icon(path: str, size: int = 1024) -> None:
    img = Image.new("RGBA", (size, size), TRANSPARENT)
    draw_logo(img, scale=0.45, accent=True)
    # Wordmark below.
    draw = ImageDraw.Draw(img)
    word_font = ImageFont.truetype(FONT_PATH, int(size * 0.085))
    draw.text(
        (size // 2, int(size * 0.74)),
        "Stok",
        font=word_font,
        fill=WHITE,
        anchor="mm",
    )
    sub_font = ImageFont.truetype(FONT_PATH, int(size * 0.035))
    draw.text(
        (size // 2, int(size * 0.80)),
        "Guyana Stock Exchange",
        font=sub_font,
        fill=(255, 255, 255, 200),
        anchor="mm",
    )
    img.save(path)


def make_favicon(path: str, size: int = 192) -> None:
    img = Image.new("RGBA", (size, size), BRAND)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, int(size * 0.66))
    draw.text((size // 2, size // 2), "S", font=font, fill=WHITE, anchor="mm")
    img.save(path)


def main() -> None:
    out = {
        "icon.png": make_icon,
        "adaptive-icon.png": make_adaptive_icon,
        "splash-icon.png": make_splash_icon,
        "favicon.png": make_favicon,
    }
    for name, fn in out.items():
        path = os.path.join(ASSETS, name)
        fn(path)
        print(f"  ✓ {name}  ({os.path.getsize(path)} bytes)")
    print(f"All assets written to {ASSETS}")


if __name__ == "__main__":
    main()
