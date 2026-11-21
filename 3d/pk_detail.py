"""
pk_detail.py — the fine surface of the Priest-King, baked into textures.

Everything here is a height offset h(phi, z) in millimetres along the radial
direction of the base form from pk_base.py, evaluated on a high-resolution
(phi, z) grid. The mesh takes the area-averaged surface; a tangent-space
normal map carries the difference, so beard lines, hair, the trefoil relief
and stone grain cost no geometry.

Features, each read off public photographs of the sculpture (National Museum
of Pakistan, Karachi; 17.5 cm, steatite):
  - a fillet around the head, tilted down toward the back, with a ring
    ornament at the forehead and two tails hanging down the back
  - a spiral ear, fine combed lines on the beard (vertical) and the hair
  - the shawl: worn over the left shoulder and under the right arm, its edge
    a diagonal across the chest, covered in a hexagonal lattice of trefoils;
    the front below the band is broken, rough stone
  - an armband ring on the right arm; a crack through the face

The 'printed' variant removes the carved relief from the shawl and shows what
the same pattern would look like as dyed cloth: madder-red trefoils on cotton,
an indigo hem. It is an illustration of a hypothesis, not evidence.
"""
import numpy as np
from PIL import Image

Z_MAX = 176.0


# ── small helpers ──────────────────────────────────────────────────────────
def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def bump(d, w):
    return smooth(w, 0.0, np.abs(d))


def resample(g, W, H):
    """Bilinear resample of a periodic-in-columns grid onto a W x H grid."""
    nz, n = g.shape
    fj = (np.arange(W) + 0.5) * n / W - 0.5
    fi = (np.arange(H) + 0.5) * nz / H - 0.5
    j0 = np.floor(fj).astype(int); tj = (fj - j0)[None, :]
    j1 = (j0 + 1) % n; j0 = j0 % n
    i0f = np.floor(fi)
    i0 = np.clip(i0f.astype(int), 0, nz - 1); i1 = np.clip(i0f.astype(int) + 1, 0, nz - 1)
    ti = np.clip(fi - i0f, 0, 1)[:, None]
    a = g[i0][:, j0] * (1 - tj) + g[i0][:, j1] * tj
    b = g[i1][:, j0] * (1 - tj) + g[i1][:, j1] * tj
    return (a * (1 - ti) + b * ti).astype(np.float32)


def noise(W, H, cx, cy, seed):
    """Value noise, periodic in x, cx x cy lattice cells over the whole map."""
    rng = np.random.default_rng(seed)
    g = rng.random((cy + 2, cx)).astype(np.float32)
    x = np.arange(W, dtype=np.float32) / W * cx
    y = np.arange(H, dtype=np.float32) / H * cy
    ix = np.floor(x).astype(int); fx = x - ix; ix0 = ix % cx; ix1 = (ix + 1) % cx
    iy = np.floor(y).astype(int); fy = y - iy
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    a = g[iy][:, ix0] * (1 - fx)[None, :] + g[iy][:, ix1] * fx[None, :]
    b = g[iy + 1][:, ix0] * (1 - fx)[None, :] + g[iy + 1][:, ix1] * fx[None, :]
    return (a * (1 - fy)[:, None] + b * fy[:, None]) * 2 - 1      # -1..1


def fbm(W, H, mm_per_px_x, mm_per_px_y, cell_mm, octaves, seed):
    out = 0; amp = 1.0; tot = 0
    for o in range(octaves):
        cx = max(2, int(W * mm_per_px_x / (cell_mm / 2 ** o)))
        cy = max(2, int(H * mm_per_px_y / (cell_mm / 2 ** o)))
        out = out + amp * noise(W, H, cx, cy, seed + 17 * o)
        tot += amp; amp *= 0.5
    return out / tot


def boxblur(a, rx, ry):
    """Separable box blur, wrapping in x (azimuth), clamping in y."""
    def run(a, r, axis, wrap):
        if r < 1:
            return a
        k = 2 * r + 1
        if wrap:
            p = np.concatenate([a[:, -r:], a, a[:, :r]], axis=1)
        else:
            p = np.concatenate([np.repeat(a[:1], r, 0), a, np.repeat(a[-1:], r, 0)], axis=0)
        c = np.cumsum(p, axis=axis, dtype=np.float64)
        if axis == 1:
            c = np.concatenate([np.zeros((c.shape[0], 1)), c], axis=1)
            return ((c[:, k:] - c[:, :-k]) / k).astype(np.float32)
        c = np.concatenate([np.zeros((1, c.shape[1])), c], axis=0)
        return ((c[k:] - c[:-k]) / k).astype(np.float32)
    for _ in range(2):
        a = run(a, rx, 1, True)
        a = run(a, ry, 0, False)
    return a


def seg_dist(x, z, pts):
    d = np.full(x.shape, 1e9, np.float32)
    for (x0, z0), (x1, z1) in zip(pts[:-1], pts[1:]):
        vx, vz = x1 - x0, z1 - z0
        t = np.clip(((x - x0) * vx + (z - z0) * vz) / (vx * vx + vz * vz), 0, 1)
        d = np.minimum(d, np.hypot(x - (x0 + t * vx), z - (z0 + t * vz)))
    return d


# ── the surface ─────────────────────────────────────────────────────────────
def build(base_npz, W=2048, H=1280, seed=7, verbose=True):
    B = np.load(base_npz)
    r0 = resample(B['r'], W, H)
    phi = (-np.pi + 2 * np.pi * (np.arange(W) + 0.5) / W).astype(np.float32)[None, :] * np.ones((H, 1), np.float32)
    zz = (Z_MAX * (1 - (np.arange(H) + 0.5) / H)).astype(np.float32)[:, None] * np.ones((1, W), np.float32)
    x = r0 * np.sin(phi); y = -r0 * np.cos(phi); z = zz
    ax = np.abs(x)
    mmx = 2 * np.pi * 45.0 / W          # mm per texel, azimuth (at the bust radius)
    mmy = Z_MAX / H
    on = (r0 > 1.0).astype(np.float32)  # surface exists

    def log(*a):
        if verbose: print(*a, flush=True)

    # ── regions ────────────────────────────────────────────────────────────
    z_plane = 167.0 - 0.43 * (y + 26.0)                       # fillet plane (tilts down toward the back)
    t_band = (z - z_plane) * 0.918
    head = smooth(101.0, 104.0, z)                             # head vs torso
    ear_v = (y - 4.0) / 8.6; ear_w = (z - 137.0) / 10.0
    ear_rho = np.hypot(ear_v, ear_w)
    ear = (ax > 23.2) * smooth(1.12, 0.96, ear_rho) * head
    ear_th = np.arctan2(ear_w, ear_v * np.sign(x + 1e-6))

    zb = np.where(ax >= 13.0, 121.0 + 0.92 * (ax - 13.0), 116.5 + 4.5 * (ax / 13.0) ** 2)
    g_beard = z - zb                                           # < 0 inside the beard
    beard = smooth(0.5, -0.5, g_beard) * smooth(9.0, 5.0, y) * smooth(100.0, 103.0, z) * (1 - ear)
    face = ((y < -1.0) & (ax < 22.5)).astype(np.float32) * smooth(-0.5, -2.5, t_band) * (1 - beard)
    hair = head * (1 - face) * (1 - beard) * (1 - ear)

    # ── relief on the head ─────────────────────────────────────────────────
    h = np.zeros((H, W), np.float32)
    # beard: raised a little, combed lines, edge line
    line = (31.0 * phi / 1.25)
    ub = (line - np.floor(line)) - 0.5
    groove_b = -0.42 * np.exp(-(ub / 0.17) ** 2)
    h += 0.8 * beard + beard * groove_b * smooth(-0.3, -2.0, g_beard)
    h += -0.5 * bump(g_beard * 0.74, 0.55) * smooth(9.0, 5.0, y) * head * (1 - ear)    # boundary groove
    # hair: meridian lines (converge at the crown)
    lh = (27.0 * phi / 1.1)
    uh = (lh - np.floor(lh)) - 0.5
    rcrown = np.hypot(x, y)
    fade_crown = smooth(5.0, 13.0, rcrown)
    h += hair * (-0.34 * np.exp(-(uh / 0.18) ** 2)) * fade_crown
    # fillet (raised band), forehead ring, two tails at the back
    band = 1.4 * smooth(3.6, 2.0, np.abs(t_band)) * smooth(124.0, 130.0, z)
    h += band
    ring = np.hypot(x, z - 167.0)
    frontness = smooth(-8.0, -20.0, y)
    h += frontness * (0.85 * bump(ring - 4.4, 0.62) + 0.85 * bump(ring, 1.35))
    tails = np.zeros_like(h)
    for x0, x1 in ((-11.0, -1.6), (1.6, 11.0)):
        inx = smooth(x0 - 0.3, x0 + 0.5, x) * smooth(x1 + 0.3, x1 - 0.5, x)
        tails = np.maximum(tails, inx)
    z_tail_end = 100.5 + 0.12 * x
    tails = tails * smooth(z_tail_end - 0.4, z_tail_end + 0.8, z) * smooth(8.0, 14.0, y) * smooth(z_plane + 1, z_plane - 5, z)
    h += 1.7 * tails
    # spiral ear
    pos = ear_rho * 2.3 - ear_th / (2 * np.pi)
    sp = (pos - np.floor(pos)) - 0.5
    spiral = -0.65 * np.exp(-(sp / 0.16) ** 2) * smooth(0.12, 0.25, ear_rho) * smooth(0.88, 0.78, ear_rho)
    rim = 0.55 * bump(ear_rho - 0.94, 0.09)
    h += ear * (spiral + rim + 0.5 * bump(ear_rho, 0.13))
    # crack down the right of the face
    cr = seg_dist(x, z, [(9.5, 154.0), (10.2, 142.0), (12.0, 127.0)])
    h += -0.34 * bump(cr, 0.32) * (y < -8) * head
    # right-arm ring (an armband with a circle)
    arm_ring = np.hypot(x + 43.0, z - 76.0)
    arm_on = smooth(-6.0, -11.0, y) * (x < -30) * (z > 57) * (z < 92)
    h += arm_on * (0.8 * bump(arm_ring - 4.4, 0.55) + 0.8 * bump(arm_ring, 1.1))
    h += arm_on * 0.6 * bump(z - 66.0, 1.2)

    # the broken nose: the carved sphere surface, roughened and darkened
    nbd = np.sqrt((x - 0.6) ** 2 + (y + 44.0) ** 2 + ((z - 137.5) / 0.93) ** 2)
    nosebreak = smooth(2.2, 0.6, np.abs(nbd - 9.0)) * (y < -30.0) * head
    nb_rock = (1.0 - np.abs(fbm(W, H, mmx, mmy, 3.0, 3, seed + 21))) ** 2 - 0.5
    h += nosebreak * nb_rock * 1.1

    # ── the shawl ──────────────────────────────────────────────────────────
    z_edge = 71.0 + 0.525 * (x + 29.0)
    te = (z - z_edge) * 0.885                                  # distance across the diagonal edge, mm
    z_top = 106.0 - 0.38 * np.maximum(ax - 16.0, 0.0) - 1.5
    torso = smooth(z_top + 0.8, z_top - 0.8, z) * smooth(8.0, 12.0, z)
    front = smooth(-3.0, -9.0, y)
    bare_chest = front * smooth(-0.4, 0.4, te)
    bare_arm = smooth(-32.0, -35.0, x) * smooth(51.0, 53.5, z) * smooth(14.0, 8.0, y)
    # broken, rough stone below the band on the front
    zbk = z_edge - 17.0 + 0.5 * np.sin(x * 0.37)
    xbk = 27.0 + 1.6 * np.sin(z * 0.31)
    broken = front * smooth(zbk + 1.0, zbk - 1.0, z) * smooth(-37.5, -35.5, x) * smooth(xbk + 1.0, xbk - 1.0, x) * smooth(13.0, 16.0, z)
    S = torso * (1 - bare_chest) * (1 - bare_arm) * (1 - broken)
    log('regions ok')

    # torso arc-length coordinate: perimeter of the z = 50 slice, wrapped to a whole number of columns
    row50 = int((1 - 50.0 / Z_MAX) * H)
    x50, y50 = x[row50], y[row50]
    psi50 = np.arctan2(x50 - 3.0, -(y50 - 7.0))
    L50 = np.concatenate([[0.0], np.cumsum(np.hypot(np.diff(x50), np.diff(y50)))])
    s_tot = float(L50[-1] + np.hypot(x50[0] - x50[-1], y50[0] - y50[-1]))
    order = np.argsort(psi50)
    psi = np.arctan2(x - 3.0, -(y - 7.0))
    s = np.interp(psi, psi50[order], L50[order], period=2 * np.pi).astype(np.float32)
    NCOL = 16
    P = s_tot / NCOL
    Pv = P * 0.8660254
    z0 = 9.0
    lobe_d, lobe_R = 3.9, 4.15
    log(f'torso perimeter {s_tot:.1f} mm -> {NCOL} columns, pitch {P:.2f} mm')

    ridge = np.zeros((H, W), np.float32)
    motif = np.zeros((H, W), np.float32)      # inside the trefoil (printed colour)
    dots = np.zeros((H, W), np.float32)
    inner = np.zeros((H, W), np.float32)
    a = s / P
    b = (z - z0) / Pv
    kr0 = np.round(b)
    for dk in (-1, 0, 1):
        kr = kr0 + dk
        off = 0.5 * (kr % 2)
        jc0 = np.floor(a - off + 0.5)
        for dj in (-1, 0, 1):
            jc = jc0 + dj
            cs = (jc + off) * P
            cz = z0 + kr * Pv
            dsx = s - cs
            dsx = (dsx + 0.5 * s_tot) % s_tot - 0.5 * s_tot
            dsz = z - cz
            th0 = np.where(kr % 2 == 0, np.pi / 2, -np.pi / 2)
            du = np.full((H, W), 1e3, np.float32)
            for k in range(3):
                th = th0 + k * 2 * np.pi / 3
                ddx = dsx - lobe_d * np.cos(th); ddz = dsz - lobe_d * np.sin(th)
                dc = np.hypot(ddx, ddz)
                du = np.minimum(du, dc - lobe_R)
                dots = np.maximum(dots, smooth(1.0, 0.45, dc))
                inner = np.maximum(inner, 0.5 * bump(dc - 1.9, 0.42))
            ridge = np.maximum(ridge, 0.78 * bump(du, 0.72))
            motif = np.maximum(motif, smooth(0.5, -0.5, du))
    ridge = np.maximum(ridge, np.maximum(0.55 * dots, inner))
    log('lattice ok')

    # hem along the diagonal edge: raised, with a groove line
    hem = front * smooth(0.5, -0.4, te) * smooth(-3.2, -2.4, te)
    hem_groove = bump(te + 3.55, 0.55) * front
    # the cloth sits a little proud of the body
    cloth = 1.1 * S + 0.0
    relief_stone = cloth + 0.7 * hem - 0.45 * hem_groove + S * ridge
    h_stone = h + relief_stone
    # printed variant: cloth is flat and woven
    weave = 0.05 * np.sin(2 * np.pi * s / 0.72) * np.sin(2 * np.pi * z / 0.72)
    relief_printed = cloth + 0.7 * hem + S * weave
    h_printed = h + relief_printed

    # broken region: inset and rough
    rock = (1.0 - np.abs(fbm(W, H, mmx, mmy, 9.0, 4, seed + 3))) ** 3
    rough = rock * 1.5 - 0.8 + fbm(W, H, mmx, mmy, 1.4, 3, seed + 5) * 0.25
    brk = broken * (-2.6 + rough)
    # lower slab: faint step
    slab = smooth(15.0, 13.0, z) * smooth(0.0, 4.0, z)
    brk += slab * (-0.3 + 0.2 * rough)
    h_stone += brk; h_printed += brk

    # stone grain and weathering; polished face stays smoother
    skin = np.clip(face + 0.55 * beard, 0, 1)
    gr = (fbm(W, H, mmx, mmy, 22.0, 3, seed + 1) * 0.30 + fbm(W, H, mmx, mmy, 3.2, 3, seed + 2) * 0.10
          + fbm(W, H, mmx, mmy, 0.7, 2, seed + 4) * 0.04)
    gr = gr * (1 - 0.6 * face)
    h_stone += gr; h_printed += gr * (1 - S) + gr * S * 0.2
    h_stone *= on; h_printed *= on
    log('height ok')

    # ── colour ─────────────────────────────────────────────────────────────
    def srgb(c):
        return np.array(c, np.float32) / 255.0
    n_patina = fbm(W, H, mmx, mmy, 16.0, 3, seed + 11) * 0.5 + 0.5
    n_fine = fbm(W, H, mmx, mmy, 1.2, 2, seed + 12)
    base_c = srgb((212, 194, 156)); patina_c = srgb((158, 126, 86)); rough_c = srgb((128, 112, 92)); slab_c = srgb((142, 140, 118))
    patina_amt = np.clip((n_patina - 0.40) * 1.9, 0, 1)[..., None] * 0.62
    col = base_c * (1 - patina_amt) + patina_c * patina_amt
    nbc = srgb((104, 92, 80)) * (1 + 0.3 * n_fine)[..., None]
    col = col * (1 - nosebreak[..., None]) + nbc * nosebreak[..., None]
    col *= (1 + 0.05 * n_fine)[..., None]
    col = col * (1 - broken[..., None]) + rough_c * (1 + 0.18 * rough[..., None]) * broken[..., None]
    col = col * (1 - slab[..., None]) + slab_c * slab[..., None]

    # cavity darkening: height minus its local average
    def cavity(hh):
        blur = boxblur(hh, 4, 4)
        return np.clip((blur - hh) * 0.9, 0, 1)
    cav_s = cavity(h_stone)
    albedo_stone = np.clip(col * (1 - 0.42 * cav_s[..., None]), 0, 1)
    # eye slits and the mouth are dark
    albedo_stone *= (1 - 0.0)

    # printed variant: undyed cotton ground, madder-red trefoils, indigo hem
    cotton = srgb((236, 226, 204)) * (1 + 0.04 * n_fine)[..., None]
    madder = srgb((148, 50, 38)); indigo = srgb((28, 42, 92))
    cloth_col = cotton * (1 - (motif * (1 - dots * 0.9))[..., None]) + madder * (motif * (1 - dots * 0.9))[..., None]
    cloth_col = cloth_col * (1 - (hem * (1 - 0.0))[..., None]) + indigo * hem[..., None]
    Sm = (S * (1 - 0))[..., None]
    albedo_printed = albedo_stone * (1 - Sm) + cloth_col * Sm
    albedo_printed = np.clip(albedo_printed * (1 - 0.18 * cavity(h_printed)[..., None]), 0, 1)
    log('colour ok')

    return dict(W=W, H=H, r0=r0, phi=phi, z=zz, h_stone=h_stone, h_printed=h_printed,
                albedo_stone=albedo_stone, albedo_printed=albedo_printed, S=S, motif=motif,
                masks=dict(face=face, beard=beard, hair=hair, ear=ear, S=S, broken=broken))


# ── baking ──────────────────────────────────────────────────────────────────
def mesh_grid(r_hi, nm_phi, nm_z):
    """Area-average the hi-res radius onto the mesh grid (rows top->bottom)."""
    im = Image.fromarray(r_hi.astype(np.float32), mode='F').resize((nm_phi, nm_z), Image.BOX)
    return np.asarray(im, np.float32)


def frames(r_mesh):
    """Per-vertex normal and tangent of the mesh grid (periodic in phi)."""
    nz, n = r_mesh.shape
    phi = -np.pi + 2 * np.pi * (np.arange(n) + 0.5) / n
    zz = Z_MAX * (1 - (np.arange(nz) + 0.5) / nz)
    X = r_mesh * np.sin(phi)[None, :]; Y = -r_mesh * np.cos(phi)[None, :]; Z = np.repeat(zz[:, None], n, 1)
    Pm = np.stack([X, Y, Z], -1)
    Tu = np.roll(Pm, -1, 1) - np.roll(Pm, 1, 1)
    Pv_ = np.concatenate([Pm[:1], Pm[:-1]], 0) - np.concatenate([Pm[1:], Pm[-1:]], 0)   # up = +z
    Nn = np.cross(Tu, Pv_)
    ln = np.linalg.norm(Nn, axis=-1, keepdims=True)
    Nn = np.where(ln > 1e-9, Nn / np.maximum(ln, 1e-9), np.array([0, 0, 1.0]))
    Tn = Tu - Nn * (Nn * Tu).sum(-1, keepdims=True)
    lt = np.linalg.norm(Tn, axis=-1, keepdims=True)
    Tn = np.where(lt > 1e-9, Tn / np.maximum(lt, 1e-9), np.array([1.0, 0, 0]))
    return Nn.astype(np.float32), Tn.astype(np.float32)


def bilerp_vec(g, W, H):
    return np.stack([resample(g[..., c], W, H) for c in range(g.shape[-1])], -1)


def bake_normal(r_hi, r_mesh, W, H):
    """Tangent-space (OpenGL, +Y up the model) normal map of r_hi relative to the mesh."""
    nz, n = r_hi.shape[0], r_hi.shape[1]
    phi = (-np.pi + 2 * np.pi * (np.arange(n) + 0.5) / n).astype(np.float32)[None, :]
    zz = (Z_MAX * (1 - (np.arange(nz) + 0.5) / nz)).astype(np.float32)[:, None]
    X = r_hi * np.sin(phi); Y = -r_hi * np.cos(phi); Z = np.broadcast_to(zz, r_hi.shape)
    Pm = np.stack([X, Y, Z], -1)
    Pu = np.roll(Pm, -1, 1) - np.roll(Pm, 1, 1)
    Pv_ = np.concatenate([Pm[:1], Pm[:-1]], 0) - np.concatenate([Pm[1:], Pm[-1:]], 0)
    nt = np.cross(Pu, Pv_)
    ln = np.linalg.norm(nt, axis=-1, keepdims=True)
    nt = np.where(ln > 1e-9, nt / np.maximum(ln, 1e-9), np.array([0, 0, 1.0], np.float32))
    Nm, Tm = frames(r_mesh)
    Nh = bilerp_vec(Nm, W, H); Th = bilerp_vec(Tm, W, H)
    Nh /= np.maximum(np.linalg.norm(Nh, axis=-1, keepdims=True), 1e-9)
    Th = Th - Nh * (Nh * Th).sum(-1, keepdims=True)
    Th /= np.maximum(np.linalg.norm(Th, axis=-1, keepdims=True), 1e-9)
    Bh = np.cross(Nh, Th)
    nts = np.stack([(nt * Th).sum(-1), (nt * Bh).sum(-1), (nt * Nh).sum(-1)], -1)
    nts /= np.maximum(np.linalg.norm(nts, axis=-1, keepdims=True), 1e-9)
    return nts


def to_png(nts, path):
    rgb = np.clip((nts * 0.5 + 0.5) * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(rgb).save(path, optimize=True)


if __name__ == '__main__':
    import sys, time
    t = time.time()
    base = sys.argv[1]; W = int(sys.argv[2]); H = int(sys.argv[3]); out = sys.argv[4]
    nm_phi = int(sys.argv[5]) if len(sys.argv) > 5 else 360
    nm_z = int(sys.argv[6]) if len(sys.argv) > 6 else 480
    D = build(base, W, H)
    np.savez_compressed(f'{out}_hires.npz', **{k: D[k] for k in ('h_stone', 'h_printed', 'r0')})
    # visual debug of the height field (unwrapped)
    hs = D['h_stone']
    dbg = np.clip((hs - hs.min()) / (hs.max() - hs.min()), 0, 1)
    Image.fromarray((dbg * 255).astype(np.uint8)).save(f'{out}_height.png')
    r_mesh = mesh_grid(D['r0'] + D['h_stone'], nm_phi, nm_z)
    np.savez_compressed(f'{out}_mesh.npz', r=r_mesh)
    for var in ('stone', 'printed'):
        r_hi = D['r0'] + D['h_' + var]
        nts = bake_normal(r_hi, r_mesh, W, H)
        to_png(nts, f'{out}_normal_{var}.png')
        a = D['albedo_' + var]
        Image.fromarray((a * 255).astype(np.uint8)).save(f'{out}_albedo_{var}.jpg', quality=90)
        print(var, 'baked', flush=True)
    print('detail done in %.1fs' % (time.time() - t))
