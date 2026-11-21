#!/usr/bin/env python3
"""
check-quotes.py — re-verify every source in research/*.json against its page.

    python3 tools/check-quotes.py [--only EVENT_ID ...] [--file research/printing.json]

For each source object that is not PENDING:
  - with `checkFields` (museum catalogue records): each field must equal the value in the
    record read from `checkUrl` (the museum's API). The "quote" is then just those fields.
  - otherwise: every part of the quote (split at " … ") must appear in the text of
    `checkUrl` (if given) or `url`, after the same whitespace / dash / curly-quote
    normalisation as tools/fetch-text.py.
Exit code 1 if any source fails. A fetch failure is reported as ERR, not FAIL.

Run it with a Python that has beautifulsoup4, pdfminer.six and certifi installed.
"""
import argparse, glob, importlib.util, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('fetch_text', os.path.join(ROOT, 'tools', 'fetch-text.py'))
ft = importlib.util.module_from_spec(spec); spec.loader.exec_module(ft)


def flatten(o):
    if isinstance(o, str):
        return [re.sub(r'<[^>]+>', ' ', o)]
    if isinstance(o, dict):
        return [t for v in o.values() for t in flatten(v)]
    if isinstance(o, list):
        return [t for v in o for t in flatten(v)]
    return [str(o)] if o is not None else []


def load(url):
    raw, ctype = ft.fetch(url)
    if 'json' in ctype.lower() or raw[:1] in (b'{', b'['):
        obj = json.loads(raw)
        return obj, ' \n'.join(flatten(obj))
    return None, ft.to_text(raw, ctype, url)


def lookup(obj, key):
    for scope in (obj, obj.get('record') if isinstance(obj, dict) else None, obj.get('data') if isinstance(obj, dict) else None):
        if isinstance(scope, dict) and key in scope:
            v = scope[key]
            if isinstance(v, list):
                v = ' '.join(map(str, v))
            return re.sub(r'<[^>]+>', ' ', str(v))
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*')
    ap.add_argument('--file', nargs='*')
    a = ap.parse_args()
    files = a.file or sorted(glob.glob(os.path.join(ROOT, 'research', '*.json')))
    cache, bad, tot = {}, 0, {'OK': 0, 'FAIL': 0, 'ERR': 0, 'PENDING': 0}
    for f in files:
        d = json.load(open(f))
        for ev in d.get('events', []) + d.get('features', []):
            if a.only and ev['id'] not in a.only:
                continue
            for i, s in enumerate(ev.get('sources', [])):
                tag = f"{ev['id']}[{i}]"
                if s.get('verificationStatus') == 'PENDING' or not s.get('quote'):
                    tot['PENDING'] += 1; print('PEND ', tag, '-', s['institution'][:40]); continue
                url = s.get('checkUrl') or s['url']
                try:
                    if url not in cache:
                        cache[url] = load(url)
                    obj, text = cache[url]
                except Exception as e:
                    tot['ERR'] += 1; print('ERR  ', tag, '-', str(e)[:80], '<-', url[:70]); continue
                if s.get('checkFields'):
                    miss = [k for k, v in s['checkFields'].items() if ft.norm(str(lookup(obj, k) or '')) != ft.norm(v)]
                    ok = not miss
                    detail = '' if ok else f"fields differ: {miss}"
                else:
                    parts = [p for p in re.split(r'\s…\s', s['quote']) if p.strip()]
                    nt = ft.norm(text)
                    miss = [p for p in parts if ft.norm(p) not in nt]
                    ok = not miss
                    detail = '' if ok else 'not on page: ' + miss[0][:80]
                if ok:
                    tot['OK'] += 1; print('OK   ', tag)
                else:
                    tot['FAIL'] += 1; bad += 1; print('FAIL ', tag, '-', detail)
    print('\nSUMMARY:', ', '.join(f'{k} {v}' for k, v in tot.items()))
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
