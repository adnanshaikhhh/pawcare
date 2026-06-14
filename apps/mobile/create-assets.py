"""Generate placeholder PNG assets for the Expo mobile app."""
import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets', exist_ok=True)

# Brand colors
CORAL = (255, 107, 107)
CREAM = (250, 250, 250)

def make_icon(size, name, bg=CORAL, fg=CREAM, with_emoji=True):
    img = Image.new('RGBA', (size, size), bg + (255,))
    draw = ImageDraw.Draw(img)
    # Draw a rounded coral square with a paw
    margin = size // 16
    # Background gradient effect: a slightly lighter top
    for y in range(size):
        ratio = y / size
        r = int(bg[0] * (1 - ratio * 0.15))
        g = int(bg[1] * (1 - ratio * 0.15))
        b = int(bg[2] * (1 - ratio * 0.15))
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    # Draw a paw print shape (simplified) in the center
    cx, cy = size // 2, size // 2
    pad_size = size // 4
    if with_emoji:
        # Try to find an emoji-supporting font, fallback to a circle
        try:
            font = ImageFont.truetype('seguiemj.ttf', size // 3)
        except (OSError, IOError):
            try:
                font = ImageFont.truetype('C:\\Windows\\Fonts\\seguiemj.ttf', size // 3)
            except (OSError, IOError):
                try:
                    font = ImageFont.truetype('C:\\Windows\\Fonts\\arial.ttf', size // 2)
                except (OSError, IOError):
                    font = ImageFont.load_default()
        try:
            draw.text((cx, cy), '\U0001F43E', fill=fg, font=font, anchor='mm', embedded_color=True)
        except (TypeError, ValueError):
            # Fallback: draw a stylized paw
            pad = size // 8
            # Big pad
            draw.ellipse([cx - pad, cy + pad // 2, cx + pad, cy + pad * 2], fill=fg)
            # Toes
            for angle in [-60, -30, 30, 60]:
                import math
                rad = math.radians(angle)
                tx = cx + int(math.cos(rad) * size // 4)
                ty = cy - int(math.sin(rad) * size // 6) - pad // 2
                toe = pad // 2
                draw.ellipse([tx - toe, ty - toe, tx + toe, ty + toe], fill=fg)
    out = f'assets/{name}'
    img.save(out, 'PNG')
    print(f'Created {out} ({size}x{size})')

# Standard Expo icon sizes
make_icon(1024, 'icon.png', bg=CORAL)
make_icon(1024, 'adaptive-icon.png', bg=CORAL)
make_icon(1024, 'splash.png', bg=CREAM, fg=CORAL, with_emoji=True)
make_icon(196, 'favicon.png', bg=CORAL)

# Also create notification icon
make_icon(96, 'notification-icon.png', bg=CORAL)

print('\nAll assets created.')
