"""montage.py DIR out.png [names...] — tile preview renders side by side."""
import sys
from PIL import Image
d, out = sys.argv[1], sys.argv[2]
names = sys.argv[3:] or ['front', 'three', 'side', 'back']
ims = [Image.open(f'{d}/{n}.png').convert('RGB') for n in names]
w, h = ims[0].size
sheet = Image.new('RGB', (w * len(ims), h))
for i, im in enumerate(ims):
    sheet.paste(im, (i * w, 0))
sheet.save(out)
print(out, sheet.size)
