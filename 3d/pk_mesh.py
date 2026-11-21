"""
pk_mesh.py — turn a radius grid r[nz, nphi] into a closed, UV-mapped mesh.

Topology: a UV-sphere-like grid (rows = height, columns = azimuth) with a
duplicated seam column (the seam sits at the back, u = 0 / 1) and per-column
pole vertices so the base and the crown fan without UV pinching. The face is
at u = 0.5. Units are millimetres here; the Blender build scales to metres.

Normals are accumulated from faces, then merged across the seam and the poles
so no crease shows. Tangent = +u (azimuth), bitangent = +v (up), which is the
frame pk_detail.py bakes its normal map into.
"""
import numpy as np


def build(phi, z, r, z_top, z_bot=0.0):
    nz, n = r.shape
    # rows: use the grid rows as-is, columns + 1 for the seam
    ph = np.concatenate([phi, [phi[0] + 2 * np.pi]])
    rr = np.concatenate([r, r[:, :1]], axis=1)
    X = rr * np.sin(ph)[None, :]
    Y = -rr * np.cos(ph)[None, :]
    Z = np.repeat(z[:, None], n + 1, axis=1)
    V = np.stack([X, Y, Z], axis=-1).reshape(-1, 3)
    U = np.tile((ph + np.pi) / (2 * np.pi), (nz, 1))
    Vv = np.repeat(((z - z_bot) / (z_top - z_bot))[:, None], n + 1, axis=1)
    UV = np.stack([U, Vv], axis=-1).reshape(-1, 2)

    idx = np.arange(nz * (n + 1)).reshape(nz, n + 1)
    a = idx[:-1, :-1].ravel(); b = idx[:-1, 1:].ravel()
    c = idx[1:, 1:].ravel(); d = idx[1:, :-1].ravel()
    # outward winding (counter-clockwise seen from outside): rows go top->bottom,
    # columns phi increasing (toward +x at the front)
    faces = np.concatenate([np.stack([a, d, c], 1), np.stack([a, c, b], 1)])

    # poles: one vertex per column segment so UVs stay clean
    base = len(V)
    topc = np.array([0.0, 0.0, z_top]); botc = np.array([0.0, 0.0, z_bot])
    top_v = np.tile(topc, (n, 1)); bot_v = np.tile(botc, (n, 1))
    top_uv = np.stack([(np.arange(n) + 0.5) / n, np.ones(n)], 1)
    bot_uv = np.stack([(np.arange(n) + 0.5) / n, np.zeros(n)], 1)
    V = np.concatenate([V, top_v, bot_v]); UV = np.concatenate([UV, top_uv, bot_uv])
    jt = base + np.arange(n); jb = base + n + np.arange(n)
    ft = np.stack([idx[0, :-1], jt, idx[0, 1:]], 1)        # top fan
    fb = np.stack([idx[-1, :-1], idx[-1, 1:], jb], 1)       # bottom fan
    faces = np.concatenate([faces, ft, fb])

    # vertex normals from faces
    p0, p1, p2 = V[faces[:, 0]], V[faces[:, 1]], V[faces[:, 2]]
    fn = np.cross(p1 - p0, p2 - p0)
    N = np.zeros_like(V)
    for k in range(3):
        np.add.at(N, faces[:, k], fn)
    # merge the seam column (first and last column are the same place)
    s0 = idx[:, 0]; s1 = idx[:, -1]
    m = N[s0] + N[s1]
    N[s0] = m; N[s1] = m
    N[base:base + n] = np.array([0, 0, 1.0]) * 1.0
    N[base + n:base + 2 * n] = np.array([0, 0, -1.0])
    L = np.linalg.norm(N, axis=1, keepdims=True)
    N = N / np.maximum(L, 1e-12)
    return dict(V=V, UV=UV, F=faces, N=N, grid=idx)
