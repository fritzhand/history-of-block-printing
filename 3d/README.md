# The Priest-King model

A **measured interpretation** of the sculpture (steatite, 17.5 cm high, 11 cm wide, National Museum of Pakistan,
Karachi), built from published photographs. It is not a scan. Units are millimetres until the Blender step, which
scales to metres.

```
pk_base.py      the base form: smooth union of ellipsoids and superellipsoids, ray-marched along horizontal
                rays onto a cylindrical grid r(phi, z). That grid is the mesh and gives the UVs for free.
pk_detail.py    the fine surface as a height field on a 2048 x 1280 grid: fillet and forehead ring, ear spiral,
                combed beard and hair, the shawl hem, a hexagonal lattice of trefoils wrapped round the torso,
                the broken front, the crack, stone grain. Bakes a tangent-space normal map and an albedo map for
                two surfaces: 'stone' and 'printed' (an illustration of the pattern as printed cloth).
pk_mesh.py      grid -> closed, UV-mapped mesh with merged seam and pole normals.
bl_build.py     Blender: builds the mesh, applies both materials, lights, renders stills and turntables, exports GLB.
glb_variants.py adds the second material as a KHR_materials_variants variant.
make_textures.py  the tileable swatches in assets/textures/.
bl_preview.py, montage.py, run_prev.sh, run_r.sh   fast Workbench/Cycles previews while modelling.
render_hero_placeholder.sh   the 12 s placeholder sweep used as the hero video.
```

## Rebuild

```bash
python3 3d/pk_base.py 512 640
python3 3d/pk_detail.py 3d/work/base_512x640.npz 2048 1280 3d/work/final 360 480
blender -b --factory-startup --python-exit-code 1 --python 3d/bl_build.py -- \
  --prefix 3d/work/final --variant stone --save-blend 3d/out/priest-king.blend --glb 3d/work/pk_base.glb
python3 3d/glb_variants.py 3d/work/pk_base.glb 3d/out/priest-king.glb \
  3d/work/final_albedo_printed.jpg 3d/work/final_normal_printed.png
npx @gltf-transform/cli optimize 3d/out/priest-king.glb assets/models/priest-king.glb \
  --compress meshopt --texture-compress webp --texture-size 2048 --simplify false --join false --flatten false
```

`3d/work/` (renders, hi-res arrays) is git-ignored. Blender 5.2: on this Mac, Cycles' Metal GPU kernel compile
crashed in the sandbox, so renders use `--cpu`; EEVEE is fine for the placeholder turntable.

## Honest limits

- Proportions come from photographs: expect errors of a few millimetres. The face is stylised, and the nose is
  broken as in the original.
- The printed-cloth surface is an illustration. Its colours (madder red, indigo hem) are not found on the sculpture.
- The glTF has been checked with the glTF validator (no errors) and against model-viewer 4.0.0's source (Meshopt,
  WebP, material variants are supported). It has not been opened in a browser yet.
