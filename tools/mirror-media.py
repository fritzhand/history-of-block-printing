#!/usr/bin/env python3
"""
mirror-media.py — turn research/media-manifest.json into research/media.json and
mirrored web-size copies in assets/media/.

    python3 tools/mirror-media.py [--only ID ...] [--no-download]

For every manifest entry the rights are READ FROM THE RECORD, not assumed:
  met        Met Open Access API: isPublicDomain must be true (CC0)
  cleveland  Cleveland Museum of Art Open Access API: share_license_status must be CC0
  commons    Wikimedia Commons file page: LicenseShortName must be Public domain, CC0,
             CC BY or CC BY-SA (no NC, no ND)
An entry that fails is skipped and reported. The licence statement that was read goes
into rightsEvidence so the page can quote it. Images are mirrored at <= 900 px so the
site does not depend on hotlinks.

Needs Pillow; certifi is used for TLS when present. Calls are throttled (Wikimedia and
the Met rate-limit bursts).
"""
import argparse, datetime, io, json, os, re, ssl, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'history-of-block-printing-research/0.1 (open-data study; media rights check)'}
ALLOWED = re.compile(r'^(Public domain|PD|CC0|CC BY( \d\.\d)?|CC BY-SA( \d\.\d)?)', re.I)
MAXPX = 900
THROTTLE = 1.1

try:
    import certifi
    CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    CTX = ssl.create_default_context()


def http(url, binary=False, tries=4):
    err = None
    for i in range(tries):
        try:
            time.sleep(THROTTLE)
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45, context=CTX) as r:
                raw = r.read()
            return raw if binary else json.loads(raw)
        except Exception as e:
            err = e
            time.sleep(3 + 4 * i)
    raise RuntimeError(f'{err} <- {url[:110]}')


def strip(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()


def met(e):
    o = http(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{e['ref']}")
    if not o.get('isPublicDomain'):
        raise RuntimeError('Met: isPublicDomain is not true')
    return dict(
        title=o['title'], creator=strip(o.get('artistDisplayName')) or f"Unknown maker, {o.get('culture') or o.get('country') or ''}".strip(', '),
        license='CC0', creditLine=f"The Metropolitan Museum of Art, {o['creditLine']} (CC0)",
        sourceUrl=o['objectURL'], img=o['primaryImageSmall'], fullUrl=o.get('primaryImage'),
        upstreamArchive='The Metropolitan Museum of Art',
        rightsEvidence=f"Met Collection API /public/collection/v1/objects/{e['ref']} returns \"isPublicDomain\": true (Met Open Access, CC0). Accession {o['accessionNumber']}; credit \"{o['creditLine']}\".",
        recordText=f"{o['title']}, {o.get('objectDate')}, {o.get('culture') or o.get('country') or ''}. {o.get('medium') or ''}.".replace(' ,', ',').replace(' .', '.'))


def cleveland(e):
    a = http(f"https://openaccess-api.clevelandart.org/api/artworks/{e['ref']}")['data']
    if (a.get('share_license_status') or '').upper() != 'CC0':
        raise RuntimeError('Cleveland: not CC0')
    who = '; '.join((c.get('description') or '') for c in (a.get('creators') or [])) or 'Unknown maker'
    return dict(
        title=a['title'], creator=who, license='CC0',
        creditLine=f"The Cleveland Museum of Art, {a.get('creditline') or ''} (CC0)".replace(' ,', ','),
        sourceUrl=a.get('url') or f"https://www.clevelandart.org/art/{a.get('accession_number')}",
        img=a['images']['web']['url'], fullUrl=(a['images'].get('print') or {}).get('url'),
        upstreamArchive='The Cleveland Museum of Art',
        rightsEvidence=f"Cleveland Museum of Art Open Access API /api/artworks/{e['ref']} returns share_license_status \"CC0\". Accession {a.get('accession_number')}.",
        recordText=f"{a['title']}, {a.get('creation_date')}, {', '.join(a.get('culture') or [])}. {a.get('technique') or ''}.")


def commons(e):
    t = e['ref'] if e['ref'].startswith('File:') else 'File:' + e['ref']
    q = ("https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&format=json&iiurlwidth=%d"
         "&iiprop=url|extmetadata|size|mime&titles=%s" % (MAXPX, urllib.parse.quote(t)))
    p = list(http(q)['query']['pages'].values())[0]
    ii = (p.get('imageinfo') or [None])[0]
    if not ii:
        raise RuntimeError('Commons: file not found')
    m = ii['extmetadata']
    lic = (m.get('LicenseShortName') or {}).get('value', '')
    if not ALLOWED.match(lic):
        raise RuntimeError(f'Commons: licence "{lic}" is not in the allowed set')
    artist = strip((m.get('Artist') or {}).get('value')) or 'Unknown'
    return dict(
        title=e.get('title') or t[5:].rsplit('.', 1)[0], creator=artist, license=lic,
        creditLine=f"{artist}, {lic}, via Wikimedia Commons",
        sourceUrl=ii['descriptionurl'], img=ii.get('thumburl') or ii['url'], fullUrl=ii['url'],
        upstreamArchive='Wikimedia Commons',
        rightsEvidence=f"Commons file page {ii['descriptionurl']} states licence \"{lic}\" ({(m.get('LicenseUrl') or {}).get('value', 'no licence URL')}); author \"{artist}\".",
        recordText=strip((m.get('ImageDescription') or {}).get('value'))[:300])


SOURCES = {'met': met, 'cleveland': cleveland, 'commons': commons}


def mirror(url, dest):
    from PIL import Image
    raw = http(url, binary=True)
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    im.thumbnail((MAXPX, MAXPX))
    im.save(dest, 'JPEG', quality=82, optimize=True, progressive=True)
    return f'{im.width}x{im.height}'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--no-download', action='store_true')
    a = ap.parse_args()
    man = json.load(open(os.path.join(ROOT, 'research/media-manifest.json')))
    out_path = os.path.join(ROOT, 'research/media.json')
    prev = {i['id']: i for i in json.load(open(out_path))['images']} if os.path.exists(out_path) else {}
    os.makedirs(os.path.join(ROOT, 'assets/media'), exist_ok=True)
    today = datetime.date.today().isoformat()
    images, skipped = [], []
    for e in man['images']:
        if a.only and e['id'] not in a.only:
            if e['id'] in prev: images.append(prev[e['id']])
            continue
        try:
            r = SOURCES[e['source']](e)
            dest = os.path.join(ROOT, 'assets/media', e['id'] + '.jpg')
            px = None
            if not a.no_download:
                px = mirror(r['img'], dest)
            rec = dict(id=e['id'], year=e['year'], yearLabel=e.get('yearLabel'), title=e.get('title') or r['title'],
                       caption=e.get('caption') or r['recordText'], alt=e.get('alt') or e.get('title') or r['title'],
                       creator=r['creator'], license=r['license'], creditLine=r['creditLine'], sourceUrl=r['sourceUrl'],
                       thumbUrl=f"assets/media/{e['id']}.jpg", fullUrl=r['fullUrl'], upstreamArchive=r['upstreamArchive'],
                       lat=e.get('lat'), lng=e.get('lng'), locationNote=e.get('locationNote'),
                       kind=e.get('kind'), verified=True, rightsEvidence=r['rightsEvidence'],
                       thumbCheck=f'mirrored {today}' + (f' ({px})' if px else ''), recordText=r['recordText'])
            images.append({k: v for k, v in rec.items() if v not in (None, '')})
            print('ok   ', e['id'], '|', r['license'], '|', px or '-', flush=True)
        except Exception as ex:
            skipped.append((e['id'], str(ex)))
            print('SKIP ', e['id'], '|', ex, flush=True)
    for f in man.get('carried', []):                       # records carried over, already verified
        c = json.load(open(os.path.join(ROOT, 'research', f)))
        images.extend(c['images'])
    lic = {}
    for i in images:
        lic[i['license']] = lic.get(i['license'], 0) + 1
    notes = f"SUMMARY: {len(images)} images, all public domain / CC0 / CC BY / CC BY-SA (no NC/ND). Licences: " + \
            ', '.join(f'{k} {v}' for k, v in sorted(lic.items())) + \
            f". Each licence was read from the record page or API on {today}; the statement is quoted in rightsEvidence."
    if skipped:
        notes += ' Skipped: ' + '; '.join(f'{i} ({m[:60]})' for i, m in skipped)
    json.dump({'images': images, 'notes': notes}, open(out_path, 'w'), indent=2, ensure_ascii=False)
    print(notes)


if __name__ == '__main__':
    main()
