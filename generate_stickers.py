from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

stickers = {
    'butterfly.png': ('butterfly', '#ff9ef5'),
    'castle.png': ('castle', '#8cb4ff'),
    'cat.png': ('cat', '#ffcc66'),
    'unicorn.png': ('unicorn', '#dd99ff'),
    'rainbow.png': ('rainbow', '#ffdd66'),
    'princess.png': ('princess', '#ff99cc'),
}

try:
    font = ImageFont.truetype('arial.ttf', 24)
except Exception:
    font = ImageFont.load_default()

for filename, (label, color) in stickers.items():
    img = Image.new('RGBA', (160, 160), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, 159, 159), radius=28, fill=(255, 255, 255, 255), outline=color, width=6)
    draw.ellipse((30, 30, 72, 72), fill=color)
    draw.ellipse((88, 30, 130, 72), fill=color)
    draw.text((20, 90), label[:6], fill='#333', font=font)
    img.save(filename)
    print(filename, Path(filename).stat().st_size)
