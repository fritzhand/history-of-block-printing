# AGENTS.md: The Repeating Hand

For anyone, human or agent, who is about to change this repo or reuse its parts. Read this first; it says what is
here, how each piece is built, what must not be broken, and where the detail lives.

**What it is.** An open-data scrollytelling site on the history of block printing, built around one question: *was
the Priest-King of Mohenjo-daro's carved cloak printed?* Live: <https://fritzhand.github.io/history-of-block-printing/>
(GitHub Pages, `main`, repository root). It is a static site: no build step for the reader, no cookies, no
analytics, every asset path relative. Code is CC0 ([`LICENSE`](./LICENSE)); data and scripts are CC BY 4.0
([`CONTENT_LICENSE.md`](./CONTENT_LICENSE.md)).

**The honest answer the site gives:** the cloak is carved stone, so it shows that a trefoil pattern existed on a
garment, not how it was made. No printing block or printed cloth from Mohenjo-daro appears in the sources read.
Every feature below exists to keep that distinction visible. Do not blur it.

---

## 1. Features, and where each lives

| Feature | What it does | Files |
|---|---|---|
| Hero | Looping video (a Blender render until a reconstruction video exists), optional soundtrack, hero numbers that must be CONFIRMED | `index.html`, `assets/video/`, `assets/audio/hero-bed.mp3` |
| The Priest-King in 3D | `<model-viewer>`: a measured model of the bust; tappable hotspots with museum quotes; a switch between carved stone and an *illustration* of the pattern as printed cloth (glTF material variants); AR | `assets/models/priest-king-draco.glb`, `research/priest-king.json`, `js/app.js` |
| Evidence ledger | Claims tagged EVIDENCED / REPORTED / NOT FOUND / IMAGINED, each with its sources | `tools/editorial.mjs` → `js/data.js` |
| How a block print is made | Five steps from museum descriptions, plus generated swatches | `tools/editorial.mjs`, `assets/textures/` |
| Timeline map | Leaflet map and 18 scroll-driven steps, 5500 BCE to 2018, 22 mapped events | `research/*.json`, `js/app.js` |
| Spread chart and scrubber | Every event by region on a compressed time axis, with a year slider | `js/app.js` (Chart.js) |
| The blue thread | Where printing meets indigo; six events and six images carried from the indigo study | `research/indigo-crossover.json`, `research/media-indigo.json` |
| Claims to check | Popular statements that do not survive the sources | `tools/editorial.mjs` |
| Picture archive | 25 rights-cleared images, each licence read from its own record | `research/media*.json`, `assets/media/` |
| Source audit | Every source object, its quote and status, counted live | `js/app.js` |
| **Narrated demo** | A Demo button (`?demo`, `/tour/`): launcher, then a spotlight tour with a voice, captions, music | `js/demo.js`, `css/demo.css`, `data/demo/` |
| **Scroll assist** | Floating up/down: section to section and step to step through the timeline | `js/app.js` (`initSectionNav`) |
| Light / dark theme | Indigo night and unbleached cotton, remembered | `css/styles.css` custom properties |
| **The reel** | A 65-second vertical video of the live page, narrated, captioned, with an end card saying it is open source | `reel/` |
| Control API | `window.PrintApp`: how the tour and the reel drive the page | end of `js/app.js` |

---

## 2. Engines and workflows

Each of these is a pipeline with its own inputs, outputs and checks. The first one a change touches is usually the
right place to start.

### 2.1 Evidence data → the page
`research/*.json` (events with source objects) + `tools/editorial.mjs` (eras, steps, ledger, claims, process,
hotspots) → `tools/build-data.mjs` → **`js/data.js`** (`window.printData`, generated; never edit).
`build-data.mjs` also stamps a content hash into `index.html`'s asset URLs and `<meta name="asset-version">`, so a
changed file is never served stale. **Run it before every deploy.** `tools/validate-data.mjs` checks the schema,
the eras, the hero rule, that referenced files exist, that no local paths appear, and refuses a Meshopt GLB.

### 2.2 Citation standard and quote verification
Every claim carries `{ institution, title, date, url, quote, note, verificationStatus, accessType }`.
**CONFIRMED** = the cited page states it (`tools/check-quotes.py` finds the quote on the page or checks the museum's
catalogue fields against its API record); **PENDING** = named, not read; **DERIVED** = this study's reading, the note
says what it rests on. Hero and footer numbers must be CONFIRMED. Wikipedia is a lead, never a source. A quote must be
on the page: `tools/fetch-text.py URL --check "quote"` tests one. Do not paste a quote from a search summary without
reading the page (one such quote was wrong; the verifier caught it).

### 2.3 Picture archive
`research/media-manifest.json` (the picks) → `tools/mirror-media.py` → `research/media.json` + `assets/media/`, the
licence **read from each record** (museum or Commons API), never assumed. `tools/media-roll.mjs` regenerates the
media roll in `CONTENT_LICENSE.md`. An image ships only if its record states an open licence.

### 2.4 The 3D model
`3d/` builds the bust: a signed-distance base form, a baked normal map for beard, hair, trefoils and stone grain,
Blender for materials and renders, glTF with `KHR_materials_variants` (stone / printed). Compress with Draco + WebP:
**`model-viewer` 4.0.0 cannot load Meshopt** ("Cannot read properties of undefined (reading 'scene')"). Rebuild
commands are in [`3d/README.md`](./3d/README.md). Prompts for AI image-to-3D tools and for the hero video are in
`prompts/`. The model is an interpretation from museum photographs, not a scan; the page says so.

### 2.5 Hero video
A 12 s Blender placeholder today. `prompts/HERO_VIDEO_PROMPTS.md` has eight shots for an image-to-video tool;
`tools/build-hero.py` assembles clips and the soundtrack bed.

### 2.6 Voice pipeline (shared by the tour and the reel)
Script JSON → hashed lines → Kokoro-82M `af_heart` (open source) → −18 LUFS mono MP3 → transcribed back with
whisper and compared with the line → manifest of hashes and durations. A take is played only if its hash matches
its words. `tools/demo-voice.mjs`, `tools/demo-speak.py`, `tools/lib/voice-script.mjs`. Detail:
[`REUSE.md`](./REUSE.md) section 1.

### 2.7 Narrated tour overlay
`data/demo/script.source.json` (words + scenes, the only file you author) → `tools/demo-script.mjs` → `script.json` +
`js/demo-data.js`; `tools/demo-voice.mjs` records `assets/demo/voice/*.mp3`; `js/demo.js` + `css/demo.css` run it,
loaded on demand; `tools/validate-demo.mjs` refuses a broken tour. 14 steps, about 2½ minutes. Detail and how to port
it: [`REUSE.md`](./REUSE.md) section 2.

### 2.8 Reel engine
`reel/script.source.json` → voice → `reel/align.mjs` (word timings with whisper.cpp) → `reel/storyboard.mjs` (time →
page state, every change keyed to a spoken word) → `reel/record.mjs` (the page frame by frame on a **virtual
clock**, 1080 × 1920 at 30 fps) → `reel/assemble.mjs` (voice + ducked music, −14 LUFS, H.264/AAC, cover, contact
sheet, flash check). Output: `reel/out/the-repeating-hand-reel.mp4`. Detail: [`reel/README.md`](./reel/README.md)
and [`REUSE.md`](./REUSE.md) section 3.

### 2.9 Control API and scroll assist
`window.PrintApp` (end of `js/app.js`): `scrollToY`, `destOf`, `scrollToSection`, `goToStep`, `selectHotspot`,
`setVariant`, `orbit`, `setScrub`, `viewer`, `reduceMotion`. The tour and the reel use only this. Scroll assist
(`initSectionNav`, `scrollToSection`, `lockStoryStep`) makes anchor jumps re-assert their target while the page
settles and lets the map fly once to a step instead of through the ones it passes; a programmatic scroll calls
`jumpStop()` so a pending re-assert cannot fight it.

---

## 3. Repo map

```
index.html, css/, js/            the page (js/data.js and js/demo-data.js are generated)
research/                        evidence, quotes, picture records (the source of truth)
tools/                           build, validate, verify, mirror, voice, smoke-test (section 4)
data/demo/                       the tour's script (source + generated) and voice manifest
assets/                          models, video, audio, media, textures, demo voice takes
3d/                              Blender + Python to rebuild the model
prompts/                         hero-video and 3D-model prompts, reference renders
reel/                            the reel engine, its script, takes, timing, output
tour/index.html                  short link: redirects to ../?demo
AGENTS.md  REUSE.md  README.md   this map; how to reuse the engines; the overview
PROGRESS.md                      done / not done, for resuming
CONTENT_LICENSE.md               data licence, media policy, music, media roll
ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md   the brief for the next evidence pass
```

---

## 4. Commands

```bash
python3 -m http.server 8080                 # run locally (map tiles, fonts, libraries need a network)

node tools/build-data.mjs                   # research + editorial -> js/data.js; stamps asset hashes. Before every deploy
node tools/validate-data.mjs                # schema, eras, hero rule, files, no local paths, no Meshopt
python3 tools/check-quotes.py               # re-read every CONFIRMED source (beautifulsoup4, pdfminer.six, certifi)
python3 tools/mirror-media.py               # picture picks -> media.json + files, licence read per record
node tools/media-roll.mjs                   # regenerate the media roll in CONTENT_LICENSE.md
python3 tools/fetch-text.py URL --check "quote"

node tools/demo-script.mjs                  # tour script -> script.json + js/demo-data.js
node tools/demo-voice.mjs                   # record stale takes, verify, encode        (--check, --only, --all)
node tools/validate-demo.mjs                # the tour cannot ship broken

node reel/script.mjs
node tools/demo-voice.mjs --script reel/script.json --out reel/voice --manifest reel/voice-manifest.json --bitrate 96k
node reel/align.mjs
node reel/record.mjs --node-modules <dir with playwright>      # --stills 5,27 | --from 40 --to 52 | --url <local>
node reel/assemble.mjs

npm i --no-save jsdom@24 leaflet@1.9.4 && node tools/smoke-test.mjs .   # the page and tour in a simulated DOM
python3 tools/build-hero.py ; python3 tools/make-icons.py
```

---

## 5. Rules that keep it correct

1. **Generated files are not edited:** `js/data.js`, `js/demo-data.js`, `data/demo/script.json`,
   `data/demo/voice-manifest.json`, `reel/script.json`, `reel/timing.json`, `reel/voice-manifest.json`. Edit their
   sources and rebuild.
2. **Say what is known and how well.** Never promote a hypothesis to a finding. The printed-cloth surface is labelled
   an illustration. A new claim needs a source object with a quote read from the page, or it is PENDING or DERIVED.
3. **Rights.** An image ships only with an open licence stated by its own record. The soundtrack ("Temple", Jean du
   Voyage) is used with the owner's permission and its terms are not yet recorded; do not redistribute it. Kokoro-82M
   is Apache-2.0.
4. **After a changed word, re-record.** A stale take is never played, but the check cannot hear emphasis: listen to new
   takes. Run `node tools/validate-demo.mjs` before pushing.
5. **Before every deploy:** `build-data.mjs`, `validate-data.mjs`, `validate-demo.mjs`, then look at the page in a
   **real browser**. A simulated DOM does not run WebGL, model decoding or map tiles; the model once failed to load
   for a visitor while every simulated test passed.
6. **3D files: Draco + WebP, never Meshopt.** Give a replaced file a new name, because browsers cache by URL.
7. **Relative paths only** (the site is served under a subpath). No absolute URLs to the site's own files, no local
   machine paths and no names of other projects, clients or private folders in anything tracked, committed or pushed.
   The repo is public and self-contained.
8. **Git.** Commit under the maintainer's own identity set per-repo (not globally). Check what a push puts in front
   of readers (minutes, transcripts, candid assessments) before pushing.
9. **Recording uses a real Chrome** with GPU WebGL (`--use-angle=metal` on macOS) and `--autoplay-policy=no-user-gesture-required`.
   Playwright's `waitForFunction` must poll on a number under the reel's virtual clock.
10. **Do not claim what was not checked.** If a step was only run in a simulated DOM, or a take was only machine-checked,
    say so.

---

## 6. Open items (see [`PROGRESS.md`](./PROGRESS.md))

- The hero video is a **placeholder**; the reconstruction video is to be generated from the prompts.
- Han printed gauze is **PENDING** (the Met and museum pages could not be read); the Adinkra image record exists but
  the file is not mirrored (rate limit).
- The soundtrack's licence terms are not recorded in `CONTENT_LICENSE.md`.
- Narration takes have been machine-checked, not listened to by a person.
- The phone layout of the map, chart and AR has not been fully checked in a real browser.
- The Tier 1 and Tier 2 research gaps in `ARCHIVAL_RESEARCH_PROMPT_BLOCKPRINTING.md`.

---

## 7. Reusing the parts elsewhere

The voice pipeline, the narrated tour and the reel engine are separable from this site. **[`REUSE.md`](./REUSE.md)**
has the requirements, the wiring, the files to copy, the contract with the page, how the virtual-clock recorder
works, what went wrong and how it was fixed, and troubleshooting. The data pipeline (research JSON with verified
quotes → one generated data file) is the same architecture as the sibling studies this site was forked from.
