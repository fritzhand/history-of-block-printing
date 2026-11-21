# The reel

A 65-second vertical video (1080 × 1920, 30 fps) of the live site, narrated, with captions, music and an end card
that says the project is free and open source. It is recorded from the real page, not mocked up, and it is
rebuilt from the files in this folder: change a word in the script and run the steps again.

To reuse this engine on another site, read [`REUSE.md`](../REUSE.md) section 3. This file describes the reel as it is.

**Output:** `out/the-repeating-hand-reel.mp4`, with `out/cover.jpg` (the title card) and `out/contact-sheet.jpg`.

## What it says

Six lines, spoken by Kokoro-82M's `af_heart` voice (Apache-2.0, open source, clones no one):

| Take | On screen |
|---|---|
| `hook` | Title card, then the hero: a king carved in the Indus Valley, a cloak of three-leaf patterns, was it printed? |
| `what` | The hero's numbers: an open-data history of block printing |
| `king` | The 3D Priest-King turns; the surface switches from stone to printed cloth on the word "printed" |
| `proof` | The ledger of claims: evidenced, reported, not found, imagined |
| `history` | The map and timeline, stop by stop: Mehrgarh, Egypt, Cairo, European calico |
| `open` | End card: free and open source, the GitHub address, "Fork it. Reuse it." |

## How it is made

```
script.source.json ──script.mjs──▶ script.json ──tools/demo-voice.mjs──▶ voice/*.mp3 + voice-manifest.json
                                                          │
                                         align.mjs ◀──────┘   (whisper.cpp: when each word is spoken)
                                             │
                                        timing.json
                                             │
storyboard.mjs  (time → page state; every change keyed to a spoken word)
      │
record.mjs ──▶ build/video.mkv          (the site, frame by frame, on a virtual clock)
      │
assemble.mjs ──▶ out/the-repeating-hand-reel.mp4   (voice + music + loudness + final encode)
```

```bash
node reel/script.mjs
node tools/demo-voice.mjs --script reel/script.json --out reel/voice --manifest reel/voice-manifest.json --bitrate 96k
node reel/align.mjs
node reel/record.mjs --node-modules <a folder that has playwright installed>
node reel/assemble.mjs
```

Needs Node 20+, ffmpeg, Google Chrome, [Playwright](https://playwright.dev) (not a dependency of the site; point
`--node-modules` at any folder that has it), and for the voice: whisper.cpp and a Python environment with
[Kokoro](https://github.com/hexgrad/kokoro) (see `tools/demo-voice.mjs`).

### The recorder

`record.mjs` does not film the screen. It replaces the page's clocks with a virtual one (`lib/virtual-time.js`), so
`requestAnimationFrame`, timers, CSS transitions and the map's and the model's animations all move only when the
recorder says. For each of the 1,954 frames it:

1. asks `storyboard.mjs` what the page should look like at that moment (scroll position, camera angle, surface,
   captions, cards);
2. puts the page in that state through its own control API, `window.PrintApp`, and `window.scrollTo`;
3. moves the virtual clock on by 1/30 s;
4. waits, in real time, for anything still loading that would show (map tiles, images, the 3D model);
5. takes a screenshot at 2.5× (a 432 × 768 viewport becomes 1080 × 1920).

So the video is smooth however long a frame takes to draw, and two runs give the same video. Nothing is injected into
the site except the clock and the overlays (`lib/page.js`).

Preview without recording everything:

```bash
node reel/record.mjs --node-modules … --stills 5,27,44        # one PNG per time, in build/stills/
node reel/record.mjs --node-modules … --from 40 --to 52       # a clip, build/preview.mkv
node reel/record.mjs --url http://localhost:8765/ …           # record a local copy instead of the live site
```

### Sound

`assemble.mjs` places each take at the time `storyboard.mjs` gives it, loops the music bed
(`assets/audio/demo-bed.mp3`) with a crossfade to the reel's length, ducks it under the voice, lets it swell at the
end card, then matches the mix to **−14 LUFS integrated, −1 dBTP** with a two-pass `loudnorm`. The voice takes are
checked against their script by transcribing them back (`tools/demo-voice.mjs`), which catches a dropped or changed
word but not a wrong emphasis, so listen to them.

### Captions

Phrases of at most eight words, broken at punctuation, timed by the words they start and end on (`align.mjs`).
They sit in the 9:16 safe area: clear of the top 12 % and the bottom 18 % that the apps cover with their own buttons.

## Rights

Narration: Kokoro-82M, Apache-2.0. Music: the same excerpt of "Temple" by Jean du Voyage that the site uses
(see [`CONTENT_LICENSE.md`](../CONTENT_LICENSE.md)). Pictures and the 3D model: as on the site, each with its
licence read from its own record.
