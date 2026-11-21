# Hero video — "How the Priest-King's shawl might have been made"

A ~64-second reconstruction for the top of the page. It follows one trefoil pattern from cotton
boll to carved block to printed cloth to the shoulder of a bearded elder, then match-cuts to the
carved stone bust (the real evidence) and hands over to the interactive 3D model.

**It is a reconstruction of a hypothesis, not a record.** No printing block or printed cloth has
been reported from Mohenjo-daro. Every shot below is tagged so the edit and the on-screen text
never claim more than the evidence does.

| Tag | Meaning |
|---|---|
| **EVIDENCED** | Supported by a source the site cites for the object or site itself |
| **REPORTED** | Claimed in a museum or scholarly source, with the doubt that source states |
| **IMAGINED** | Our reconstruction. Plausible, not shown by any find |

---

## 1. What the shots may and may not claim

| Shot subject | Tag | Basis (see `research/FIRST-PASS-NOTES.md`) |
|---|---|---|
| Cotton as a fibre of the Indus world | EVIDENCED | A cotton fragment from Mohenjo-daro was examined for John Marshall; the lab called the result "tentative" (Marshall 1931, p. 585, quoted by Harappa.com) |
| Spindle whorls, hand-spinning | EVIDENCED | Ashmolean: "Spindle weights were found at the Indus Valley sites of the Harappan civilization" |
| Weaving on a loom | IMAGINED | Loom type at Mohenjo-daro is not known. Show a simple frame loom; do not show a pedal loom |
| Madder-red dyeing with a mordant | REPORTED | Ashmolean: a Mohenjo-daro cotton fragment "has been reported to show evidence of madder dyeing". Its date (1760 BCE ±115) is later than the mature Indus period, so treat as open |
| Carving a trefoil block | IMAGINED | No Indus printing block is known. Later carved wooden blocks survive (Met 452215, Egypt, 10th c.; Met 448508, India, 15th–16th c.) and show the *look* of the tool, not Indus practice |
| Pressing the block, repeated in a hex lattice | IMAGINED | The lattice is read off the stone cloak; how that pattern was made on cloth is the open question |
| Red pigment in the trefoils | EVIDENCED (on the stone) | Harappa.com: designs "were originally filled with red pigment" |
| Drill + chisel carving of circles | EVIDENCED (on the stone) | Harappa.com: "Drill holes in the center of each circle indicate they were made with a specialized drill and then touched up with a chisel" |
| Fillet headband, short combed beard, shaved upper lip | EVIDENCED | Harappa.com description of the sculpture |
| Cloak over the **left** shoulder, right shoulder bare, arm ornament on the right upper arm | EVIDENCED | Same |
| A living man wearing it | IMAGINED | The sculpture's identity ("priest-king") is itself speculation |

**Closing card (always on screen for the last 4 s):**
> A reconstruction. The carved stone shawl at Mohenjo-daro shows a pattern, not how it was made.
> No printing blocks have been found there.

---

## 2. Technical spec

- 16:9, 24 fps, deliver 1920×1080. Generate at the tool's highest resolution and upscale if needed.
- 8 hero shots, 6–9 s each, ≈ 64 s. Generate each as its own clip, then cut in an editor.
- **Generate without music and without speech.** The soundtrack is the supplied track
  ("Temple", 2:09). If the tool makes ambient sound (workshop foley, water, wind), keep it low under the track.
- Soundtrack energy map (measured from the file): quiet intro to 0:12, mid-level body from 0:15,
  a lift at 0:45 that stays high to about 1:50, fade-out from 1:52. Cut the shots to it (see the cue column).
- **Rights:** confirmed by the site owner on 2026-11-21 (licence terms to be recorded in
  `CONTENT_LICENSE.md`). Only the trimmed bed `assets/audio/hero-bed.mp3` is in the repository; the
  original full-length file stays local (`assets/audio/temple.mp3`, git-ignored).
- Assemble with `python3 tools/build-hero.py` (see §6).

---

## 3. Style bible — paste this prefix into every prompt

```
STYLE: Cinematic documentary reconstruction of the Indus Valley Civilization at Mohenjo-daro,
about 2500 BCE. Warm low sunlight through a mud-brick courtyard, dust motes, soft natural
shadows. Earth palette: undyed cotton cream, madder red, deep indigo, terracotta, baked brick,
lamp gold. Shot on a 50 mm lens with shallow depth of field, gentle handheld, fine film grain,
slow deliberate movement. South Asian craftspeople with lean builds, dark hair, some bearded,
wearing simple wrapped cotton garments. Copper and bronze tools, stone, clay and wood only.
Hands and materials in sharp detail. Quiet, reverent, tactile.
```

**Period guard-rails — put these in every negative prompt:**
```
NEGATIVE: iron or steel tools, horses, wheels with spokes, glass, paper, modern clothing,
zippers, plastic, Egyptian or Greek or Roman costume, pharaoh headdress, turbans, jewellery
from later periods, written text or letters of any alphabet, logos, subtitles, watermarks,
modern buildings, electric light, CGI sheen, oversaturated colour, extra fingers, distorted hands.
```

Why these: Mohenjo-daro is a Bronze Age brick city (no iron, no horses in the mature phase).
Video tools love to add Egyptian or generic "ancient" looks, and they invent fake scripts.
Say "no text" every time.

**The pattern (describe it the same way in every shot):**
> a trefoil: three overlapping circular lobes, each lobe holding a small ring with a dot in its
> centre, repeated in staggered rows like a honeycomb.

Attach `prompts/reference/stone/chest3.png` and `prompts/reference/printed/chest3.png` to every
shot that shows the pattern. They are renders of the 3D model built for this site.

**People (keep consistent):**
- *The carver* — a man in his forties, short beard, copper chisel and a bow drill, leather apron-cloth.
- *The weaver / printer* — a woman in her thirties, hair tied back, sleeves of undyed cotton.
- *The elder* — a calm man in his fifties with a short combed beard, shaved upper lip, a narrow
  fillet headband with a small circular ornament at the forehead.

---

## 4. Shot list

Each shot gives: cue, tag, the **keyframe image prompt** (make the first frame with an image
model, then animate it), the **video prompt**, and what to hand to the next shot.

### Shot 1 — Cotton (0:00–0:08) · quiet intro · EVIDENCED
- **Keyframe:** `STYLE.` Macro of open cotton bolls on green plants at dawn on a flat river floodplain, dew on the white fibre, a woman's hand just entering the frame to pick one. Haze, low gold light.
- **Video:** `STYLE.` Slow push-in on open cotton bolls at dawn. A hand gently plucks a boll and holds the white fibre to the light. Mist drifts over the floodplain behind. Very slow, steady.
- **Handoff:** hold on the tuft of fibre in her palm.

### Shot 2 — Spinning and weaving (0:08–0:16) · quiet → swell · EVIDENCED / IMAGINED
- **Keyframe:** `STYLE.` A woman seated in a courtyard spinning cotton with a small terracotta spindle whorl, the thread lengthening, undyed cloth stacked behind her.
- **Video:** `STYLE.` Close on a hand spinning a drop spindle with a small terracotta whorl; the thread twists and lengthens. Cut-in macro of hands passing a shuttle through taut cotton warp on a simple wooden frame loom. Cloth grows by a few finger-widths.
- **Handoff:** a finished length of plain cream cotton, stretched flat.

### Shot 3 — Madder and mordant (0:16–0:24) · groove enters · REPORTED
- **Keyframe:** `STYLE.` A dye yard: a clay vat with a rust-red bath, madder roots on a stone slab being ground, hands wringing cotton cloth, red staining the fingers.
- **Video:** `STYLE.` Hands grind dry madder roots on a stone quern into red-orange powder. The powder is stirred into water in a large clay vat; the water blooms deep red. A length of cotton is lowered in and lifted out, dripping, faintly pink.
- **Handoff:** red-stained hands lifting the wet cloth.

### Shot 4 — The block (0:24–0:32) · steady · IMAGINED
- **Keyframe A (wood):** `STYLE.` A craftsman carving a small wooden block with a copper chisel and mallet; the carved face shows a trefoil of three round lobes with a ring and dot in each; wood shavings on his lap.
- **Keyframe B (terracotta, alternative):** same, but the block is a hand-sized fired-clay stamp being finished with a bow drill.
- **Video:** `STYLE.` Close on a craftsman's hands drilling a small round hole with a bow drill into a wooden block, then touching the edge of a trefoil outline with a copper chisel. Wood curls fall. He blows away the dust and turns the block to the light: the carved face is a crisp trefoil. Attach a CC0 photograph of a real carved block (`assets/media/met-printing-block-india.jpg`) for the *look* of the tool only.
- **Handoff:** the block face, inked-looking and dark, tilted to camera.

### Shot 5 — Printing (0:32–0:40) · steady, building · IMAGINED
- **Keyframe:** `STYLE.` A woman pressing a carved wooden block onto a cotton cloth stretched flat on a low table, a clay tray of red paste beside her, a row of faint red trefoils already printed.
- **Video:** `STYLE.` Top-down then low-angle: a woman dips a carved block face into a shallow clay tray of thick red paste, lines it up on a stretched cream cotton cloth, and presses down firmly with both palms. She lifts it straight up: a clean red trefoil. She steps the block half a pitch sideways and down, and presses again. Staggered rows of trefoils grow across the cloth.
- **Handoff:** the finished row of trefoils, wet and bright.

### Shot 6 — Red and drying (0:40–0:47) · lift at 0:45 · REPORTED / IMAGINED
- **Keyframe:** `STYLE.` Printed cloth hung on a line in strong sun in the courtyard, deep red trefoils on cream, backlit, the cloth moving in a breeze.
- **Video:** `STYLE.` The printed cloth is carried to a stream and rinsed; excess paste clouds away; the trefoils stay and deepen to rich madder red on the pale cotton. The cloth is hung to dry in the sun, glowing as it sways. A gentle time-lapse feel.
- **Handoff:** backlit red cloth filling the frame.

### Shot 7 — The elder (0:47–0:55) · high energy · EVIDENCED (drape) / IMAGINED (man)
- **Keyframe:** `STYLE.` The elder, a calm bearded man with a fillet headband and a small round ornament on his forehead, standing in the courtyard as the printed cloth is draped over his **left** shoulder and under his **right** arm, trefoils catching the light, his right shoulder bare with a small round armband.
- **Video:** `STYLE.` Two pairs of hands lift the printed cloth and settle it over the left shoulder of a seated elder, then draw it under his right arm, tucking it. The trefoil pattern falls in staggered rows. He looks forward, eyes half-lowered. Slow push-in to his face and the pattern on his chest.
- **Handoff:** the diagonal edge of the cloth across his chest, trefoils in sharp focus.

### Shot 8 — The stone (0:55–1:04) · high, then resolve · EVIDENCED
- **Keyframe:** `STYLE.` A sculptor's hands finishing a small bust in pale soapstone: a copper chisel touching one trefoil on the shoulder, a bow-drilled ring, red paste being pressed into the carved grooves with a fingertip.
- **Video:** `STYLE.` Match cut from the trefoils on the cloth to the same trefoils in pale stone: a sculptor's hands drill a small ring and touch it up with a chisel, then press red paste into the grooves with a fingertip. The camera pulls back and slowly orbits the finished bust. Then fade to the 3D model (`assets/video/` frame: `prompts/reference/stone/three.png`).
- **End:** hold 1 s on the bust, then the closing card (§1) over a dark fade.

---

## 5. Optional shots for a 2-minute cut (the full track)

Use these for a longer page-level film. Same style prefix.

1. **Stretching the cloth** — hands pegging a cotton cloth taut on a courtyard floor with wooden pins.
2. **The stamp pad** — a close, slow shot of red paste being smoothed in a shallow clay tray.
3. **A market** — folded cloths on a stall; a trader compares two cloths, one plain, one printed.
4. **Dusk, the city** — the brick city from a rooftop at dusk, smoke, lamps coming on, cloth lines in silhouette.

---

## 6. Assembly

```bash
# put the clips in assets/video/clips/ named shot-01.mp4 … shot-08.mp4
python3 tools/build-hero.py            # uses assets/audio/temple.mp3 if present
```
`tools/build-hero.py` concatenates the clips, cross-fades 12 frames, adds the soundtrack with a
fade-in and fade-out, normalises to −16 LUFS (the supplied file is −9.7 LUFS and peaks over 0 dBFS),
and writes `assets/video/hero-shawl.mp4`, a WebM, and a poster frame. Until real clips exist, the
page plays the Blender placeholder (a sweep around the 3D model, stone then printed cloth).

## 7. Tool notes (check each tool's current limits — they change quickly)

- **Image-to-video is the right mode.** Make the keyframe first (an image model), then animate
  it. That fixes costume, set and the pattern far better than text alone.
- **Reference images:** attach the renders in `prompts/reference/` for the pattern and the bust;
  attach the CC0 museum photographs in `assets/media/` for the carved-block look.
- **Pattern drift:** video models often turn the trefoil into a four-leaf clover or a floral.
  Say "exactly three lobes" and keep a reference attached; reject any clip with four lobes.
- **Hands:** the weak point. Prefer close, short, slow shots; regenerate any clip with extra fingers.
- **Keep each clip to what the tool does well** (often 5–10 s). Don't ask for a long single take.
- **Safety of claims:** if a generated clip adds writing, a horse, an iron tool or a Pharaonic
  look, discard it. Do not fix it in the caption.
