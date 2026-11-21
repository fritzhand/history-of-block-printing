"""
make_textures.py — tileable texture maps for the Priest-King pages and for anyone
re-skinning the model. Everything is generated (no photographs), from the same trefoil
geometry the 3D model carries (pk_detail.py): three overlapping round lobes, each lobe
holding a ring and a dot, repeated in staggered rows.

    python3 3d/make_textures.py            # writes assets/textures/

  steatite_albedo.jpg / _normal.png          pale soapstone, tiles in both directions
  cotton-plain-weave_albedo.jpg / _normal.png  undyed plain-weave cotton
  madder-trefoil-print_albedo.jpg / _normal.png  red trefoils printed on cotton (repeat tile)
  indigo-resist-trefoil_albedo.jpg / _normal.png  white trefoils resisted out of an indigo ground
  trefoil-block-face_height.png               the face of a hypothetical carving block (white = raised/inked)
  trefoil-impression_alpha.png                what that block would leave on cloth

The print tiles are 16.7 x 28.9 mm of cloth at about 61 px/mm; repeat them freely.
The block-face and print maps illustrate a hypothesis. They are not Indus finds.
"""
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'textures')
os.makedirs(OUT, exist_ok=True)

P = 16.7                     # column pitch, mm (as on the model)
PV = P * 0.8660254           # row pitch
TW = 1024                    # tile width px
PXMM = TW / P
TH = int(round(2 * PV * PXMM))          # tile height px (two rows repeat)
LOBE_D, LOBE_R = 3.9, 4.15


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def pnoise(W, H, cx, cy, seed):
    """Value noise periodic in both axes."""
    g = np.random.default_rng(seed).random((cy, cx)).astype(np.float32)
    x = np.arange(W, dtype=np.float32) / W * cx; y = np.arange(H, dtype=np.float32) / H * cy
    ix, iy = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = x - ix, y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    ix0, ix1, iy0, iy1 = ix % cx, (ix + 1) % cx, iy % cy, (iy + 1) % cy
    a = g[iy0][:, ix0] * (1 - fx) + g[iy0][:, ix1] * fx
    b = g[iy1][:, ix0] * (1 - fx) + g[iy1][:, ix1] * fx
    return (a * (1 - fy)[:, None] + b * fy[:, None]) * 2 - 1


def fbm(W, H, base, octaves, seed):
    out, amp, tot = 0, 1.0, 0
    for o in range(octaves):
        out = out + amp * pnoise(W, H, base * 2 ** o, max(2, int(base * 2 ** o * H / W)), seed + 11 * o)
        tot += amp; amp *= 0.5
    return out / tot


def normal_from_height(h, strength):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy = (np.roll(h, 1, 0) - np.roll(h, -1, 0)) * 0.5           # +Y up the image
    n = np.stack([-dx * strength, -dy * strength, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)


def weave(W, H, threads_x, threads_y):
    """Plain weave height 0..1, tiling exactly."""
    x = np.arange(W)[None, :] / W * threads_x; y = np.arange(H)[:, None] / H * threads_y
    fx, fy = x - np.floor(x), y - np.floor(y)
    par = (np.floor(x) + np.floor(y)) % 2
    hx = np.sin(np.pi * fx) ** 0.7; hy = np.sin(np.pi * fy) ** 0.7
    return np.where(par == 0, 0.55 + 0.45 * hx, 0.55 + 0.45 * hy)


def trefoils(W, H):
    """Union interior (0..1), ring/dot mask, outline, over a periodic tile; units mm."""
    xs = (np.arange(W)[None, :] + 0.5) / PXMM; zs = (np.arange(H)[:, None] + 0.5) / PXMM
    inside = np.zeros((H, W), np.float32); dots = np.zeros_like(inside); rings = np.zeros_like(inside); edge = np.zeros_like(inside)
    for kr in range(-1, 4):
        off = 0.5 * (kr % 2)
        th0 = np.pi / 2 if kr % 2 == 0 else -np.pi / 2
        for jc in range(-1, 2):
            cx = (jc + off) * P; cz = kr * PV
            du = np.full((H, W), 1e3, np.float32)
            for k in range(3):
                th = th0 + k * 2 * np.pi / 3
                dc = np.hypot(xs - (cx + LOBE_D * np.cos(th)), zs - (cz + LOBE_D * np.sin(th)))
                du = np.minimum(du, dc - LOBE_R)
                dots = np.maximum(dots, smooth(1.0, 0.45, dc))
                rings = np.maximum(rings, smooth(0.42, 0.0, np.abs(dc - 1.9)))
            inside = np.maximum(inside, smooth(0.15, -0.15, du))
            edge = np.maximum(edge, smooth(0.5, 0.0, np.abs(du)))
    return inside, dots, rings, edge


def save_albedo(arr, name, q=92):
    Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name), quality=q)


def main():
    # ── steatite ──────────────────────────────────────────────────────────
    S = 1024
    n1 = fbm(S, S, 4, 4, 3); n2 = fbm(S, S, 48, 2, 9)
    col = np.array([212, 194, 156]) / 255 * (1 + 0.07 * n1[..., None] + 0.03 * n2[..., None])
    patina = np.clip((fbm(S, S, 3, 3, 21) * 0.5 + 0.5 - 0.45) * 1.8, 0, 1)[..., None] * 0.45
    col = col * (1 - patina) + np.array([158, 126, 86]) / 255 * patina
    save_albedo(col, 'steatite_albedo.jpg')
    Image.fromarray(normal_from_height(0.5 * n1 + 0.25 * n2 + 0.1 * fbm(S, S, 128, 1, 5), 6.0)).save(os.path.join(OUT, 'steatite_normal.png'), optimize=True)

    # ── plain cotton ─────────────────────────────────────────────────────
    w = weave(S, S, 30, 30)
    slub = fbm(S, S, 6, 3, 31)
    cot = np.array([236, 226, 204]) / 255 * (0.94 + 0.08 * w[..., None] + 0.05 * slub[..., None])
    save_albedo(cot, 'cotton-plain-weave_albedo.jpg')
    Image.fromarray(normal_from_height(w + 0.15 * slub, 5.0)).save(os.path.join(OUT, 'cotton-plain-weave_normal.png'), optimize=True)

    # ── printed repeat tiles (width = one column pitch, height = two row pitches) ─
    inside, dots, rings, edge = trefoils(TW, TH)
    wv = weave(TW, TH, 30, 52)
    sl = fbm(TW, TH, 6, 3, 41)
    ink = np.clip(inside * (1 - 0.92 * dots), 0, 1)                      # lobes red, dots left cream
    # block-print character: pigment pools slightly at the edges, density varies
    density = np.clip(0.9 + 0.12 * fbm(TW, TH, 10, 3, 51) + 0.12 * edge, 0, 1.1)
    cream = np.array([236, 226, 204]) / 255; madder = np.array([148, 50, 38]) / 255; indigo = np.array([26, 40, 90]) / 255
    cloth = cream[None, None] * (0.94 + 0.08 * wv[..., None] + 0.05 * sl[..., None])
    a = np.clip(ink * density, 0, 1)[..., None]
    red = cloth * (1 - a) + madder * (0.9 + 0.1 * wv[..., None]) * a
    save_albedo(red, 'madder-trefoil-print_albedo.jpg')
    Image.fromarray(normal_from_height(wv + 0.15 * sl, 5.0)).save(os.path.join(OUT, 'madder-trefoil-print_normal.png'), optimize=True)

    # indigo resist: the trefoil stays white (resist), the ground goes blue, with the speckle of a clay-resist
    speck = (fbm(TW, TH, 90, 1, 61) > 0.55).astype(np.float32) * 0.5
    resist = np.clip(ink * (0.92 + 0.1 * fbm(TW, TH, 12, 3, 71)) + speck * (1 - ink), 0, 1)[..., None]
    ground = indigo * (0.88 + 0.22 * fbm(TW, TH, 8, 4, 81)[..., None]) * (0.9 + 0.1 * wv[..., None])
    blue = ground * (1 - resist) + cloth * resist
    save_albedo(blue, 'indigo-resist-trefoil_albedo.jpg')
    Image.fromarray(normal_from_height(wv + 0.15 * sl, 5.0)).save(os.path.join(OUT, 'indigo-resist-trefoil_normal.png'), optimize=True)

    # the block face and its impression (hypothetical tool)
    face = np.clip(inside * (1 - 0.95 * smooth(0.0, 1.0, dots)), 0, 1)
    Image.fromarray((face * 255).astype(np.uint8)).save(os.path.join(OUT, 'trefoil-block-face_height.png'), optimize=True)
    Image.fromarray((np.clip(ink * density, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'trefoil-impression_alpha.png'), optimize=True)
    print('textures:', TW, 'x', TH, 'print tiles ->', OUT)


if __name__ == '__main__':
    main()
