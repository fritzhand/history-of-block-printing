"""
pk_base.py — base form of the Priest-King bust as an implicit surface.

The sculpture is modelled as a smooth union of ellipsoids and superellipsoids
(a signed-distance sketch, millimetres, +z up, the face looking toward -y).
Ray-marching that field outward-in along horizontal rays from the vertical
axis gives a radius r(phi, z) on a cylindrical grid. That grid is the mesh
(a UV-sphere-like topology) and its (phi, z) coordinates are the UVs, which
is what lets the fine detail be baked analytically in pk_detail.py.

Proportions are measured from public photographs of the sculpture (height
17.5 cm; head about 40 % of the bust; shoulders about 1.35 x head depth).
This is an interpretation for illustration, not a scan.
"""
import numpy as np

Z_MAX = 176.0          # crown height, mm
R_MAX = 66.0
SQ = np.sqrt


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def ellipsoid(x, y, z, c, r):
    qx, qy, qz = (x - c[0]) / r[0], (y - c[1]) / r[1], (z - c[2]) / r[2]
    k0 = SQ(qx * qx + qy * qy + qz * qz)
    k1 = SQ((qx / r[0]) ** 2 + (qy / r[1]) ** 2 + (qz / r[2]) ** 2)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def superel(x, y, z, c, r, nxy, nz):
    qx = np.abs((x - c[0]) / r[0])
    qy = np.abs((y - c[1]) / r[1])
    qz = np.abs((z - c[2]) / r[2])
    f = ((qx ** nxy + qy ** nxy) ** (nz / nxy) + qz ** nz) ** (1.0 / nz)
    return (f - 1.0) * min(r) * 0.85


def capsule(x, y, z, a, b, ra, rb=None):
    rb = ra if rb is None else rb
    a = np.array(a, float); b = np.array(b, float)
    ab = b - a
    px, py, pz = x - a[0], y - a[1], z - a[2]
    t = np.clip((px * ab[0] + py * ab[1] + pz * ab[2]) / ab.dot(ab), 0, 1)
    dx, dy, dz = px - t * ab[0], py - t * ab[1], pz - t * ab[2]
    return SQ(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t)


def field(x, y, z):
    """Negative inside the sculpture, in (approximate) millimetres."""
    ax = np.abs(x)

    # ── body ───────────────────────────────────────────────────────────────
    # shoulders slope away from the neck: shear z by |x| beyond 16 mm
    zs = z + 0.38 * np.maximum(ax - 16.0, 0.0)
    trunk = superel(x, y, zs, (3.0, 7.0, 50.0), (43.0, 36.5, 56.0), 2.9, 3.4)
    neck = superel(x, y, z, (0.0, 8.0, 112.0), (23.0, 29.0, 20.0), 2.4, 2.4)
    body = smin(trunk, neck, 6.0)

    # right arm (viewer's left, x<0): a hanging upper arm, broken below the elbow
    arm = capsule(x, y, z, (-41.0, -3.0, 84.0), (-43.0, -3.5, 58.0), 10.4, 9.8)
    cut = -(z - (54.5 - 0.20 * (x + 42.0) - 0.05 * (y + 3.0)))      # keep z above the break
    arm = smax(arm, cut, 0.8)
    body = smin(body, arm, 6.0)
    # left shoulder cap (the arm itself is hidden in the shawl)
    armL = capsule(x, y, z, (40.0, 3.0, 83.0), (41.0, 3.0, 70.0), 9.8, 9.4)
    body = smin(body, armL, 6.0)

    # ── head ───────────────────────────────────────────────────────────────
    head = superel(x, y, z, (0.0, 1.5, 140.0), (26.5, 34.0, 35.5), 2.5, 2.7)
    fore = superel(x, y, z, (0.0, -12.0, 155.0), (24.0, 19.0, 13.0), 3.0, 4.0)   # flat forehead plate
    head = smin(head, fore, 5.0)
    jaw = superel(x, y, z, (0.0, -11.0, 114.5), (24.5, 23.0, 12.0), 2.8, 2.4)    # beard block
    head = smin(head, jaw, 8.0)
    for s in (-1, 1):
        head = smin(head, ellipsoid(x, y, z, (s * 15.0, -21.0, 128.0), (11.0, 10.0, 11.0)), 6.0)
    # brow ridge
    head = smin(head, capsule(x, y, z, (-19.0, -27.8, 161.0), (19.0, -27.8, 161.0), 4.4), 3.0)
    # nose: bridge and wings, then the break
    head = smin(head, capsule(x, y, z, (0.0, -29.0, 159.0), (0.0, -36.0, 138.0), 4.2, 5.0), 3.0)
    for s in (-1, 1):
        head = smin(head, ellipsoid(x, y, z, (s * 5.4, -34.0, 134.5), (4.0, 4.6, 4.2)), 2.5)
    # lips
    head = smin(head, ellipsoid(x, y, z, (0.0, -31.0, 125.5), (12.5, 4.6, 3.4)), 1.6)
    head = smin(head, ellipsoid(x, y, z, (0.0, -31.6, 119.4), (11.5, 4.8, 3.8)), 1.6)
    # eyelids
    for s in (-1, 1):
        head = smin(head, ellipsoid(x, y, z, (s * 11.3, -29.8, 158.9), (8.6, 4.2, 3.0)), 1.6)
        head = smin(head, ellipsoid(x, y, z, (s * 11.3, -30.0, 152.4), (8.0, 3.8, 2.2)), 1.6)
    # ears
    for s in (-1, 1):
        head = smin(head, ellipsoid(x, y, z, (s * 26.6, 4.0, 137.0), (4.0, 8.6, 10.0)), 1.6)

    f = smin(body, head, 5.0)

    # ── carving ────────────────────────────────────────────────────────────
    for s in (-1, 1):                                    # eye slits
        f = smax(f, -ellipsoid(x, y, z, (s * 11.3, -31.4, 155.6), (7.6, 3.2, 1.15)), 0.5)
    f = smax(f, -ellipsoid(x, y, z, (0.0, -35.2, 122.8), (11.5, 2.6, 0.55)), 0.4)      # mouth
    f = smax(f, -ellipsoid(x, y, z, (0.6, -44.0, 137.5), (9.0, 9.0, 8.4)), 1.0)        # nose break
    f = smax(f, -ellipsoid(x, y, z, (-3.2, -39.5, 132.0), (4.0, 4.0, 3.6)), 1.0)

    # flat base and flat crown limit
    f = np.maximum(f, -z)
    f = np.maximum(f, z - Z_MAX)
    return f


def base_radius(nphi=512, nz=640, step=0.9, bisect=16, verbose=True):
    """Radius r[nz, nphi] (rows top -> bottom, columns phi from -pi to pi).

    phi = 0 faces the front (-y); x = r sin(phi), y = -r cos(phi)."""
    phi = -np.pi + 2 * np.pi * (np.arange(nphi) + 0.5) / nphi
    zz = Z_MAX * (1.0 - (np.arange(nz) + 0.5) / nz)
    P, Z = np.meshgrid(phi, zz)
    P = P.ravel(); Z = Z.ravel()
    sp, cp = np.sin(P), np.cos(P)
    n = P.size
    hi = np.full(n, -1.0)              # first outside radius above the surface
    lo = np.zeros(n)
    found = np.zeros(n, bool)
    rs = np.arange(R_MAX, 0.0, -step)
    for r in rs:
        v = field(r * sp, -r * cp, Z)
        hit = (v < 0.0) & ~found
        if hit.any():
            lo[hit] = r
            hi[hit] = r + step
            found |= hit
    # bisection between lo (inside) and hi (outside)
    a, b = lo.copy(), hi.copy()
    for _ in range(bisect):
        m = 0.5 * (a + b)
        v = field(m * sp, -m * cp, Z)
        inside = v < 0.0
        a = np.where(found & inside, m, a)
        b = np.where(found & ~inside, m, b)
    r = np.where(found, 0.5 * (a + b), 0.0)
    if verbose:
        print(f'base_radius {nphi}x{nz}: rmax {r.max():.1f} mm, hit {found.mean():.2%}')
    return phi, zz, r.reshape(nz, nphi)


if __name__ == '__main__':
    import sys, time
    t = time.time()
    nphi, nz = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) > 2 else (256, 320)
    phi, zz, r = base_radius(nphi, nz)
    np.savez_compressed(f'3d/work/base_{nphi}x{nz}.npz', phi=phi, z=zz, r=r)
    print('done in %.1fs' % (time.time() - t))
