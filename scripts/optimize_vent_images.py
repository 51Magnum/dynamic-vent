"""Generate shop previews from original vent PNGs. Run with Python + Pillow."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "vents"
SIZES = ("4x8", "4x10", "4x12", "4x14", "6x10", "6x12", "6x14")
PATTERNS = ("Chevron", "HappyHoliday", "RecPatter-1", "Round-1", "Round-2", "Round-3", "Square-1", "Square-2", "Square-3")


def main():
    original_bytes = 0
    generated_bytes = {"previews": 0, "thumbnails": 0}
    for size in SIZES:
        for pattern in PATTERNS:
            source = ROOT / size / f"{size}_{pattern}.png"
            original_bytes += source.stat().st_size
            with Image.open(source) as image:
                for folder, edge in (("previews", 960), ("thumbnails", 240)):
                    target = ROOT / folder / size / f"{size}_{pattern}.webp"
                    target.parent.mkdir(parents=True, exist_ok=True)
                    resized = image.copy()
                    resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
                    resized.save(target, "WEBP", quality=85, method=6)
                    generated_bytes[folder] += target.stat().st_size
    print(f"Original images: {original_bytes:,} bytes")
    for folder, total in generated_bytes.items():
        print(f"{folder}: {total:,} bytes ({100 * (1 - total / original_bytes):.1f}% smaller)")


if __name__ == "__main__":
    main()
