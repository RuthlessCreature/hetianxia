import os
import random
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = "storage/uploads"
os.makedirs(OUTPUT_DIR, exist_ok=True)

W, H = 640, 480
NUM = 24

random.seed(42)

for i in range(NUM):
    img = Image.new("RGB", (W, H), (40, 44, 52))

    # Add surface texture (perlin-like noise with circles)
    for _ in range(200):
        x = random.randint(0, W)
        y = random.randint(0, H)
        r = random.randint(1, 3)
        c = random.randint(35, 60)
        ImageDraw.Draw(img).ellipse([x - r, y - r, x + r, y + r], fill=(c, c + 2, c + 4))

    # Add metal sheen (gradient)
    for x in range(0, W, 4):
        shade = random.randint(0, 15)
        ImageDraw.Draw(img).line([(x, 0), (x, H)], fill=(40 + shade, 44 + shade, 52 + shade), width=1)

    # Add crosshair/reference marks
    draw = ImageDraw.Draw(img)
    for cx, cy in [(80, 80), (560, 80), (80, 400), (560, 400)]:
        draw.line([(cx - 15, cy), (cx + 15, cy)], fill=(200, 200, 200), width=1)
        draw.line([(cx, cy - 15), (cx, cy + 15)], fill=(200, 200, 200), width=1)

    is_defective = i % 3 != 0  # 2/3 have defects

    if is_defective:
        defect_type = random.choice(["scratch", "dent", "stain", "crack"])
        defect_count = random.randint(1, 3)

        for _ in range(defect_count):
            dx = random.randint(100, 540)
            dy = random.randint(60, 420)

            if defect_type == "scratch":
                # Thin line scratch
                length = random.randint(30, 120)
                angle = random.uniform(0, 3.14)
                ex = dx + int(length * random.choice([1, -1]))
                ey = dy + int(length * random.uniform(-0.5, 0.5))
                draw.line([(dx, dy), (ex, ey)], fill=(220, 220, 220), width=random.randint(1, 2))

            elif defect_type == "dent":
                # Small dark circle dent
                r = random.randint(8, 25)
                draw.ellipse([dx - r, dy - r, dx + r, dy + r], fill=(20, 20, 25), outline=(50, 50, 55))

            elif defect_type == "stain":
                # Irregular stain (multiple overlapping circles)
                for _ in range(random.randint(3, 8)):
                    sx = dx + random.randint(-20, 20)
                    sy = dy + random.randint(-20, 20)
                    sr = random.randint(10, 30)
                    sc = random.randint(60, 120)
                    draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr],
                                 fill=(sc, sc + random.randint(-10, 10), sc + random.randint(-5, 5)),
                                 outline=None)

            elif defect_type == "crack":
                # Jagged crack line
                points = [(dx, dy)]
                cx, cy = dx, dy
                for _ in range(random.randint(3, 7)):
                    cx += random.randint(-25, 25)
                    cy += random.randint(10, 30)
                    points.append((cx, cy))
                draw.line(points, fill=(200, 200, 200), width=1)

            # Add additional random defects of other types for variety
            if random.random() < 0.3:
                r2 = random.randint(6, 15)
                draw.ellipse([dx + 40 - r2, dy + 20 - r2, dx + 40 + r2, dy + 20 + r2],
                             fill=(25, 25, 30), outline=(55, 55, 60))

    filename = f"aoi_test_{i:03d}.jpg"
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, "JPEG", quality=90)
    print(f"Generated: {filepath} ({'NG' if is_defective else 'OK'})")

print(f"\nDone! {NUM} test images in {OUTPUT_DIR}")
