/**
 * editorial.mjs — everything on the page that is judgement rather than evidence.
 *
 * Which events are mapped, the eras, the narrative steps, the evidence ledger, the claims
 * check, the process steps, and the 3D hotspots. It receives lookup helpers from
 * build-data.mjs, so every claim it makes carries the source object from research/*.json
 * rather than a retyped one. A claim that rests on this study's own reading (an absence, a
 * comparison, a midpoint) is marked DERIVED and says so.
 */
export default function editorial(H) {
  const ev = (id, idx) => H.eventSources(id, idx);
  const feat = (id) => H.featureSources(id);

  /* a source object for a statement that is this study's own reading */
  const derived = (title, url, note, institution = 'This study (reading of the sources cited beside it)') =>
    ({ institution, title, date: '2026-11-21', url, note, verificationStatus: 'DERIVED', accessType: 'FREE' });

  const meta = {
    title: 'The Repeating Hand: A History of Block Printing',
    shortTitle: 'The Repeating Hand',
    eras: [
      { slug: 'cotton',     name: 'Cotton & clay',          start: -6000, note: 'Cotton, spinning and the Indus cloak. Opens with the Mehrgarh fibres (6th millennium BCE).' },
      { slug: 'firstprints',name: 'First prints',           start: -200,  note: 'Printing on silk in Han China. Opens at 200 BCE, an editorial boundary.' },
      { slug: 'silk',       name: 'Silk, sutras & the Nile',start: 600,   note: 'The Diamond Sutra, carved blocks in Egypt, Gujarat\'s cottons reach the Nile. Opens at 600 CE, an editorial boundary.' },
      { slug: 'ocean',      name: 'Indian Ocean cloth',     start: 1200,  note: 'Quseir and Fustat, blocks from India, Europe learns late. Opens at 1200 CE, an editorial boundary.' },
      { slug: 'chintz',     name: 'Chintz & calico',        start: 1600,  note: 'Indian cottons in Europe, bans, a European industry. Opens at 1600 CE, an editorial boundary.' },
      { slug: 'mill',       name: 'Mill & revival',         start: 1784,  note: 'Industrial printing, and the hand block kept by choice. Opens at 1784, an editorial boundary.' },
      { slug: 'today',      name: 'Heritage today',         start: 1951,  note: 'Living resist and block traditions, listed as heritage. Opens at 1951, an editorial boundary.' }
    ],
    /* piecewise-linear compressed time axis: [position 0–1000, year] */
    timeKnots: [[0, -6000], [90, -3000], [190, -2000], [330, 0], [520, 868], [640, 1300], [770, 1700], [880, 1850], [1000, 2026]],
    axisTicks: [-5000, -3000, -2000, -1000, 0, 500, 1000, 1500, 1800, 2000],
    continents: ['South Asia', 'East Asia & Southeast Asia', 'West Asia', 'Africa', 'Europe', 'Americas'],
    mapCenter: [28, 40]
  };

  /* hero numbers: each CONFIRMED against a source object */
  const heroStats = [
    { value: '17.5 cm', label: 'height of the steatite Priest-King', source: ev('priest-king-mohenjo-daro', [2]) },
    { value: '6th millennium BCE', label: 'cotton fibres in a grave at Mehrgarh', source: ev('mehrgarh-cotton-fibres', [0]) },
    { value: '868', label: 'the oldest dated printed book, carved on woodblocks', source: ev('diamond-sutra-868', [3]) },
    { value: '14th century', label: 'earliest evidence of block-printed textiles in Europe', source: ev('europe-late-block-printing-14c', [0]) }
  ];
  const footerStats = heroStats;

  /* events on the map, in editorial order (the build sorts by year) */
  const events = [
    'mehrgarh-cotton-fibres', 'harappa-earliest-textile-3300', 'priest-king-mohenjo-daro', 'mohenjo-daro-cotton-fragment',
    'han-printed-gauze', 'diamond-sutra-868', 'egypt-printing-block-10c', 'gujarat-indigo-cottons-egypt',
    'quseir-fustat-block-prints', 'vam-cairo-trefoil-15c', 'india-printing-block-15-16c', 'europe-late-block-printing-14c',
    'european-calico-1690s', 'france-ban-lifted-1759', 'jouy-oberkampf-1783', 'adinkra-bowdich-1817', 'morris-strawberry-thief-1883',
    'adire-eleko-abeokuta', 'nantong-blue-calico-heritage-2006', 'danzhai-miao-batik-2006', 'indonesian-batik-unesco-2009',
    'unesco-blaudruck-inscription'
  ].map(id => ({ id, ...(id === 'quseir-fustat-block-prints' ? { continent: 'Africa' } : {}),
                 ...(id === 'indonesian-batik-unesco-2009' ? { continent: 'East Asia & Southeast Asia' } : {}) }));

  /* the scroll story */
  const scrollSteps = [
    { eventId: 'mehrgarh-cotton-fibres', zoom: 5, headline: 'Cotton comes first',
      narrative: 'Before any pattern, a fibre. Threads in a copper bead from a Neolithic grave at Mehrgarh were identified as cotton. The authors could not say if it was domesticated, only that it was already known and used.' },
    { eventId: 'harappa-earliest-textile-3300', zoom: 5, headline: 'Spinning and weaving at Harappa',
      narrative: 'Woven cloth left its impression on clay beads and spindle whorls from the earliest levels at Harappa. The cloth itself has not survived.' },
    { eventId: 'priest-king-mohenjo-daro', zoom: 6, headline: 'A cloak, carved in stone', media: ['priest-king-photo-dark', 'priest-king-cast-label-1'],
      narrative: 'Harappa.com describes a cloak "decorated with trefoil, double circle and single circle designs that were originally filled with red pigment". It shows a pattern on cloth. It does not show how the pattern was made.' },
    { eventId: 'mohenjo-daro-cotton-fragment', zoom: 6, headline: 'A scrap of cotton, and a doubt',
      narrative: 'A small piece of cotton was found on a silver lid. The lab report was tentative, and the madder dyeing reported later is dated 1760 BCE, after the urban period. Real, thin, and not settled.' },
    { eventId: 'han-printed-gauze', zoom: 5, headline: 'China prints on silk',
      narrative: 'A Han tomb at Mawangdui held printed and painted gauze. This study could not read the museum pages that say how it was printed, so this stop is PENDING, and makes no claim about stencils or blocks.' },
    { eventId: 'diamond-sutra-868', zoom: 5, headline: 'Blocks, carved for a sutra',
      narrative: 'On 11 May 868 a Buddhist text carved on woodblocks was printed as a scroll. It is on paper, not cloth: the best-dated early product of block printing is a book.' },
    { eventId: 'egypt-printing-block-10c', zoom: 5, headline: 'A real block, a thousand years old', media: ['met-printing-block-egypt-10c'],
      narrative: 'The Met holds a carved wooden textile printing block from Egypt, tenth century. This is the tool itself: wood, carved, ready to be inked.' },
    { eventId: 'gujarat-indigo-cottons-egypt', zoom: 4, headline: 'Gujarat to the Nile', media: ['gujarat-stamp-resist-cotton'],
      narrative: 'Indian block-printed, resist- and mordant-dyed cottons turn up in Egypt. The indigo study follows their blue; this one follows the blocks.' },
    { eventId: 'quseir-fustat-block-prints', zoom: 5, headline: 'A datable find', media: ['met-indian-trade-cotton-14-15c', 'cma-mamluk-block-print'],
      narrative: 'At Quseir al-Qadim, 68 cotton fragments match the Gujarati "Fustat" textiles: resist- and mordant-dyed, mostly block-printed, in indigo and madder. It was the first find of this kind from a datable excavation.' },
    { eventId: 'vam-cairo-trefoil-15c', zoom: 5, headline: 'Trefoils again',
      narrative: 'The V&A\'s fragment from Cairo is printed, mordant and resist-dyed cotton, probably from Gujarat, with "smaller patterns including trefoils", red and white on indigo. A resemblance across three millennia is not a lineage.' },
    { eventId: 'india-printing-block-15-16c', zoom: 4, headline: 'The Indian block', media: ['met-printing-block-india'],
      narrative: 'A carved wooden printing block from India, 15th–16th century: the tool behind the cottons that reached Egypt.' },
    { eventId: 'europe-late-block-printing-14c', zoom: 5, headline: 'Europe arrives late',
      narrative: 'The V&A: block printing "seems to have come to Europe comparatively late", with no evidence earlier than the 14th century. Europe was learning a craft Asia and Africa had long practised.' },
    { eventId: 'european-calico-1690s', zoom: 5, headline: 'Imports teach a continent',
      narrative: 'Indian painted cottons, imported by the Dutch, English and French East India Companies, gave "a direct incentive" to make substitutes at home, and a European calico printing industry followed.' },
    { eventId: 'france-ban-lifted-1759', zoom: 5, headline: 'A ban lifted',
      narrative: 'Riello: calico printing spread to Mulhouse and Neuchâtel and "from there back to France after the ban was lifted in 1759".' },
    { eventId: 'jouy-oberkampf-1783', zoom: 7, headline: 'A printshop on the cloth', media: ['met-jouy-manufacture-1783'],
      narrative: 'At Jouy-en-Josas, Oberkampf\'s calico printshop was itself printed on cloth in 1783: a rare picture of the work.' },
    { eventId: 'adinkra-bowdich-1817', zoom: 5, headline: 'Stamps in West Africa', media: ['adinkra-bowdich-cloth'],
      narrative: 'Adinkra is a stamped textile: cotton woven in strips and decorated with repeated patterns in a grid. Thomas Bowdich collected examples on a mission of 1816–18 and gave them to the British Museum in 1818.' },
    { eventId: 'morris-strawberry-thief-1883', zoom: 6, headline: 'Morris keeps the hand block', media: ['cma-strawberry-thief'],
      narrative: 'William Morris printed "Strawberry Thief" by the indigo discharge method, "an ancient technique used for many centuries mostly in Asia": dye the cloth blue, then bleach the pattern out with a block.' },
    { eventId: 'unesco-blaudruck-inscription', zoom: 5, headline: 'Still printing, still blue', media: ['blaudruck-indigo-vat-austria'],
      narrative: 'In 2018 UNESCO listed European indigo resist block printing, Blaudruck. The craft survives as living heritage, five countries wide.' }
  ];

  /* the evidence ledger */
  const ledger = [
    { tag: 'EVIDENCED', claim: 'Cotton was in use in the Indus region', basis: 'Cotton fibres in a Neolithic grave at Mehrgarh (6th millennium BCE); the earliest textile evidence at Harappa is about 3300 BCE.', source: [...ev('mehrgarh-cotton-fibres', [0, 1]), ...ev('harappa-earliest-textile-3300', [0])] },
    { tag: 'EVIDENCED', claim: 'People spun and wove cloth at Harappa', basis: 'Woven-textile impressions on beads and spindle whorls, from the earliest occupations.', source: ev('harappa-earliest-textile-3300', [1]) },
    { tag: 'EVIDENCED', claim: 'The Priest-King wears a cloak patterned with trefoils and circles', basis: 'Carved in steatite, 17.5 cm tall; National Museum, Karachi.', source: [...ev('priest-king-mohenjo-daro', [0]), ...ev('priest-king-mohenjo-daro', [2])] },
    { tag: 'EVIDENCED', claim: 'The designs were cut with a drill and chisel and filled with red pigment', basis: 'Drill holes in the centre of each circle, touched up with a chisel; "originally filled with red pigment".', source: ev('priest-king-mohenjo-daro', [0, 1]) },
    { tag: 'REPORTED', claim: 'Cotton at Mohenjo-daro was dyed with madder', basis: 'The Ashmolean says a fragment "has been reported" to show it. The lab report was tentative, and the date reported (1760 BCE ±115) is later than the urban period.', source: ev('mohenjo-daro-cotton-fragment', [0, 1]) },
    { tag: 'NOT FOUND', claim: 'Any printing block, cloth stamp or printed fabric from Mohenjo-daro', basis: 'None appears in the sources this study read. This describes our search, not the ground: absence from these pages is not proof of absence.',
      source: [derived('Harappa.com, "Ancient Textiles of the Indus Valley Region": no mention of printing, dyeing, madder or trefoils', 'https://www.harappa.com/content/ancient-textiles-indus-valley-region', 'Text-searched on 2026-11-21 for "print", "dye", "madder", "mordant", "trefoil" and "resist": no match. This study\'s own reading.', 'Harappa.com (page searched by this study)')] },
    { tag: 'IMAGINED', claim: 'The trefoils were block-printed, then dyed', basis: 'A hypothesis. Rows of repeated motifs are what printing produces; they are also what weaving, embroidery, appliqué or painting can produce.',
      source: [derived('A staggered, repeated pattern is consistent with several techniques', 'https://www.harappa.com/slide/priest-king-mohenjo-daro', 'This study\'s reading of the sculpture as described by Harappa.com. The description says nothing about technique.')] },
    { tag: 'IMAGINED', claim: 'The block was carved from wood or fired clay', basis: 'No Indus block exists. Later carved wooden blocks survive from Egypt (10th century) and India (15th–16th century), and show what the tool looks like.', source: [...ev('egypt-printing-block-10c', [0]), ...ev('india-printing-block-15-16c', [0])] }
  ];

  /* the claims check */
  const claims = [
    { claim: 'The Priest-King\'s shawl proves Indus people block-printed cloth.', verdict: 'Not shown',
      correction: 'The cloak is carved in stone. Harappa.com records the designs, the drill and chisel, and the red pigment. It says nothing about printing, and no printing block or printed cloth from Mohenjo-daro appears in the sources this study read.',
      era: 'cotton', source: [...ev('priest-king-mohenjo-daro', [0, 1]), ...ledger[5].source] },
    { claim: 'A 4,500-year-old cotton scrap proves madder dyeing at Mohenjo-daro.', verdict: 'Reported, not settled',
      correction: 'The lab said its results "can only be regarded as tentative". The Ashmolean says the fragment "has been reported" to show madder dyeing and gives a date of 1760 BCE ±115: later than the 2600–1900 BCE urban period, and about 3,800 years old, not 4,500.',
      era: 'cotton', source: [...ev('mohenjo-daro-cotton-fragment', [0, 1]), ...ev('priest-king-mohenjo-daro', [3])] },
    { claim: 'The Mawangdui silks are block-printed.', verdict: 'Unsettled (PENDING)',
      correction: 'Search summaries describe stencil or stamp printing plus hand-colouring, not carved-block printing. The museum pages could not be read here, so this study makes no claim either way until it can.',
      era: 'firstprints', source: ev('han-printed-gauze', [0, 1]) },
    { claim: 'Printing began with books, with the Diamond Sutra.', verdict: 'The oldest dated printed book, not necessarily the oldest printing',
      correction: 'The Diamond Sutra of 868 is dated and carved on woodblocks, and it is on paper. Dated is not the same as first, and this study found no source that settles whether printing on cloth came earlier.',
      era: 'silk', source: ev('diamond-sutra-868', [0, 1]) },
    { claim: 'Europe invented block printing on cloth.', verdict: 'False',
      correction: 'The V&A: block printing of textiles "seems to have come to Europe comparatively late", with no evidence of it before the 14th century. A printing block carved in Egypt is dated to the 10th century, and the Ashmolean\'s radiocarbon tests date Indian block-printed cottons found in Egypt to as early as 1010 CE.',
      era: 'ocean', source: [...ev('europe-late-block-printing-14c', [0]), ...ev('egypt-printing-block-10c', [0]), ...ev('gujarat-indigo-cottons-egypt', [0])] },
    { claim: 'The trefoils on a 15th-century Gujarati cotton show the Indus pattern survived.', verdict: 'A resemblance, not a lineage',
      correction: 'The V&A\'s Cairo fragment has trefoils in red and white on indigo, and the Priest-King\'s cloak has trefoils filled with red. They are about 3,000 years apart, and nothing in the sources links them.',
      era: 'ocean', source: [...ev('vam-cairo-trefoil-15c', [0]), ...ev('priest-king-mohenjo-daro', [0])] }
  ];

  /* how a block print is made: a general description from the sources, not the Indus case */
  const process = [
    { n: 1, title: 'Carve the block', text: 'A pattern is cut into the end-grain of a hardwood block, leaving the lines or shapes to be printed standing proud. Blocks from Egypt (10th century) and India (15th–16th century) survive.', source: [...ev('egypt-printing-block-10c', [0]), ...ev('india-printing-block-15-16c', [0])], media: 'met-printing-block-india' },
    { n: 2, title: 'Print a mordant or a resist', text: 'The block is inked, not with colour, but with a mordant (which will bind a dye to the cotton) or a resist (which will keep a dye out). The Ashmolean describes the Quseir textiles as "resist- and mordant- dyed textiles, mostly block-printed".', source: ev('quseir-fustat-block-prints', [0]) },
    { n: 3, title: 'Dye', text: 'The cloth goes into the dye. The dyes identified at Quseir are "indigotin and/or a red colorant, provided either by madder ... or a variety of morinda roots". Mordanted cloth takes the red; resisted cloth stays white in the blue.', source: ev('mohenjo-daro-cotton-fragment', [1]) },
    { n: 4, title: 'Wash and finish', text: 'Washing removes the unfixed dye and the resist. What is left is the pattern, repeated at the pitch the printer sets.', source: [derived('A general description of the process', 'https://collections.vam.ac.uk/item/O478834/', 'This study\'s summary of how the V&A and Ashmolean describe printed, mordant and resist-dyed cotton; it is not a quotation.', 'This study (summary of the museum descriptions)')] },
    { n: 5, title: 'Or reverse it: discharge', text: 'Morris\'s "Strawberry Thief" was printed by "the indigo discharge method, an ancient technique used for many centuries mostly in Asia": dye the whole cloth blue, then bleach the pattern out with the block.', source: ev('morris-strawberry-thief-1883', [0, 1]) }
  ];

  /* 3D viewer: positions are glTF metres (Y up, the face looks toward +Z) */
  const hotspots = [
    { slot: 'hs-fillet', position: '0 0.167 0.028', normal: '0 0 1', label: 'Fillet and ring', text: 'A headband with a circular ornament on the forehead, and a smaller one on the right upper arm.', tag: 'EVIDENCED', feature: 'fillet-ornament', orbit: '0deg 80deg 0.30m' },
    { slot: 'hs-ear', position: '0.030 0.137 -0.004', normal: '1 0 0', label: 'The ear', text: 'Highly stylized ears; two holes beneath them suggest a necklace or head ornament was attached.', tag: 'EVIDENCED', feature: 'ears', orbit: '90deg 80deg 0.30m' },
    { slot: 'hs-beard', position: '0 0.112 0.033', normal: '0 0 1', label: 'Beard and lip', text: 'The upper lip is shaved and a short combed beard frames the face. The eyes are deeply incised and may have held inlay.', tag: 'EVIDENCED', feature: 'eyes-beard', orbit: '0deg 80deg 0.30m' },
    { slot: 'hs-cloak', position: '0.025 0.092 0.031', normal: '0 0 1', label: 'Trefoils', text: 'The left shoulder is covered with a cloak decorated with trefoil, double circle and single circle designs, originally filled with red pigment.', tag: 'EVIDENCED', feature: 'cloak', orbit: '-20deg 75deg 0.32m' },
    { slot: 'hs-back', position: '0 0.120 -0.040', normal: '0 0 -1', label: 'Fillet tails', text: 'The two ends of the fillet fall along the back; the hair is combed back and no bun is present.', tag: 'EVIDENCED', feature: 'fillet-back', orbit: '180deg 78deg 0.32m' },
    { slot: 'hs-crack', position: '0.010 0.140 0.030', normal: '0 0 1', label: 'The crack', text: 'The large crack in the face is the result of weathering, or it may be due to the original firing.', tag: 'EVIDENCED', feature: 'crack', orbit: '0deg 80deg 0.26m' },
    { slot: 'hs-nose', position: '0 0.137 0.037', normal: '0 0 1', label: 'The broken nose', text: 'The nose is broken off. Seen in the photographs; the Harappa.com entry does not mention it.', tag: 'OBSERVED', feature: null, orbit: '0deg 80deg 0.26m' },
    { slot: 'hs-front', position: '-0.005 0.045 0.027', normal: '0 0 1', label: 'Broken front', text: 'Below the band of trefoils the front of the cloak is lost, rough broken stone. Seen in the photographs; no text source.', tag: 'OBSERVED', feature: null, orbit: '0deg 85deg 0.34m' }
  ];

  const swatches = [
    { file: 'assets/textures/madder-trefoil-print_albedo.jpg', name: 'Madder trefoil print', text: 'The cloak\'s trefoils as red print on cotton. An illustration of the hypothesis.' },
    { file: 'assets/textures/indigo-resist-trefoil_albedo.jpg', name: 'Indigo resist trefoil', text: 'The same shapes kept white in an indigo ground, the way a resist works.' },
    { file: 'assets/textures/cotton-plain-weave_albedo.jpg', name: 'Plain-weave cotton', text: 'Undyed plain weave: the cloth underneath.' },
    { file: 'assets/textures/steatite_albedo.jpg', name: 'Steatite', text: 'The soapstone the Priest-King is carved from.' }
  ];

  const blueThread = ['gujarat-indigo-cottons-egypt', 'quseir-fustat-block-prints', 'vam-cairo-trefoil-15c', 'morris-strawberry-thief-1883',
    'adire-eleko-abeokuta', 'nantong-blue-calico-heritage-2006', 'danzhai-miao-batik-2006', 'indonesian-batik-unesco-2009', 'unesco-blaudruck-inscription'];

  const mediaOrder = ['priest-king-photo-dark', 'priest-king-cast-label-1', 'priest-king-cast-label-2', 'priest-king-replica-kolkata',
    'met-printing-block-egypt-10c', 'met-printing-block-india', 'batik-cap-stamp', 'met-katagami-stencil'];

  return { meta, heroStats, footerStats, events, scrollSteps, ledger, claims, process, hotspots, swatches, blueThread, mediaOrder };
}
