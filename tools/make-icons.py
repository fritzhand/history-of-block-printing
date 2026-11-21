#!/usr/bin/env python3
"""
make-icons.py — favicon, touch icon and the 1200x630 share card.

    python3 tools/make-icons.py

The mark is a printing block: a madder-red square with a trefoil (three round lobes, a dot
in each) cut into it. The share card is the hero poster with the title laid over a gradient.
Needs Pillow. Fonts are taken from the system; falls back to Pillow's default.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda *p: os.path.join(ROOT, 'assets', *p)
MADDER = (178, 65, 46); CREAM = (243, 234, 214); NIGHT = (14, 16, 25)


def mark(size):
    s = size * 4
    im = Image.new('RGBA', (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([s * 0.04, s * 0.04, s * 0.96, s * 0.96], radius=s * 0.11, fill=MADDER)
    r = s * 0.162
    for cx, cy in ((0.5, 0.36), (0.363, 0.60), (0.637, 0.60)):
        x, y = s * cx, s * cy
        d.ellipse([x - r, y - r, x + r, y + r], outline=CREAM, width=max(2, int(s * 0.044)))
        q = s * 0.04
        d.ellipse([x - q, y - q, x + q, y + q], fill=CREAM)
    return im.resize((size, size), Image.LANCZOS)


def font(names, size):
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    mark(32).save(A('favicon-32.png'))
    mark(180).save(A('apple-touch-icon.png'))
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1.5" y="1.5" width="29" height="29" rx="3.5" fill="#b2412e"/>
<g fill="none" stroke="#f3ead6" stroke-width="1.5"><circle cx="16" cy="11.5" r="5.2"/><circle cx="11.6" cy="19.2" r="5.2"/><circle cx="20.4" cy="19.2" r="5.2"/></g>
<g fill="#f3ead6"><circle cx="16" cy="11.5" r="1.3"/><circle cx="11.6" cy="19.2" r="1.3"/><circle cx="20.4" cy="19.2" r="1.3"/></g></svg>'''
    open(A('favicon.svg'), 'w').write(svg)
    # share card
    W, H = 1200, 630
    poster = Image.open(A('video', 'hero-poster.jpg')).convert('RGB')
    sc = 0.86 * W / poster.width
    poster = poster.resize((int(poster.width * sc), int(poster.height * sc)), Image.LANCZOS)
    NIGHT_BG = poster.getpixel((4, 4))
    card = Image.new('RGB', (W, H), NIGHT_BG)
    card.paste(poster, (W - poster.width + 20, H - poster.height + 8))
    g = Image.new('L', (W, H))
    gd = ImageDraw.Draw(g)
    for x in range(W):
        gd.line([(x, 0), (x, H)], fill=int(235 * max(0.0, 1 - x / (W * 0.72))))
    card = Image.composite(Image.new('RGB', (W, H), NIGHT_BG), card, g)
    d = ImageDraw.Draw(card)
    serif = ['/System/Library/Fonts/Supplemental/Georgia Bold.ttf', '/System/Library/Fonts/Supplemental/Georgia.ttf', '/Library/Fonts/Georgia.ttf']
    sans = ['/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Helvetica.ttc']
    d.text((64, 92), 'AN OPEN-DATA HISTORY OF BLOCK PRINTING', font=font(sans, 20), fill=(217, 107, 82))
    d.text((64, 150), 'The Repeating', font=font(serif, 86), fill=(246, 239, 224))
    d.text((64, 250), 'Hand', font=font(serif, 86), fill=(246, 239, 224))
    d.text((64, 384), 'Was the Priest-King\u2019s', font=font(serif, 40), fill=(236, 232, 221))
    d.text((64, 432), 'carved cloak printed?', font=font(serif, 40), fill=(240, 138, 112))
    d.text((64, 496), 'Evidenced, reported, not found, imagined.', font=font(sans, 22), fill=(170, 167, 157))
    card.paste(mark(56), (64, 556), mark(56))
    card.save(A('og-image.png'), optimize=True)
    print('icons and share card written')


if __name__ == '__main__':
    main()
