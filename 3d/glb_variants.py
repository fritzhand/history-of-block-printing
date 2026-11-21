"""
glb_variants.py — add a second material to a one-material GLB as a glTF material
variant (KHR_materials_variants), so a viewer can switch the Priest-King between the
carved-stone surface and the printed-cloth illustration without a second download of
the mesh.

    python3 3d/glb_variants.py in.glb out.glb albedo2.jpg normal2.png [name1 name2]

The new material is a copy of material 0 with its base-colour and normal textures
replaced. The geometry is shared.
"""
import json, struct, sys, copy

src, dst, alb, nrm = sys.argv[1:5]
n1, n2 = (sys.argv[5], sys.argv[6]) if len(sys.argv) > 6 else ('stone', 'printed')
b = open(src, 'rb').read()
magic, ver, total = struct.unpack('<4sII', b[:12])
off, chunks = 12, []
while off < len(b):
    cl, ct = struct.unpack('<I4s', b[off:off + 8]); chunks.append([ct, b[off + 8:off + 8 + cl]]); off += 8 + cl
j = json.loads(chunks[0][1]); binc = bytearray(chunks[1][1])


def add_image(path, mime):
    data = open(path, 'rb').read()
    while len(binc) % 4: binc.append(0)
    start = len(binc); binc.extend(data)
    j['bufferViews'].append({'buffer': 0, 'byteOffset': start, 'byteLength': len(data)})
    j['images'].append({'bufferView': len(j['bufferViews']) - 1, 'mimeType': mime})
    j['textures'].append({'sampler': j['textures'][0].get('sampler', 0), 'source': len(j['images']) - 1})
    return len(j['textures']) - 1


t_alb = add_image(alb, 'image/jpeg' if alb.lower().endswith(('jpg', 'jpeg')) else 'image/png')
t_nrm = add_image(nrm, 'image/png' if nrm.lower().endswith('png') else 'image/jpeg')
m1 = j['materials'][0]; m2 = copy.deepcopy(m1)
m2['name'] = (m1.get('name', 'material') + ' (' + n2 + ')')
m2['pbrMetallicRoughness']['baseColorTexture']['index'] = t_alb
m2['normalTexture']['index'] = t_nrm
m2['pbrMetallicRoughness']['roughnessFactor'] = 0.62
m1['name'] = (m1.get('name', 'material') + ' (' + n1 + ')')
j['materials'].append(m2)
prim = j['meshes'][0]['primitives'][0]
prim.setdefault('extensions', {})['KHR_materials_variants'] = {
    'mappings': [{'material': 0, 'variants': [0]}, {'material': 1, 'variants': [1]}]}
j.setdefault('extensions', {})['KHR_materials_variants'] = {'variants': [{'name': n1}, {'name': n2}]}
j['extensionsUsed'] = sorted(set(j.get('extensionsUsed', []) + ['KHR_materials_variants']))
j['buffers'][0]['byteLength'] = len(binc)
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(binc) % 4: binc.append(0)
out = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(binc))
out += struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binc), b'BIN\x00') + bytes(binc)
open(dst, 'wb').write(out)
print('wrote', dst, len(out), 'bytes; variants:', n1, n2)
