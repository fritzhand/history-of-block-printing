# Progress — The Repeating Hand: A History of Block Printing

**Last updated:** 2026-11-21 · **Status:** first build. Runs end to end in a simulated DOM; **not yet opened in a real browser.**

## Where the project stands

| Layer | Status | Notes |
|---|---|---|
| Reference repos studied | done | `history-of-privacy` (architecture, citation standard) and `history-of-indigo` (events and images carried) |
| Research layer | **first pass** | 22 mapped events, 6 carried from the indigo study; 70 CONFIRMED, 5 PENDING, 6 DERIVED source objects, 24 institutions |
| Quote verification | done | `tools/check-quotes.py` re-reads every CONFIRMED source; all pass (a wrong Quseir quote was caught and fixed) |
| Data build and validator | done | `tools/build-data.mjs`, `tools/validate-data.mjs`: no errors |
| 3D model | done | `assets/models/priest-king.glb` (2.8 MB, 345,600 triangles, stone + printed variants); glTF validator: no errors |
| Hero video | **placeholder** | A 12 s Blender sweep (stone dissolving to printed cloth). The real reconstruction video is to be generated from `prompts/HERO_VIDEO_PROMPTS.md` |
| Soundtrack | done | "Temple" by Jean du Voyage, rights confirmed by the owner 2026-11-21; terms to be recorded in `CONTENT_LICENSE.md` |
| Picture archive | 25 images | 19 new (13 CC0, 6 Commons) + 6 carried from the indigo study. Adinkra cloth record present, file not yet mirrored (rate limit) |
| Page (HTML / CSS / JS) | built | Hero, 3D viewer, ledger, process, timeline map, spread chart, blue thread, claims, archive, source audit |
| Browser testing | **not done** | Simulated DOM only (jsdom + real Leaflet): all sections render, interactions respond, no errors. Chart.js is stubbed and model-viewer is not loaded there |
| Repo / publishing | not done | No git repository, no commit, nothing pushed. The canonical URL in `index.html` assumes `fritzhand/history-of-block-printing` |

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

## Next

1. **Open it in a real browser** and fix what it shows (model-viewer decoding, hotspot positions, the sticky map on phones).
2. **Generate the hero video** from the prompts; run `python3 tools/build-hero.py`.
3. **Close the Tier 1 and Tier 2 gaps** in `ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md`.
4. `git init`, set the author per repo, create `fritzhand/history-of-block-printing`, push, enable Pages.
5. Record the soundtrack's licence terms in `CONTENT_LICENSE.md`; mirror the Adinkra image.
