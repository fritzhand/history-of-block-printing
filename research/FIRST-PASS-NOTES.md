# Research first pass — block printing timeline

Status: **in progress.** Nothing below is in a `research/*.json` record yet. Perplexity was not
connected, so leads came from web search and every quote listed as VERIFIED was then found on the
cited page with `tools/fetch-text.py` (run with a Python that has `beautifulsoup4`, `pdfminer.six`
and `certifi`). Search-engine summaries are leads, not evidence.

## The finding that shapes the hero

**No source found reports block printing, printing blocks, or printed cloth from the Indus
civilisation.** The Priest-King's shawl is carved stone. It shows that a trefoil pattern existed on
a garment; it does not say how the pattern was made on cloth (woven, embroidered, appliquéd,
painted, resisted or printed). The site presents "block-printed?" as a hypothesis, and the hero
video is labelled a reconstruction.

## VERIFIED on the page

| Claim | Source | Quote found |
|---|---|---|
| Material, size, museum number, find reference | Harappa.com, "Priest King," Mohenjo-daro (J. M. Kenoyer) — https://www.harappa.com/slide/priest-king-mohenjo-daro | "Material: white, low fired steatite Dimensions: 17.5 cm height, 11 cm width Mohenjo-daro, DK 1909 National Museum, Karachi, 50.852 Marshall 1931: 356-7, pl. XCVIII" |
| The cloak and its pigment | same | "The left shoulder is covered with a cloak decorated with trefoil, double circle and single circle designs that were originally filled with red pigment. Drill holes in the center of each circle indicate they were made with a specialized drill and then touched up with a chisel." |
| Fillet, forehead and arm ornament | same | "Fillet or ribbon headband with circular inlay ornament on the forehead and similar but smaller ornament on the right upper arm." |
| Eyes, beard, crack | same | "Eyes are deeply incised and may have held inlay. The upper lip is shaved and a short combed beard frames the face. The large crack in the face is the result of weathering or it may be due to original firing of this object." |
| Cotton at Mohenjo-daro was examined, tentatively | Harappa.com, "In quest of a piece of cotton unearthed from Mohenjo Daro", quoting Marshall 1931 p. 585 — https://www.harappa.com/content/quest-piece-cotton-unearthed-mohenjo-daro | "...results can only be regarded as tentative." The examiner is named as Mr. James Turner. |
| Madder dyeing of that cotton is *reported*, dated 1760 BCE ±115 | Ashmolean, Eastern Art Online — https://jameelcentre.ashmolean.org/collection/7/10236/10318 | "a cotton fibre fragment from Mohenjo-Daro, carbon-dated to 1760 BCE ±115, has been reported to show evidence of madder dyeing (Marshall 1931: 32-3; Lal 1962: 213-14)." |
| Block-printed, resist- and mordant-dyed Gujarat cottons, datable context | same page (Quseir al-Qadim) | "They are resist- and mordant- dyed textiles, mostly block-printed. The dyes identified are indigotin and/or a red colorant, provided either by madder ... or a variety of morinda roots" |
| Adinkra stamped cloth, Bowdich 1818 | British Art Studies 28, "Adinkra from Kumase to the British Museum" — page fetched, quotes still to extract | |
| Early printed textiles in Europe | V&A blog "Ink, Print, Repeat" — page fetched, quotes still to extract | |

## Cautions found

- The Mohenjo-daro cotton: Marshall's report calls the lab result tentative; the madder claim is
  "reported"; and a 1760 BCE date is *after* the mature Indus period (c. 2600–1900 BCE). Another site
  gives 3250–2750 BCE. Treat the dyeing as an open question, not a fact.
- The Priest-King's find date is given as 1925–26 in most sources and 1927 in some. Use the museum
  or excavation record, not a popular page. The title "Priest-King" is itself speculation.
- One Met-hosted version of the Red Sea essay reportedly says Gujarat block printing began "as early
  as 3500 BCE". Not corroborated; the surviving Indo-Egyptian cottons are 13th–14th century. **Candidate
  for the Myths section; re-read on the Met page before using (the Met rate-limited this session).**
- Mawangdui (Han, Tomb 1, 168 BCE): the Met describes the printed gauze as **stencil**-printed and
  hand-painted, not carved-block printing. The earliest surviving *woodblock* textile is usually
  given as an Eastern Han silk (before 220 CE). Keep the two apart.
- Quseir al-Qadim's printed cottons are 13th–14th century; Roman-era Indian cotton at Berenike was
  mostly plain.
- The "Rhenish 12th-century" European block prints are doubted (Donald King, 1962, called the
  Rhenish group largely 19th-century fakes). The V&A says Cennino Cennini describes printing on linen
  (c. 1390 / 1437, both dates appear on V&A pages). Do not date European block printing earlier
  than the 14th century without a better source.

## Leads still to verify (search results only)

- Mehrgarh cotton fibres, 6th millennium BCE: Moulherat, Tengberg, Haquet & Mille, J. Archaeological
  Science 29(12), 2002, doi 10.1006/jasc.2001.0779. The HAL record sits behind a bot check; try the
  DOI or a library copy for the abstract wording ("cotton (genus Gossypium)"; domestication not
  shown).
- Met: Western Han printed gauze (object 696723); "Made in India, Found in Egypt"; "Textile
  Production in Europe: Printed, 1600–1800" (1686 France, 1700 England, ban lifted 1759, Oberkampf at
  Jouy). All returned HTTP 429 — retry spaced out.
- Hunan Museum printed gauze robe page (timed out). British Library Diamond Sutra (868; IDP page
  returned 403 — use bl.uk or the Library's own collection page).
- Calico Acts: use the Statutes / a dedicated history, not Wikipedia.
- Indonesian batik cap (copper stamp), Ajrakh / Bagru / Sanganer, William Morris at Merton Abbey,
  Jouy and the roller-printing patents: not yet searched.

## Dead or blocked addresses (do not cite)

- Kenoyer 2017, "Harappan Textiles and Trade", societyforasianart.org PDF: **HTTP 410 Gone**.
- Smarthistory (403), British Library IDP (403), HAL (bot check), Hunan Museum (timeout).

## Added later in the session

- **V&A IS.73-1972** (https://collections.vam.ac.uk/item/O478834/, read through the V&A API): "Textile
  fragment of printed mordant and resist-dyed cotton. The pattern consists of geometrical shapes, each
  filled with a variety of smaller patterns including trefoils. Colours are in red and white on indigo
  blue ground." Made in India (Gujarat, probably), found in Cairo, 15th century. The V&A's images are
  not openly licensed, so the page links to the record and does not mirror its photograph.
- **Met Perspectives, "Indian block-printed textiles"** (a link you gave): **not read.** The page
  returned HTTP 429 to every automated client, including a separate fetch agent. Do not cite it until
  its text has been read; paste it in and the quotes can be checked.
- **Met API:** `/public/collection/v1/search` was retired on 2026-10-01; the tools now use
  `/v1.1/search` (offset/limit). The Met's website pages rate-limit automated clients.
- **Picture archive:** 20 rights-cleared images are mirrored (13 CC0 from the Met and Cleveland, 7 under
  CC BY / CC BY-SA / public domain from Commons). Three of the four "Priest-King" Commons photographs
  are of **casts or replicas** (two carry the label "KING PRIEST (CAST)", one is a Kolkata display copy);
  none is labelled as the original in Karachi, so none is captioned as such.
- **Soundtrack:** no public licence information found for "Jean du Voyage – Temple". The site owner has
  since confirmed the rights (2026-11-21); the licence terms still need recording in `CONTENT_LICENSE.md`.
