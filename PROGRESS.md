# Progress — The Repeating Hand: A History of Block Printing

**Last updated:** 2026-11-21 · **Status:** first build. Runs end to end in a simulated DOM; **not yet opened in a real browser.**

## Where the project stands

| Layer | Status | Notes |
|---|---|---|
| Reference repos studied | done | `history-of-privacy` (architecture, citation standard) and `history-of-indigo` (events and images carried) |
| Research layer | **first pass** | 22 mapped events, 6 carried from the indigo study; 70 CONFIRMED, 5 PENDING, 6 DERIVED source objects, 24 institutions |
| Quote verification | done | `tools/check-quotes.py` re-reads every CONFIRMED source; all pass (a wrong Quseir quote was caught and fixed) |
| Data build and validator | done | `tools/build-data.mjs`, `tools/validate-data.mjs`: no errors |
| 3D model | done | `assets/models/priest-king-draco.glb` (2.1 MB, Draco + WebP, 345,600 triangles, stone + printed variants); glTF validator: no errors |
| Hero video | **placeholder** | A 12 s Blender sweep (stone dissolving to printed cloth). The real reconstruction video is to be generated from `prompts/HERO_VIDEO_PROMPTS.md` |
| Soundtrack | done | "Temple" by Jean du Voyage, rights confirmed by the owner 2026-11-21; terms to be recorded in `CONTENT_LICENSE.md` |
| Narrated demo | **built and tested** | `?demo` / the Demo button / `/tour/`. 14 steps, 2.2 min of narration (Kokoro `af_heart`), every take verified by transcription. Tested in real Chrome at desktop and phone size: voice, auto-advance, scroll, spotlight, card placement, model sweeps, map stops, slider, controls, close/reset, no errors. Not yet listened to by a person: the check catches a wrong word, not a wrong emphasis |
| The reel | **built** | `reel/`: 65 s, 1080 × 1920, 30 fps, −14.0 LUFS / −1.5 dBTP, recorded from the live site on a virtual clock (1,954 frames, none taken mid-load, no page errors). Kokoro `af_heart` voice, captions timed to the words, music bed, end card naming the GitHub repo. Cover and contact sheet checked by eye. **Not yet listened to by a person**; the flash check lists a 0.3 s scroll past bright photos (steps under 10 % luminance) |
| Reuse docs | done | `AGENTS.md` (map of every feature, workflow and engine) and `REUSE.md` (voice pipeline, tour overlay, reel engine: requirements, wiring, troubleshooting) |
| Picture archive | 25 images | 19 new (13 CC0, 6 Commons) + 6 carried from the indigo study. Adinkra cloth record present, file not yet mirrored (rate limit) |
| Page (HTML / CSS / JS) | built | Hero, 3D viewer, ledger, process, timeline map, spread chart, blue thread, claims, archive, source audit |
| Browser testing | **partial** | Simulated DOM (jsdom + real Leaflet): all sections render, interactions respond, scroll assist passes ten checks. In a real browser (desktop Chromium): the 3D model loads, both surfaces render (stone 0% madder red, printed 8%), hotspots work. **Not yet checked: the phone layout, the map and chart in a real browser** |
| Repo / publishing | **published** | Public repo `fritzhand/history-of-block-printing`, served by GitHub Pages from `main`. (Vercel was considered; the only scope the CLI could use was an employer's team, so Pages was chosen) |

## What the research found

- **No source read reports block printing from the Indus civilisation.** The cloak is carved stone. The page
  frames "printed?" as a hypothesis and shows what is evidenced, reported, not found and imagined.
- The Mohenjo-daro cotton's madder dyeing is only "reported" (Ashmolean); the lab result was "tentative" and the
  reported date (1760 BCE ±115) is after the urban period.
- Three of the four open-licence "Priest-King" photographs on Commons are casts or copies.
- Block printing reached Europe late (V&A: no evidence before the 14th century).
- The Met website and the Mawangdui museum pages could not be read; the Han printed gauze is PENDING.

## Corrections made along the way

- A search-summary quote about Quseir omitted "that was"; the verifier caught it.
- The Kenoyer 2017 PDF the search surfaced returns HTTP 410 and is not cited.
- "Gulati and Turner" as the Mohenjo-daro cotton's examiners was not confirmed; Marshall names James Turner.
- The Adinkra date: the British Art Studies article gives the Bowdich objects as presented in 1818 (formally added 1831).
- The Sketchfab Priest-King model is an AI generation (Tripo) with a tilted head; it is not used.
- **The 3D model failed to load on a phone after launch.** I had shipped it Meshopt-compressed after checking only that model-viewer 4.0.0's source contained the word "Meshopt"; in a real browser it fails (`Cannot read properties of undefined (reading 'scene')`). Draco + WebP loads, with the variants, at 2.1 MB. The shipped file is now `priest-king-draco.glb` (a new name, because browsers had cached the old URL), `tools/validate-data.mjs` refuses a Meshopt GLB, and `build-data.mjs` stamps asset URLs so a stale cache can't pair old and new files.

## Next

1. **Open it in a real browser** and fix what it shows (model-viewer decoding, hotspot positions, the sticky map on phones).
2. **Generate the hero video** from the prompts; run `python3 tools/build-hero.py`.
3. **Close the Tier 1 and Tier 2 gaps** in `ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md`.
4. Record the soundtrack's licence terms in `CONTENT_LICENSE.md`; mirror the Adinkra image.
