"""Genererer PWA-ikonene i public/icons. Kjøres manuelt (python3 + Pillow); PNG-ene er sjekket inn.

Bruk: python3 scripts/generate-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BG = "#0E0D0C"  # Jøkuls mørke sidefarge
FG = "#F3F0ED"  # Jøkuls lyse sidefarge
ACCENT = "#FFB020"
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"


def icon(size: int, scale: float) -> Image.Image:
    """scale = andel av flaten teksten får. Maskable-ikoner trenger trygg sone (~0.6)."""
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, int(size * scale))
    box = draw.textbbox((0, 0), "fg", font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    x = (size - w) / 2 - box[0]
    y = (size - h) / 2 - box[1] - size * 0.02
    draw.text((x, y), "fg", font=font, fill=FG)
    # Prikk under teksten som aksent.
    r = size * scale * 0.07
    cx, cy = size / 2, y + box[3] + size * scale * 0.18
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ACCENT)
    return img


OUT.mkdir(parents=True, exist_ok=True)
icon(192, 0.46).save(OUT / "icon-192.png", optimize=True)
icon(512, 0.46).save(OUT / "icon-512.png", optimize=True)
icon(512, 0.34).save(OUT / "maskable-512.png", optimize=True)
icon(180, 0.40).save(OUT / "apple-touch-icon.png", optimize=True)
