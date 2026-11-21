# Archival Research Brief — The Repeating Hand

The next evidence pass. Each item is a gap on the live page: a PENDING source, a lead not yet read, or a
statement the first pass could not verify. Close them against primary institutions and record each result in
`research/*.json` with the exact supporting quote, then run `python3 tools/check-quotes.py` and
`node tools/build-data.mjs`.

## Standard

- One source object per claim: `institution`, `title`, `date`, `url`, `quote`, `verificationStatus`, `accessType`.
- CONFIRMED only when the fetched page (or scan) states it. For museum catalogue records use `checkUrl` and
  `checkFields`.
- Prefer, in order: the primary document; an excavation report; peer-reviewed scholarship; a museum catalogue;
  reputable press. Wikipedia is a lead, never a source.

## Tier 1 — the question itself

1. **Marshall 1931 and Lal 1962 on the madder-dyed cotton.** The Ashmolean cites *Marshall 1931: 32-3* and *Lal
   1962: 213-14*; read both. Does either report the lab method, and does the radiocarbon date (1760 BCE ±115)
   belong to that fragment?
2. **Any printing block, stamp or printed cloth from the Indus.** Search Kenoyer, Possehl, Wright and the
   Mohenjo-daro and Harappa excavation reports for "printing", "stamp", "block", "resist" and "mordant".
   "NOT FOUND" on the page currently rests on a text search of one Harappa.com page.
3. **The Priest-King's find date.** 1925–26 or 1927? Read Marshall 1931 (pp. 356-7) or the excavation record.
4. **The Met's "Indian block-printed textiles" Perspectives article** (returns HTTP 429 to automated clients;
   paste its text, or retry from a browser). Does it say block printing in India began as early as 3500 BCE?
   If so, record it as a claim to check, with the museum's own evidence.

## Tier 2 — unread leads

- **Mawangdui printed gauze** (Tomb 1): the Hunan Museum page (timed out) and the Met record 696723 (429). Is it
  stencil, stamp or block? The tomb's date (Lady Dai, c. 160s BCE).
- **Moulherat et al. 2002**, *J. Archaeological Science* 29(12): the abstract is quoted from Harappa.com; read the
  paper itself.
- **French ban of 1686 and the English Calico Acts of 1700 and 1721**: the statutes or a dedicated history, not Wikipedia.
- **Eastern Han woodblock-printed silk** ("before 220 CE"): a museum or scholarly source.
- **Roman-period Indian cotton at Berenike and Quseir** (plain, or printed?).
- **Tsien Tsuen-hsuin / Needham** on printing from stamps on textiles preceding paper.
- **Shōsōin** (Japan, 8th century) resist-dyed textiles; **Indonesian batik cap** (when the copper stamp began);
  **Ajrakh, Bagru, Sanganer, Kalamkari**; **roller printing** (1783–84).

## Tier 3 — images

- Mirror the **Adinkra cloth** (Commons "Adinkra cloth.JPG", public domain): the record is in
  `research/media.json`, but the file hit Wikimedia's rate limit. Run
  `python3 tools/mirror-media.py --only adinkra-bowdich-cloth`.
- Rights-cleared photographs of Bagru, Sanganer or Ajrakh block printing in progress.
- A photograph of the **original** Priest-King in Karachi with a stated open licence (the Commons photographs
  found are casts or unspecified).
