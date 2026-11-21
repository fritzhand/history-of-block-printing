# The Repeating Hand: A History of Block Printing

An open-data, scrollytelling data-journalism site on **block printing**, built around one question:
*was the Priest-King of Mohenjo-daro's carved cloak printed?* It follows the evidence for printing on
cloth from the Indus to Gujarat, Egypt, China, West Africa and Europe, and sorts every claim into
**evidenced**, **reported**, **not found** or **imagined**.

**The honest answer so far:** the cloak is carved stone, so it shows that a trefoil pattern existed on a
garment, not how it was made. No printing block or printed cloth from Mohenjo-daro appears in the sources
read. The page says so, and the hero video is labelled a reconstruction.

It is a domain fork of [`fritzhand/history-of-privacy`](https://github.com/fritzhand/history-of-privacy),
itself a fork of [`fritzhand/history-of-indigo`](https://github.com/fritzhand/history-of-indigo): the same
architecture and citation standard, a different subject. Six events and six images are carried over from the
indigo study, with their sources unchanged.

**Live:** <https://fritzhand.github.io/history-of-block-printing/> (GitHub Pages, from the `main` branch, repository root).
Every asset path is relative, so the site works unchanged under the `/history-of-block-printing/` subpath. No cookies, no analytics.

## What you get

| Layer | Implementation |
| --- | --- |
| Hero | A looping video (a render of the 3D model until a reconstruction video exists) with an optional soundtrack |
| The Priest-King, in 3D | `<model-viewer>`: a measured model of the bust, tappable hotspots with quotes, a switch between carved stone and an *illustration* of the pattern as printed cloth (glTF material variants), AR at true size |
| Evidence ledger | Eight claims tagged EVIDENCED / REPORTED / NOT FOUND / IMAGINED, each with its sources |
| How a block print is made | Five steps from museum descriptions, plus generated swatches (madder print, indigo resist, cotton, steatite) |
| Timeline | A Leaflet map and 18 scroll-driven steps, 5500 BCE to 2018, 22 mapped events |
| Spread chart and scrubber | Every event by region on a compressed time axis, with a year slider |
| The blue thread | Where printing meets indigo, with a map and cards carried from the indigo study |
| Claims to check | Six popular statements that do not survive the sources |
| Picture archive | 25 rights-cleared images, each with its licence read from its own record |
| Source audit | Every source object, its quote and its status, counted live |
| Scroll assist | A floating up/down pair, as on the other studies: it steps section by section and step by step through the timeline (the map flies once to each step, not through the ones it passes), and anchor jumps re-assert their target while the page settles |
| Light / dark theme | Indigo night and unbleached cotton, remembered between visits |

## Run locally

A static site with no build step for the reader.

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Map tiles, fonts, Leaflet, Chart.js and model-viewer load from CDNs, so the page needs a network.

## How the data is made

```
research/indus.json, printing.json   the evidence: events with source objects that carry the
                                     exact supporting quote (and checkUrl / checkFields for re-checking)
research/indigo-crossover.json       six events carried unchanged from the indigo study
research/priest-king.json            feature-level quotes for the 3D hotspots
research/media.json, media-indigo.json   the picture archive, licences read from each record
research/media-manifest.json         the picks that tools/mirror-media.py turns into media.json
tools/editorial.mjs                  the judgement layer: eras, steps, ledger, claims, process, hotspots
tools/build-data.mjs                 compiles it all into js/data.js
```

`js/data.js` is generated. Edit the research or editorial layer and rebuild.

## Tools

```bash
python3 tools/check-quotes.py        # re-read every CONFIRMED source; needs beautifulsoup4, pdfminer.six, certifi
node tools/build-data.mjs            # research + editorial -> js/data.js
node tools/validate-data.mjs         # schema, eras, hero rule, files exist, no local paths
python3 tools/mirror-media.py        # media-manifest.json -> media.json + assets/media/ (licence read per record)
node tools/media-roll.mjs            # regenerate the media roll in CONTENT_LICENSE.md
python3 tools/fetch-text.py URL --check "quote"   # is this sentence really on that page?
python3 tools/build-hero.py          # assemble the hero video from clips, plus the soundtrack bed
python3 tools/make-icons.py          # favicon, touch icon, share card
npm i --no-save jsdom@24 leaflet@1.9.4 && node tools/smoke-test.mjs .   # run the page in a simulated DOM
```

## The 3D model, the video and the prompts

- `3d/` builds the model: a signed-distance base form, a baked normal map for the beard lines, hair, trefoils
  and stone grain, Blender for materials and renders, glTF with material variants. See [`3d/README.md`](./3d/README.md).
- `prompts/HERO_VIDEO_PROMPTS.md`: eight shots, each with an image prompt, a video prompt, an evidence tag and a
  soundtrack cue, for an image-to-video tool.
- `prompts/3D_MODEL_PROMPTS.md`: prompts and a checklist for AI image-to-3D tools, and what went wrong in the
  one Sketchfab model tried.
- `prompts/reference/`: neutral-background renders of both surfaces, for use as reference images.

## Citation standard

Every claim carries a source object `{ institution, title, date, url, quote, note, verificationStatus, accessType }`.

- **CONFIRMED**: the cited page states it. `tools/check-quotes.py` finds the quote on the page, or checks the
  museum's catalogue fields against its API record.
- **PENDING**: a credible source is named but was not read.
- **DERIVED**: this study's own reading; the note says what it rests on.
- Hero and footer numbers must be CONFIRMED. Wikipedia is a lead, never a source. An image is published only if
  its record states an open licence.

## Planning documents

| File | Purpose |
|---|---|
| [`ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md`](./ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md) | Research brief for the next evidence pass |
| [`PROGRESS.md`](./PROGRESS.md) | Done / not-done checkpoint for resume |
| [`research/FIRST-PASS-NOTES.md`](./research/FIRST-PASS-NOTES.md) | Working notes from the first research pass |
| [`CONTENT_LICENSE.md`](./CONTENT_LICENSE.md) | Data licence, media policy, music, media roll |

## Design

Editorial, after the Indigo and Privacy studies: Crimson Pro for headlines, Work Sans for the rest. Two grounds,
indigo night and unbleached cotton. Madder red is the accent; the seven eras are named colours (cotton ochre,
madder, violet, sea teal, chintz gold, indigo, leaf green); the four evidence tags are green, amber, red and
violet. The palette lives in `css/styles.css` as custom properties, once per theme, and `js/app.js` reads it
from there.

## Built with

Leaflet · Chart.js · model-viewer · Blender · gltf-transform · Esri canvas tiles · Crimson Pro / Work Sans

## Credit

Research, data and build by Jeremy Fritzhand
([GitHub](https://github.com/fritzhand) · [LinkedIn](https://www.linkedin.com/in/fritzhand/)), with Claude Code.
Music: "Temple" by Jean du Voyage.
