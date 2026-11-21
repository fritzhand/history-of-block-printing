"""
bl_build.py — assemble the Priest-King in Blender from the baked grids.

    blender -b --factory-startup --python-exit-code 1 --python 3d/bl_build.py -- \
        --prefix 3d/work/d1 --out 3d/work/r1 --views front,three,side,back \
        [--variant stone|printed] [--size 560 720] [--samples 48] [--engine CYCLES|EEVEE]
        [--save-blend path.blend] [--glb path.glb] [--turntable N frames outdir]

Reads <prefix>_mesh.npz, <prefix>_normal_<variant>.png, <prefix>_albedo_<variant>.jpg.
Units: the mesh is built in millimetres and scaled to metres (the figure is 0.176 m tall).
"""
import bpy, sys, os, math, argparse
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pk_mesh

ap = argparse.ArgumentParser()
ap.add_argument('--prefix', required=True)
ap.add_argument('--out', default=None)
ap.add_argument('--views', default='front,three,side,back')
ap.add_argument('--variant', default='stone')
ap.add_argument('--size', nargs=2, type=int, default=[560, 720])
ap.add_argument('--samples', type=int, default=48)
ap.add_argument('--engine', default='CYCLES')
ap.add_argument('--save-blend', default=None)
ap.add_argument('--glb', default=None)
ap.add_argument('--turntable', nargs=2, default=None)       # frames outdir
ap.add_argument('--persp', action='store_true')
ap.add_argument('--cpu', action='store_true')
ap.add_argument('--sweep', nargs=2, type=float, default=[-20.0, 340.0])   # azimuth start/end for --turntable
ap.add_argument('--shiftx', type=float, default=0.0)   # camera shift (fraction of frame width): moves the subject
ap.add_argument('--bg', default='dark')
ap.add_argument('--ortho', type=float, default=None)   # override ortho scale (m) for every view
a = ap.parse_args(sys.argv[sys.argv.index('--') + 1:])

Z_TOP = 176.0
rm = np.load(a.prefix + '_mesh.npz')['r']
nz, n = rm.shape
phi = -np.pi + 2 * np.pi * (np.arange(n) + 0.5) / n
zz = Z_TOP * (1 - (np.arange(nz) + 0.5) / nz)
m = pk_mesh.build(phi, zz, rm, Z_TOP)

bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('PriestKing')
mesh.from_pydata((m['V'] * 0.001).astype(np.float32).tolist(), [], m['F'].tolist())
mesh.update()
uv = mesh.uv_layers.new(name='UVMap')
vi = np.empty(len(mesh.loops), np.int32)
mesh.loops.foreach_get('vertex_index', vi)
uv.data.foreach_set('uv', m['UV'][vi].astype(np.float32).ravel())
mesh.polygons.foreach_set('use_smooth', [True] * len(mesh.polygons))
try:
    mesh.normals_split_custom_set_from_vertices(m['N'].astype(np.float32).tolist())
except Exception as e:
    print('custom normals skipped:', e)
obj = bpy.data.objects.new('PriestKing', mesh)
bpy.context.scene.collection.objects.link(obj)


def make_material(name, albedo, normal, rough):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = 0.0
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 0.35
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = bpy.data.images.load(albedo)
    ti.image.colorspace_settings.name = 'sRGB'
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = bpy.data.images.load(normal)
    tn.image.colorspace_settings.name = 'Non-Color'
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = 'UVMap'; nm.inputs['Strength'].default_value = 1.0
    nt.links.new(ti.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat


variants = {'stone': 0.55, 'printed': 0.62}
mats = {v: make_material('Priest-King ' + v, f'{a.prefix}_albedo_{v}.jpg', f'{a.prefix}_normal_{v}.png', r)
        for v, r in variants.items() if os.path.exists(f'{a.prefix}_normal_{v}.png')}
mesh.materials.append(mats[a.variant])
for v, mt in mats.items():
    mt.use_fake_user = True          # keep both in the .blend; only the active one is on the mesh

sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y = a.size
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'

# ── world ──────────────────────────────────────────────────────────────────
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
bgn = w.node_tree.nodes['Background']
if a.bg == 'dark':
    bgn.inputs['Color'].default_value = (0.012, 0.012, 0.018, 1); bgn.inputs['Strength'].default_value = 1.0
else:
    bgn.inputs['Color'].default_value = (0.78, 0.74, 0.68, 1); bgn.inputs['Strength'].default_value = 0.6


def light(name, kind, loc, energy, size, col=(1, 1, 1)):
    L = bpy.data.lights.new(name, kind)
    L.energy = energy; L.color = col
    if kind == 'AREA': L.size = size
    o = bpy.data.objects.new(name, L); o.location = loc; sc.collection.objects.link(o)
    tgt = bpy.data.objects.new(name + 'T', None); tgt.location = (0, 0, 0.09); sc.collection.objects.link(tgt)
    c = o.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    return o


# key from the upper left of the viewer, low enough to rake across the carving
light('key', 'AREA', (-0.55, -0.60, 0.36), 22, 0.5, (1.0, 0.93, 0.82))
light('fill', 'AREA', (0.6, -0.5, 0.12), 3.5, 0.8, (0.85, 0.9, 1.0))
light('rim', 'AREA', (0.35, 0.65, 0.30), 14, 0.4, (1.0, 0.85, 0.7))

# ── camera ─────────────────────────────────────────────────────────────────
cam = bpy.data.cameras.new('cam')
if a.persp:
    cam.lens = 110
else:
    cam.type = 'ORTHO'; cam.ortho_scale = 0.205
cam.shift_x = a.shiftx
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
tgt = bpy.data.objects.new('tgt', None); tgt.location = (0, 0, 0.088); sc.collection.objects.link(tgt)
tc = co.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
# name: (azimuth deg, target z m, ortho scale m)
VIEWS = {'front': (0, .088, .205), 'three': (35, .088, .205), 'side': (90, .088, .205), 'back': (180, .088, .205),
         'three2': (-35, .088, .205), 'back3': (145, .088, .205),
         'face': (14, .142, .105), 'face3': (38, .140, .105), 'faceside': (80, .140, .105),
         'chest': (-18, .070, .115), 'chest3': (30, .066, .115), 'backc': (172, .075, .12), 'ear': (80, .136, .045)}


def place(az, dist=1.0, h=0.0, tz=0.088, scale=0.205):
    r = math.radians(az)
    tgt.location = (0, 0, tz)
    cam.ortho_scale = a.ortho or scale
    co.location = (math.sin(r) * dist, -math.cos(r) * dist, tz + h)
    bpy.context.view_layer.update()


# ── engine ─────────────────────────────────────────────────────────────────
if a.engine == 'CYCLES':
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = a.samples
    sc.cycles.use_denoising = True
    if not a.cpu:
        try:
            prefs = bpy.context.preferences.addons['cycles'].preferences
            prefs.compute_device_type = 'METAL'; prefs.get_devices()
            for d in prefs.devices: d.use = True
            sc.cycles.device = 'GPU'
        except Exception as e:
            print('cpu cycles:', e)
else:
    sc.render.engine = 'BLENDER_EEVEE'
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass

if a.out:
    os.makedirs(a.out, exist_ok=True)
    for v in a.views.split(','):
        az, tz, sc_ = VIEWS[v]
        place(az, tz=tz, scale=sc_)
        sc.render.filepath = os.path.join(a.out, f'{v}.png')
        bpy.ops.render.render(write_still=True)
        print('rendered', sc.render.filepath, flush=True)

if a.turntable:
    frames, outdir = int(a.turntable[0]), a.turntable[1]
    os.makedirs(outdir, exist_ok=True)
    for i in range(frames):
        fp = os.path.join(outdir, f'f{i:04d}.png')
        if os.path.exists(fp):
            continue                                  # resumable
        t = i / max(frames - 1, 1)
        place(a.sweep[0] + (a.sweep[1] - a.sweep[0]) * t, dist=1.0, h=0.0)
        sc.render.filepath = fp
        bpy.ops.render.render(write_still=True)
        if i % 24 == 0: print('turn', i, flush=True)

if a.save_blend:
    for img in bpy.data.images:
        if img.filepath:
            try: img.pack()
            except Exception: pass
    bpy.ops.wm.save_as_mainfile(filepath=a.save_blend)
    print('saved', a.save_blend)

if a.glb:
    bpy.ops.export_scene.gltf(filepath=a.glb, export_format='GLB', use_selection=False,
                              export_apply=False, export_tangents=True, export_texcoords=True,
                              export_normals=True, export_materials='EXPORT', export_image_format='AUTO',
                              export_cameras=False, export_lights=False, export_yup=True)
    print('exported', a.glb, os.path.getsize(a.glb))
