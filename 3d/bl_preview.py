"""
bl_preview.py — quick Workbench renders of a radius grid, for checking the form
against the reference photographs.

    blender -b --factory-startup --python-exit-code 1 --python 3d/bl_preview.py -- \
        base.npz outdir [front,three,side,back] [W H]
"""
import bpy, sys, math, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pk_mesh

argv = sys.argv[sys.argv.index('--') + 1:]
npz, outdir = argv[0], argv[1]
views = (argv[2] if len(argv) > 2 else 'front,three,side,back').split(',')
W, H = (int(argv[3]), int(argv[4])) if len(argv) > 4 else (560, 720)
os.makedirs(outdir, exist_ok=True)

d = np.load(npz)
Z_TOP = 176.0
m = pk_mesh.build(d['phi'], d['z'], d['r'], Z_TOP)

bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('pk')
V = (m['V'] * 0.001).astype(np.float32)
mesh.from_pydata(V.tolist(), [], m['F'].tolist())
mesh.update()
obj = bpy.data.objects.new('pk', mesh)
bpy.context.scene.collection.objects.link(obj)
for p in mesh.polygons:
    p.use_smooth = True
try:
    mesh.normals_split_custom_set_from_vertices(m['N'].astype(np.float32).tolist())
except Exception as e:
    print('custom normals skipped:', e)

sc = bpy.context.scene
sc.render.engine = 'BLENDER_WORKBENCH'
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.display.shading.light = 'STUDIO'
sc.display.shading.color_type = 'SINGLE'
sc.display.shading.single_color = (0.86, 0.74, 0.56)
sc.display.shading.show_cavity = True
sc.display.shading.cavity_type = 'BOTH'
sc.view_settings.view_transform = 'Standard'
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.02, 0.02, 0.03)

cam = bpy.data.cameras.new('cam'); cam.type='ORTHO'; cam.ortho_scale = 0.205
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
AZ = {'front': 0, 'three': 35, 'side': 90, 'back': 180, 'three2': -35}
tz = 0.088
for v in views:
    a = math.radians(AZ[v]); D = 0.95
    co.location = (math.sin(a) * D, -math.cos(a) * D, tz + 0.0)
    for c in list(co.constraints): co.constraints.remove(c)
    tgt = bpy.data.objects.new('t', None); tgt.location = (0, 0, tz); sc.collection.objects.link(tgt)
    c = co.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    sc.render.filepath = os.path.join(outdir, f'{v}.png')
    bpy.ops.render.render(write_still=True)
    print('rendered', sc.render.filepath)
