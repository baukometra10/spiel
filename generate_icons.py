import zlib
import struct
import math
import os


def write_png(path, width, height, pixels):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b''.join(b'\x00' + b''.join(row) for row in pixels)
    data = zlib.compress(raw, level=9)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)))
        f.write(chunk(b'IDAT', data))
        f.write(chunk(b'IEND', b''))


def rgba(r, g, b):
    return bytes((int(r) & 0xFF, int(g) & 0xFF, int(b) & 0xFF))


def clamp(x, a=0, b=255):
    return max(a, min(b, int(round(x))))


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(clamp(lerp(c1[i], c2[i], t)) for i in range(3))


colors = {
    'bg1': (255, 173, 204),
    'bg2': (255, 122, 194),
    'white': (255, 255, 255),
    'pink': (246, 75, 158),
    'yellow': (255, 222, 112),
    'blue': (114, 209, 255),
    'purple': (194, 84, 215),
}


def create_icon(size):
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            t = ((x + y) / (2 * size - 2))
            base = mix(colors['bg1'], colors['bg2'], t)
            cx = size * 0.45
            cy = size * 0.45
            dx = x - cx
            dy = y - cy
            dist = math.hypot(dx, dy)
            if dist < size * 0.35:
                inner_t = dist / (size * 0.35)
                fill = mix(colors['white'], colors['pink'], inner_t * 0.25)
            else:
                fill = base
            if math.hypot(x - size*0.36, y - size*0.28) < size*0.07:
                fill = colors['pink']
            if math.hypot(x - size*0.55, y - size*0.25) < size*0.055:
                fill = colors['yellow']
            if math.hypot(x - size*0.6, y - size*0.42) < size*0.06:
                fill = colors['blue']
            if math.hypot(x - size*0.42, y - size*0.55) < size*0.05:
                fill = colors['purple']
            if size*0.48 < x < size*0.65 and size*0.55 < y < size*0.75:
                handle_t = (x - size*0.48) / (size*0.17)
                fill = mix((235, 190, 245), (245, 150, 225), handle_t)
            if size*0.4 < x < size*0.7 and size*0.5 < y < size*0.6 and x + y > size*1.0:
                fill = colors['white']
            row.append(rgba(*fill))
        pixels.append(row)
    return pixels


os.makedirs('icons', exist_ok=True)
for size in (192, 512):
    path = os.path.join('icons', f'icon-{size}.png')
    print('writing', path)
    pixels = create_icon(size)
    write_png(path, size, size, pixels)
