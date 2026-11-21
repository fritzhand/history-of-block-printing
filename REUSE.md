# Reusing the narrated tour and the reel

This repo carries two engines that were built for this site but are separable from it, and one voice pipeline
they share. The code is CC0 ([`LICENSE`](./LICENSE)): copy it, change it, ship it, no credit needed.

| Engine | What it makes | Where it lives | Use it when |
|---|---|---|---|
| **Voice pipeline** | One MP3 per line of a script, checked against the words, with durations | `tools/demo-voice.mjs`, `tools/demo-speak.py`, `tools/lib/voice-script.mjs` | You want an open-source narrator, re-recorded only for the lines that changed |
| **Narrated tour overlay** | A **Demo** button: a launcher card, then a spotlight tour of the page with a voice, captions and a music bed | `js/demo.js`, `css/demo.css`, `data/demo/`, `tools/demo-*.mjs`, `tools/validate-demo.mjs` | You want visitors to hear a guided walk-through of a live page |
| **Reel engine** | A vertical video (1080 × 1920) recorded from the live page, with voice, captions, music and an end card | `reel/` | You want a social video that is the real site, redoable when the site changes |

Both engines drive the page through a small control API (`window.PrintApp`, section 2.3) and need nothing else
from it. [`AGENTS.md`](./AGENTS.md) maps the rest of the repo.

---

## 0. What you need

| Tool | For | Notes |
|---|---|---|
| Node 20+ | everything | The tour needs no npm packages. The reel needs Playwright (below) |
| Python 3.11 with `kokoro` and `soundfile` | the voice | `python3.11 -m venv .venv && .venv/bin/pip install kokoro soundfile`, then `.venv/bin/python -m spacy download en_core_web_sm` (Kokoro's text front end). If Kokoro asks for `espeak-ng`, install it with your package manager. The tool looks for `.venv/bin/python` in this repo; point it elsewhere with `--voice-env DIR` or `VOICE_ENV=DIR` (a folder whose `.venv` has those packages) |
| ffmpeg 6+ | encoding, loudness, the reel's mix | Built and tested with 9.0 |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) `whisper-cli` and `~/.cache/whisper/ggml-small.en.bin` | checking each take against its words; the reel's caption timing | Optional for the tour (use `--no-verify`), required for the reel's `align.mjs` |
| Google Chrome and [Playwright](https://playwright.dev) 1.49 | the reel; testing the tour in a real browser | Not a dependency of the site. `npm i playwright` in any folder, then `--node-modules <that folder>/node_modules`. A real Chrome (not the bundled headless shell) gives real GPU WebGL, which a 3D page needs |

---

## 1. The voice pipeline (both engines use it)

**The voice** is Kokoro-82M's `af_heart` (Apache-2.0 code and weights): open source, runs on a laptop, clones no
one. Change `voice.voice` (`bf_*` voices are British) or `voice.speed` in the script and every line goes stale.

**One script format.** A script is JSON: `voice`, an optional `pronounce` map, and `steps`, each with an `id` and
`text`.

```json
{
  "voice": { "engine": "Kokoro-82M", "voice": "af_heart", "speed": 1.0 },
  "pronounce": { "Mehrgarh": "Mair-gar", "GitHub": "Git-Hub" },
  "steps": [ { "id": "hook", "text": "About four thousand years ago, a king…" } ]
}
```

`tools/lib/voice-script.mjs` turns each step's text into `say` (the words as spoken, after the `pronounce`
respellings) and a `hash` of `say + engine + voice + speed`. **A take is current only if its hash matches**, so
editing a word marks exactly that line stale and nothing else. Write numbers and symbols as you want them said
("three-D", "four thousand"); the respelling map is for names.

**Recording** (`tools/demo-voice.mjs`):

```bash
node tools/demo-voice.mjs --script <script.json> --out <voice dir> --manifest <manifest.json> --bitrate 96k
```

It speaks the stale lines, normalises each to −18 LUFS mono, encodes MP3, **transcribes every take back with
whisper and compares it with the line, letters only** (it fails above about 10 % error), and records the hash and
duration in the manifest. Other flags: `--check` (list what is stale; exit 1 if any, good for CI), `--only a,b`,
`--all`, `--no-verify`, `--voice-env DIR`. Defaults are the tour's paths.

**Be honest about what the check proves.** It catches a dropped, mangled or changed word. It cannot hear a wrong
emphasis or an odd pause. Listen to every take before you publish.

---

## 2. The narrated tour overlay

### 2.1 What a visitor sees

A **Demo** button (also `?demo`, `?demo=<chapter>`, and a `/tour/` short link) opens a launcher card: a short
brief, chapter pills, a length ("about two and a half minutes") and **Start**. Start is a real click, because
browsers play sound only after the visitor has acted. Then, step by step: the page scrolls and the scene changes
(a 3D model turns, a map flies, a slider sweeps), a spotlight dims everything but the target, a caption card shows
the words, the voice take plays, and the tour moves on when the take ends. Keys: `Esc` closes, `←` `→` step,
`Space` pauses. A music bed plays under the voice and ducks while it speaks. With no take for a step, the card
shows the words and runs at reading pace, so the tour still works without audio.

### 2.2 Files

| Copy | What it is |
|---|---|
| `js/demo.js`, `css/demo.css` | The overlay. Loaded on demand, so the page does not pay for it |
| `tools/demo-script.mjs`, `tools/demo-voice.mjs`, `tools/demo-speak.py`, `tools/lib/voice-script.mjs` | Script → takes → `js/demo-data.js` |
| `tools/validate-demo.mjs` | The tour cannot ship broken (below) |
| `data/demo/script.source.json` | **Your** words and scenes: the only file you author |
| `assets/audio/demo-bed.mp3` | A music bed. Use music you have the rights to |
| `tour/index.html` | Optional: a short link that redirects to `../?demo` |

Generated, never edited: `data/demo/script.json`, `data/demo/voice-manifest.json`, `js/demo-data.js`,
`assets/demo/voice/*.mp3`.

### 2.3 Wire it into a page

**1. Mark what the tour can point at.** Give each target `data-tour="<key>"`:
`<section data-tour="map">…</section>`. A step's `spot` names a key.

**2. Give the page a control API.** `js/demo.js` calls `window.PrintApp`. Every method is optional; a missing one
just skips that kind of scene.

| Method | Used for |
|---|---|
| `scrollToSection(el)` | A scene with `section` |
| `goToStep(el)` | A scene with `story`: scroll to a timeline step so the page and map follow |
| `setVariant(name)` | Switch a 3D model's surface (a glTF material variant) |
| `selectHotspot(slot \| null)` | Open or close a hotspot on the model |
| `orbit("<az>deg <pol>deg <r>m", jump)` | Move the model's camera; `jump` skips the camera's easing |
| `setScrub(n)` | Move a slider or scrubber |
| `scrollToY(y)`, `destOf(el)` | Scroll helpers; also used by the reel |

If a scene has no `section` or `story`, the tour scrolls the spotlight target into view itself. This site's
implementation is the block at the end of `js/app.js` (`const api = { … }; window.PrintApp = api;`); copy its shape.
`resetScene()` in `js/demo.js` puts this site's defaults back on close (stone surface, slider at 1000, an orbit):
edit it for yours.

**3. Rename for your project.** The overlay is namespaced to this site: `PrintApp`, `PrintDemo`, `PrintDemoData`,
the `Print*` words in `js/demo.js`, `tools/demo-script.mjs`, `tools/validate-demo.mjs`, and the CSS class prefix
`demo-` (which you can keep). Search and replace across those files.

**4. Load it.** Add a button and a lazy loader (this site's is `initDemoEntry()` in `js/app.js`):

```html
<meta name="asset-version" content="0" />
<button id="demo-btn" type="button">Demo</button>
```

The loader appends `css/demo.css`, then `js/demo-data.js`, then `js/demo.js` on the first click, each with
`?v=<asset-version>`, and opens `window.PrintDemo.open(chapter)`. It also opens the launcher when the URL has
`?demo`. `tools/build-data.mjs` stamps a content hash into that meta tag and into the asset URLs so a changed file
is never served stale from a cache; keep that idea in your build, or visitors will keep an old tour after you
update it.

**5. Write the script** (`data/demo/script.source.json`):

| Field | Meaning |
|---|---|
| `voice`, `pronounce` | As in section 1 |
| `title`, `lede` | The launcher's heading, and its brief: the hook. Make it intriguing and honest |
| `chapters[]` | `{ id, title }`: the pills and the length per chapter |
| `steps[].id`, `.chapter` | Unique id (also the take's file name) and its chapter |
| `steps[].title` | The card's heading |
| `steps[].spot` | A `data-tour` key to spotlight |
| `steps[].text` | The words, shown on the card. Add `say` to speak something different |
| `steps[].scene` | What the page does (below) |
| `steps[].link` | `{ href, label }`: a button on the card (this site's last step links to the repo) |

Scene keys: `section` (an element id to scroll to), `story` (a list of timeline-step ids to visit in turn, spread
across the step's length), `variant`, `hotspot` (a slot, or `null`), `orbit` (a starting camera), `sweep`
(`[from, to]` azimuth degrees, turned across the step), `scrub` (a slider value), `scrubSweep` (`[from, to]`).
To add a new kind of scene, add a line to `applyScene()` and `resetScene()` in `js/demo.js`.

**6. Build, record, validate.**

```bash
node tools/demo-script.mjs      # script.source.json -> script.json + js/demo-data.js
node tools/demo-voice.mjs       # speak what is stale, verify, encode, then rebuild demo-data.js
node tools/validate-demo.mjs    # every step has a current take; every spot, event, hotspot, variant, section is real
```

### 2.4 Test it

1. `node tools/validate-demo.mjs`: fails on a stale or missing take, an unknown `spot`, a story id that does not
   exist, a malformed orbit.
2. `tools/smoke-test.mjs` runs the page and the tour in a simulated DOM (jsdom) with media stubs: launcher, Start,
   Next, card placement, Esc. It is not a browser.
3. **Run it in a real browser.** Launch Chrome with `--autoplay-policy=no-user-gesture-required`, click Start with a
   real click, and check each step: the spotlight inside the viewport, the card not covering the spotlight, the
   take playing, the step advancing by itself, the scene doing what the words say, `Esc` resetting the page, and
   no console errors. Do it at a phone size too. The cases that broke this tour were all of that kind (below).

### 2.5 What went wrong first (so it does not go wrong for you)

| Symptom | Cause | Fix |
|---|---|---|
| A step did not scroll | An earlier smooth-scroll re-assert timer fought the new scroll | `scrollToY` cancels any pending re-assert |
| The caption card covered a tall target | The spotlight was taller than the room left for the card | `layout()` caps the spotlight's height to the space above or below the card |
| The spotlight was off a section that was still loading | Lazy images above it moved the layout after the scroll | `ensureVisible` re-checks the target at 1.5 s and 3.2 s |
| A visitor still saw the old tour | Cached `demo.js` and `demo-data.js` | Content-hash version string on every asset URL |
| The 3D model would not load | `model-viewer` 4.0.0 cannot read Meshopt-compressed glTF | Compress with Draco; the validator fails a Meshopt file |

---

## 3. The reel engine

### 3.1 What it makes

A vertical video of the **real page**: 1080 × 1920, 30 fps, H.264 High, AAC 48 kHz, −14 LUFS and a true peak of at
most −1 dBTP, with a title card, captions of at most eight words timed to the spoken words, a music bed that ducks
under the voice, and an end card. Redo it when the site changes: it is a script, not an edit.

### 3.2 How it works

```
script.source.json ─script.mjs→ script.json ─tools/demo-voice.mjs→ voice/*.mp3 + voice-manifest.json
                                                      │
                                     align.mjs ◀──────┘   whisper.cpp: when each word is spoken
                                         │
                                    timing.json
                                         │
storyboard.mjs     time → page state, every change keyed to a spoken word
      │
record.mjs  ─→ build/video.mkv      the page, frame by frame, on a virtual clock
      │
assemble.mjs ─→ out/*.mp4, cover.jpg, contact-sheet.jpg      voice + music + loudness + final encode
```

`record.mjs` does not film a screen. `lib/virtual-time.js` replaces the page's clocks (`performance.now`, `Date`,
timers, `requestAnimationFrame`, and every Web Animation, which covers CSS transitions) with a clock that moves
only when the recorder says. For each frame the recorder (1) asks the storyboard for the page's state at that time,
(2) applies it through the control API, (3) advances the virtual clock 1/30 s, (4) waits in **real** time for
anything that would show but is still loading (map tiles, images, the 3D model, a video seek), and (5) takes a
screenshot at 2.5× (a 432 × 768 viewport becomes 1080 × 1920). So a slow frame cannot cause a dropped frame, and
two runs give the same video.

### 3.3 What is generic and what is yours

| File | |
|---|---|
| `lib/virtual-time.js`, `assemble.mjs`, `align.mjs`, `script.mjs` | **Generic.** Change flags, not code |
| `record.mjs` | **Generic, except its boot block:** it waits for `PrintApp.viewer` and switches the surface once to warm the model. Edit those lines for your page |
| `script.source.json` | **Yours:** the words (five to seven takes; about a minute) |
| `storyboard.mjs` | **Yours:** `ORDER` (the takes), `SEL` (page anchors), `scrollKeys()` (where the page scrolls), `stateAt()` (the model's angle, the surface, which overlay shows) |
| `lib/page.js` | **Mostly yours:** the title and end card text and colours, `apply()` (how a state becomes calls on your page), and `pending()` (what counts as "still loading": the 3D model, the map's tiles, the hero video) |

### 3.4 Adapt it, step by step

1. **Write the script.** One take per beat of what you want the viewer to see, about 150 words in all. Say what is
   on screen as it is on screen.
2. **Record the voice and time the words.**
   ```bash
   node reel/script.mjs
   node tools/demo-voice.mjs --script reel/script.json --out reel/voice --manifest reel/voice-manifest.json --bitrate 96k
   node reel/align.mjs
   ```
   `align.mjs` matches your words to what whisper heard, letters only, so a respelled name still lines up; a word it
   cannot place is spread evenly between its neighbours (it tells you which).
3. **Edit `lib/page.js`.** Replace the title card text, the end card text (your repo and site addresses, licences),
   and the colour constants. Make `apply()` call your page's own API (this one calls `PrintApp.setVariant`,
   `.selectHotspot`, `.orbit`, and `window.scrollTo`). Overlays use your page's fonts through its CSS variables, so
   they match.
4. **Edit `storyboard.mjs`.**
   - `ORDER`: your takes, in order.
   - `SEL` and `scrollKeys()`: anchors are `{ sel, off }`: a CSS selector and a pixel offset, resolved **every frame**
     (never once, because lazy images shift layout). `key(time, place, mode)` adds a scroll keyframe; the page eases
     from one place to the next (`'ease'`, `'sine'`, or `'linear'` for a slow drift).
   - **Cues:** `cue('take', 'word')` is the time the word is spoken. Key every change to one (a surface switch on the
     word "printed", a map stop on "Egypt") and the picture lands with the voice. Aim a move to arrive a little
     before its word; give a map that flies about 0.6 s.
   - `stateAt(t)`: the model's angle, the variant, the overlays' opacity. A pure function of time.
   - `VIEW` and `DPR`: the viewport and scale. 432 × 768 at 2.5 is 9:16 at 1080 × 1920. For 4:5 use 432 × 540 at
     2.5 (1080 × 1350); for 1:1, 432 × 432.
5. **Preview before you commit three minutes to a full run.**
   ```bash
   node reel/record.mjs --node-modules <dir> --stills 5,27,44              # one PNG per time, build/stills/
   node reel/record.mjs --node-modules <dir> --from 40 --to 52             # a clip, build/preview.mkv
   node reel/record.mjs --node-modules <dir> --url http://localhost:8080/  # a local copy instead of the live site
   ```
   Look at the stills. Check each caption against the content under it.
6. **Record and assemble.**
   ```bash
   node reel/record.mjs --node-modules <dir>      # about three minutes for 65 s of video
   node reel/assemble.mjs                         # out/*.mp4, cover.jpg, contact-sheet.jpg, a loudness and flash report
   ```
7. **Check what the report cannot.** View `contact-sheet.jpg` and the cover. Watch the video with sound. Confirm the
   loudness line says −14 LUFS and a true peak at or under −1 dBTP, and that the flash check lists no large sudden
   brightness change (the report counts any step of more than 14 of 255 between frames; the web
   accessibility guideline, WCAG 2.3.1, counts a pair of opposing luminance changes of 10 % or more as a flash and
   allows at most three in a second).

### 3.5 Rules the reel follows

- **Safe zones.** Captions sit between about 70 % and 79 % of the height, clear of the top 12 % and the bottom 18 %
  that the apps cover with their own buttons. Keep your own overlays inside that band.
- **Captions** are at most eight words, broken at punctuation, never across a sentence end, and start on their first word.
- **The first frame is the cover.** The title card is whole from frame 0 and fades out, so an app that takes the
  first frame as the cover gets a finished one. `assemble.mjs` also writes `cover.jpg` from 0.4 s.
- **Sound.** Voice takes sit at the times the storyboard gives; the music loops with a crossfade to the reel's
  length, is ducked by the voice, swells at the end card, and the mix is matched to −14 LUFS in two passes.

### 3.6 What the virtual clock cannot do, and what to do instead

| Thing | Why | What the recorder does |
|---|---|---|
| `<video>` playback | It runs on the media clock | Pauses the video and seeks it to the frame's time, waiting for `seeked` |
| Smooth scrolling | The compositor animates it | Scrolls with `scrollTo({ behavior: 'instant' })` every frame |
| Network, image decoding, fonts | Real time | Waits (`pending()` in `lib/page.js`), up to 8 s a frame, and says which frame was slow |
| Lazy images | They load when scrolled near | A warm-up pass scrolls the whole page once before frame 0 |
| WebGL (a 3D model) | It draws on `requestAnimationFrame`, which the virtual clock owns | Works as is; use a real Chrome with GPU flags so it is not software-rendered |

### 3.7 What went wrong first

| Symptom | Cause | Fix |
|---|---|---|
| The screenshot was 432 × 768, not 1080 × 1920 | The DevTools screenshot ignores the device scale unless given a clip scale | `clip: { …, scale: DPR }` |
| A scrolled frame showed the top of the page | The clip is in **document** coordinates | Start the clip at `window.scrollY` |
| Map tiles were blank during a long fly | Leaflet loads tiles only when a move ends if it thinks it is on a phone | Phone-**sized**, not phone-emulated: `isMobile: false` (the layout follows the width) |
| The recorder hung at load | Playwright's `waitForFunction` polls on `requestAnimationFrame` by default, which the page's clock now owns | Poll on a number: `{ polling: 100 }` |
| A heading was hidden under a caption | The scroll held where a heading met the caption band | Choose holds (`off`) so headings fall above or below the band |
| A long swipe looked like a flash | A cubic ease crossed bright photos at very high speed | Start the move earlier and use the `'sine'` ease |
| True peak came out at −0.9 dBTP | `loudnorm` can land slightly over its target | Aim the target at −1.5 |

---

## 4. Troubleshooting

| You see | Look at |
|---|---|
| `no Python environment at …/.venv/bin/python` | Section 0: create the venv (in the repo, or elsewhere and pass `--voice-env`) |
| `voice: N line(s) have no current take` | A word changed. Run `node tools/demo-voice.mjs` |
| A take fails the transcription check | Read the take's line aloud: a number or a name. Respell it in `pronounce`, or write it out in words |
| `✗ <id>: no current take` from `align.mjs` | Record the voice first (the manifest's hash must match) |
| `cue: no word "x" in "take"` | The word is not in that take's text; cues match the start of a word, letters only |
| `frame N … still loading: map tiles` | A slow network. The frame is still taken; re-run, or record a local copy with `--url` |
| The 3D model is blank in the recording | Chrome was started without a GPU: use the system Chrome and `--use-angle=metal` (macOS) or your platform's equivalent |
| Voice and picture drift | `align.mjs` placed words by spacing: check its output for "placed by spacing", and move your cue to a word it matched |

---

## 5. Rights

- **Code:** CC0. **Data and scripts:** CC BY 4.0 ([`CONTENT_LICENSE.md`](./CONTENT_LICENSE.md)).
- **Voice:** Kokoro-82M, Apache-2.0. Keep that notice if you redistribute the model; the recordings are yours.
- **Music:** the bed in this repo is used with the owner's permission and is **not** yours to reuse. Bring your own.
- **Pictures and the 3D model:** each carries its own licence. A reel shows whatever your page shows, so it is only
  as clear as the page.
- **Say what is true.** The tour and the reel say what is known and how well. Keep your claims as careful as your
  sources.
