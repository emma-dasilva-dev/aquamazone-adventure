#!/usr/bin/env python3
"""Convert the latest uploaded Aquamazone PNG (misnamed .ico) to a real ICO.

Run from the repository root: python3 scripts/generate_favicon.py
Requires Pillow: sudo apt install python3-pil
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = root / "public" / "favicon.ico"
destination = root / "public" / "aquamazone-tab-v4.ico"
layout = root / "app" / "layout.tsx"

if not source.is_file():
    raise SystemExit("Missing source image: public/favicon.ico")

with Image.open(source) as raw:
    if raw.format not in ("PNG", "JPEG", "WEBP", "ICO"):
        raise SystemExit(f"Unsupported image type: {raw.format}")
    image = raw.convert("RGBA")
    # Center image on a square transparent canvas without cropping the logo.
    width, height = image.size
    side = max(width, height)
    square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    square.paste(image, ((side - width) // 2, (side - height) // 2))
    square.thumbnail((256, 256), Image.Resampling.LANCZOS)
    square.save(
        destination,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

# Validate the generated file before changing the website configuration.
with Image.open(destination) as checked:
    if checked.format != "ICO":
        raise SystemExit("Generated favicon failed ICO validation")

content = layout.read_text(encoding="utf-8")
old = "/aquamazone-tab-v3.ico"
if old not in content and "/aquamazone-tab-v4.ico" not in content:
    raise SystemExit("Could not find expected favicon metadata; leaving layout unchanged")
content = content.replace(old, "/aquamazone-tab-v4.ico")
layout.write_text(content, encoding="utf-8")
print(f"Created {destination.relative_to(root)} and updated app/layout.tsx")
