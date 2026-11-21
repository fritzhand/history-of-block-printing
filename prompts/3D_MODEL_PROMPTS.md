# 3D model of the Priest-King — prompts and a checklist for AI tools

The site already has a measured, procedurally built model (`3d/out/priest-king.blend`, `.glb`).
These prompts are for getting a *second* model from an image-to-3D tool, to compare against it or
to replace it. **Treat any AI-generated model as an interpretation, not evidence.** The page says so.

## 1. What went wrong in the one we tried

A CC BY 4.0 Priest-King model on Sketchfab ("The Priest-King of Mohenjodaro — 3D Model") was
downloaded and rendered from four angles as a comparison. Its glTF file records the generator as
**Tripo** (an AI image-to-3D tool): 975,563 vertices, 1.84 M triangles, one colour texture. From the front it is
convincing. In profile and three-quarter view it is not faithful:

- the **head is tilted back** (chin up), where the sculpture's head is level;
- the **chest bulges forward** in profile, and the lower torso has noisy, scribbled geometry;
- the surface is lumpy at a scale the stone never was;
- it is not a scan, and its description calls it a reconstruction "inspired by" the sculpture.

So: don't use it as the evidence model. Do use these failure modes as the negative checklist below.

## 2. Targets (measured from public photographs; ±3 mm)

The real object: white, low-fired steatite, **17.5 cm high, 11 cm wide**, National Museum of
Pakistan, Karachi, 50.852 (Harappa.com). Heights below are measured up from the broken base.

| Landmark | Height | Note |
|---|---|---|
| Crown of head | 175 mm | flat-ish top, no bun |
| Forehead ornament | ~168 mm | ring with a central dot, on the fillet |
| Fillet (headband) | 168 mm at front, falling to ~141 mm at the back | tilts down toward the back |
| Brow ridge / eye slits | ~161 / ~155 mm | the eyes are narrow, deeply incised slits |
| Ear centre | ~137 mm | a large round ear with a spiral |
| Nose | root ~158 mm; broken below ~137 mm | the tip is missing |
| Mouth | ~123 mm | full lips, upper lip shaved |
| Chin (beard bottom) | ~105 mm | beard sits directly on the chest; no visible neck |
| Shoulder tops | ~104 mm at the neck, ~92 mm at the outer left | |
| Right-arm ornament | ~76 mm | a small ring with a dot |
| Right arm | broken at ~53 mm | |
| Shawl edge | runs diagonally from the right underarm (~71 mm) up to the left shoulder (~103 mm) | |

## 3. Features the model must have (reject it if it misses more than one)

1. **Left shoulder covered, right shoulder bare**, with the cloak passing under the right arm.
2. **Trefoils** — exactly three round lobes, each with a ring and a dot — in staggered rows,
   continuing round the side and the **whole back**. Not four-leaf clovers, not flowers.
3. **A raised hem** along the diagonal edge of the cloak.
4. **Fillet** with a round ornament at the forehead, **two flat tails** hanging down the back.
5. **Short combed beard** with fine vertical grooves, **shaved upper lip**, hair combed back
   in fine lines, flat back of the head, no bun.
6. **Spiral ears**; narrow incised eyes; a long crack down the right of the face; the nose broken.
7. **Rough broken stone** on the front below the band of trefoils (the cloak is lost there).
8. **Head level**, torso upright, bust 17.5 cm tall. No tilt, no lean.

## 4. Inputs

Attach, in this order:

1. `prompts/reference/stone/front.png`, `three.png`, `side.png`, `back.png` (renders of our model,
   neutral grey background, consistent scale). Use these as the multi-view set.
2. The museum photographs you have rights to use as a reference (the Harappa.com front view is
   the best single reference; check each photograph's licence before publishing anything made from it).
3. `prompts/reference/stone/chest3.png` and `face3.png` for pattern and face detail.

Rights note: Commons photographs of casts under CC BY / CC BY-SA are listed in
`research/media.json` with their licences, if you want openly licensed references.

## 5. Prompts

**Image-to-3D (Tripo, Meshy, Hunyuan3D, Rodin or similar) — main prompt**

```
A bust of the Priest-King of Mohenjo-daro, Indus Valley Civilization, about 2500 BCE.
White steatite (soapstone), 17.5 cm tall, matte stone, no colour. Level head, upright torso.
Left shoulder covered by a cloak carved with staggered rows of trefoils, each a clover of exactly
three round lobes with a ring and a dot in each lobe, continuing around the side and the entire
back. Raised hem along a diagonal edge across the chest. Right shoulder bare with a small round
armband. Narrow fillet headband with a round ornament on the forehead, two flat tails hanging
down the back. Short combed beard with fine vertical grooves, shaved upper lip, narrow deeply
incised eyes, spiral ears, a crack down the face, the nose broken off. Rough broken stone on the
front below the cloak. Museum artefact, faithful to the reference images, no stylisation.
```

**Negative / avoid**

```
tilted head, chin raised, leaning torso, hunched shoulders, bulging chest, symmetrical shawl,
four-leaf clover, flowers, floral pattern, extra arm, two bare shoulders, bun, turban, crown,
moustache on the upper lip, smooth beard, glossy plastic, painted colours, base or plinth,
lumpy noise, scribbled surface, text, logo.
```

**Repair prompts** (for tools that accept an edit or re-generation instruction)

- "Rotate the head so the face looks straight ahead; keep the shoulders and cloak unchanged."
- "Flatten the torso so the chest is vertical from the beard down; remove the forward bulge."
- "Make every trefoil exactly three lobes, with a ring and dot in each lobe, in staggered rows."
- "Extend the trefoil pattern over the whole back; add two flat headband tails down the back."
- "Remove surface noise; keep the beard and hair grooves crisp."

## 6. After generation — check and finish in Blender

1. Import, scale to **0.175 m** tall, face toward −Y (Blender's front view), origin at the centre of the base.
2. **Silhouette check:** render front, three-quarter and side at the same ortho scale as
   `prompts/reference/` and overlay them on ours. The head must sit level and the chest must match.
3. Decimate or retopologise to ≤ 350 k triangles for the web. Keep a UV layout with no overlaps;
   bake detail to a 2048² normal map from the high-poly.
4. Textures: colour in sRGB, normal in Non-Color (OpenGL, +Y up). The pattern maps in
   `assets/textures/` can re-skin the cloak (madder print, indigo resist).
5. Export GLB, then `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt
   --texture-compress webp --texture-size 2048 --simplify false`.
6. Label it on the page: *"AI-generated interpretation, checked against photographs; not a scan."*

## 7. Provenance and credit

- A model made from these prompts is **ours to label**; the tool's terms govern commercial use.
- If the Sketchfab model is shown (for example to compare it with ours), credit: *"The Priest-King of
  Mohenjodaro — 3D Model" by naeemahmedrasheed, CC BY 4.0, via Sketchfab*, and say that we changed
  nothing / what we changed. Do not mix it into our evidence layer.
