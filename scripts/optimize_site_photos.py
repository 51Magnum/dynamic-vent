"""Generate responsive display photos; keep originals for the zoom lightbox. Requires Pillow."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / "public"
for number in range(1, 16):
    source = ROOT / (f"gallery{number}-retouched.png" if number <= 4 else f"gallery{number}.jpg")
    for label, edge in ((("thumb", 640), ("large", 1600)) if number == 1 else (("thumb", 640),)):
        target = ROOT / "images" / "gallery" / f"{number}-{label}.webp"
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as image:
            image.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            image.save(target, "WEBP", quality=82, method=6)
for name in ("step1-align", "step2-remove", "step3-route", "step4-drop"):
    target = ROOT / "images" / "steps" / f"{name}.webp"
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(ROOT / f"{name}.jpg") as image:
        image.thumbnail((960, 960), Image.Resampling.LANCZOS)
        image.save(target, "WEBP", quality=82, method=6)
print("Generated optimized gallery and installation photos.")
