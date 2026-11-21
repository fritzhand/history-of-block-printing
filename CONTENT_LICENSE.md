# Content License & Media Rights

The code in this repository is covered by [`LICENSE`](./LICENSE) (CC0 1.0). This file covers the
**content**: the compiled data in `js/data.js`, the research notes in `research/`, the 3D model and
textures, the soundtrack, and the third-party media the site displays.

## Compiled data

- The compiled dataset (`window.printData` in `js/data.js`) and the research notes in
  `research/*.json` are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Every claim carries a `source` object with `institution`, `title`, `date`, `url`, usually the
  supporting `quote`, a `verificationStatus` (`CONFIRMED` · `PENDING` · `DERIVED`) and an `accessType`.
  `tools/check-quotes.py` re-reads each CONFIRMED source and checks the quote, or the museum's
  catalogue fields, against the page or API record.
- Quotations are short extracts kept as evidence; their copyright stays with their authors.
- `DERIVED` values are this study's own reading (a midpoint year, an absence, a comparison). The
  note names the inputs. Do not cite them as primary findings.
- Six events (the indigo and resist traditions) are carried over unchanged from
  [`fritzhand/history-of-indigo`](https://github.com/fritzhand/history-of-indigo), with the sources and
  statuses they have there.
- Suggested attribution: *The Repeating Hand: A History of Block Printing*
  (`fritzhand/history-of-block-printing`), compiled from the sources cited per point.

## 3D model and textures

- `assets/models/priest-king-draco.glb`, `3d/out/priest-king.blend` and `assets/textures/*` were made for this
  project, from published photographs and measurements of the sculpture and a generative script.
  They are released under CC BY 4.0. The model is **a measured interpretation, not a scan**, and its
  "printed cloth" surface illustrates a hypothesis. It does not reproduce, and is not derived from,
  any third-party 3D model.
- A CC BY 4.0 Priest-King model on Sketchfab was examined during the work as a visual comparison. Its glTF
  file records the generator as Tripo (an AI tool). It is not part of this repository and nothing here is
  derived from it.
- The reference photographs supplied for modelling are not redistributed here.

## Music

- Soundtrack: "Temple" by Jean du Voyage. **Rights confirmed by the site owner on 2026-11-21.**
  Licence terms and any attribution wording required by the licensor are not recorded in this
  repository yet: add them here. `assets/audio/hero-bed.mp3` (12 s, under the header video) and `assets/audio/demo-bed.mp3` (60 s, looped
  quietly under the narrated demo) are trimmed, faded and loudness-normalised excerpts. The original full-length
  file is kept locally and is not published.

## Narration

- The narrated demo's voice is **Kokoro-82M**, voice `af_heart` (hexgrad/Kokoro-82M; Apache-2.0 code and weights): an
  open-source synthetic voice that clones no one. The recorded takes (`assets/demo/voice/`) and the script
  (`data/demo/`) are released under CC BY 4.0 with the rest of the content.

## Media policy

1. **Embed only rights-cleared images.** An image is shown only if its record states public domain, CC0,
   CC BY or CC BY-SA. `tools/mirror-media.py` reads the licence from each record (Met and Cleveland Open
   Access APIs, Wikimedia Commons) and keeps the statement it read as `rightsEvidence`.
2. **Link out for everything else.** The V&A's printed fragment IS.73-1972 is cited as a source but its
   photograph is not embedded, because V&A images are not openly licensed.
3. **Credit every image.** The credit line and licence are printed on every card.
4. **Mirrored copies.** Display copies are mirrored in `assets/media/`, at most 900 px, so the page does
   not depend on hotlinks (Wikimedia and the Met rate-limit bursts).
5. **Casts and copies are labelled.** Three of the four Priest-King photographs on Commons show a cast
   or replica; their captions say so.

## Media roll

<!-- media-roll:start -->
| Image | Licence | Credit | Source |
|---|---|---|---|
| `priest-king-photo-dark` | CC BY-SA 4.0 | Irfanmurtaza, CC BY-SA 4.0, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:KING_PRIEST.jpg) |
| `priest-king-cast-label-1` | CC BY-SA 2.0 | Umair Shaikh Shaikh, CC BY-SA 2.0, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:The_Priest_King_of_Moenjo_Daro.jpg) |
| `priest-king-cast-label-2` | CC BY 2.5 | Umair Shaikh Shaikh, CC BY 2.5, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:King_Priest,_Pakistan.jpg) |
| `priest-king-replica-kolkata` | CC BY-SA 4.0 | Ganesh Mohan T, CC BY-SA 4.0, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:Priest_King_(Sculpture)_of_Mohenjo-daro.jpg) |
| `met-printing-block-egypt-10c` | CC0 | The Metropolitan Museum of Art, Purchase, Mr. and Mrs. Bruce J. Westcott Gift, 1971 (CC0) | [record](https://www.metmuseum.org/art/collection/search/452215) |
| `met-printing-block-india` | CC0 | The Metropolitan Museum of Art, Purchase, V. Everit Macy Gift, 1930 (CC0) | [record](https://www.metmuseum.org/art/collection/search/448508) |
| `batik-cap-stamp` | CC BY-SA 3.0 | Gunawan Kartapranata, CC BY-SA 3.0, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:Batik_Cap_1.jpg) |
| `met-katagami-stencil` | CC0 | The Metropolitan Museum of Art, Gift of Mrs. Horace Havemeyer, 1942 (CC0) | [record](https://www.metmuseum.org/art/collection/search/69299) |
| `met-block-printed-linen-13c` | CC0 | The Metropolitan Museum of Art, Purchase, V. Everit Macy Gift, 1930 (CC0) | [record](https://www.metmuseum.org/art/collection/search/448520) |
| `cma-mamluk-block-print` | CC0 | The Cleveland Museum of Art, Purchase from the J. H. Wade Fund (CC0) | [record](https://clevelandart.org/art/1929.845) |
| `met-indian-trade-cotton-14-15c` | CC0 | The Metropolitan Museum of Art, Purchase, V. Everit Macy Gift, 1930 (CC0) | [record](https://www.metmuseum.org/art/collection/search/448527) |
| `met-lotus-arabesque-15c` | CC0 | The Metropolitan Museum of Art, Purchase, V. Everit Macy Gift, 1930 (CC0) | [record](https://www.metmuseum.org/art/collection/search/448528) |
| `gujarat-stamp-resist-cotton` | CC0 | The Metropolitan Museum of Art, Gift of Nelly, Violet and Elie Abemayor, in memory of Michel Abemayor, 1978 (CC0) | [record](https://www.metmuseum.org/art/collection/search/452913) |
| `blue-resist-bed-hanging` | CC0 | The Metropolitan Museum of Art, Gift of Mrs. Reginald P. Rose and Franklin Benkard, 1954 (CC0) | [record](https://www.metmuseum.org/art/collection/search/13561) |
| `met-jouy-manufacture-1783` | CC0 | The Metropolitan Museum of Art, Rogers Fund, 1926 (CC0) | [record](https://www.metmuseum.org/art/collection/search/221839) |
| `met-jouy-tropical-1787` | CC0 | The Metropolitan Museum of Art, Rogers Fund, 1937 (CC0) | [record](https://www.metmuseum.org/art/collection/search/226246) |
| `met-palampore-18c` | CC0 | The Metropolitan Museum of Art, Rogers Fund, 1928 (CC0) | [record](https://www.metmuseum.org/art/collection/search/448178) |
| `met-printed-cotton-18c` | CC0 | The Metropolitan Museum of Art, Gift of Titi Halle, 2010 (CC0) | [record](https://www.metmuseum.org/art/collection/search/237873) |
| `alsace-indigo-wax-resist-1790` | CC0 | Cleveland Museum of Art, Gift of Gertrude Underhill (CC0) | [record](https://clevelandart.org/art/1935.113) |
| `cma-coromandel-wrapper` | CC0 | The Cleveland Museum of Art, John L. Severance Fund (CC0) | [record](https://clevelandart.org/art/2000.30) |
| `hiroshige-dye-house-konya-cho-1857` | CC0 | Utagawa Hiroshige / The Metropolitan Museum of Art, The Howard Mansfield Collection, Purchase, Rogers Fund, 1936 (CC0) | [record](https://www.metmuseum.org/art/collection/search/56692) |
| `adire-eleko-george-v-queen-mary` | CC BY-SA 2.0 | Michael Garlick / Geograph via Wikimedia Commons (CC BY-SA 2.0) | [record](https://commons.wikimedia.org/wiki/File:Ightenhill%2C_Gawthorpe_Hall_Exhibition_Rooms%2C_%27Indigo_Blue%27%2C_panel_of_adire_eleko_of_George_V_and_Queen_Mary_-_geograph.org.uk_-_7890477.jpg) |
| `cma-strawberry-thief` | CC0 | The Cleveland Museum of Art, Gift of Mrs. Henry Chisholm (CC0) | [record](https://clevelandart.org/art/1937.696) |
| `ajrak-sindh` | CC BY-SA 3.0 | Ahub1988, CC BY-SA 3.0, via Wikimedia Commons | [record](https://commons.wikimedia.org/wiki/File:Ajrak.jpg) |
| `blaudruck-indigo-vat-austria` | CC BY-SA 4.0 | Geolina163 / Wikimedia Commons (CC BY-SA 4.0) | [record](https://commons.wikimedia.org/wiki/File:Blaudruckerei_Wagner_Indigok%C3%BCpe.jpg) |
<!-- media-roll:end -->
