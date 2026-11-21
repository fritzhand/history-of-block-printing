#!/usr/bin/env node
/** media-roll.mjs — regenerate the media roll table in CONTENT_LICENSE.md from js/data.js. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const win = {}; new Function('window', fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'))(win);
const rows = win.printData.mediaAssets.map(m => `| \`${m.id}\` | ${m.license} | ${String(m.creditLine).replace(/\|/g, '/')} | [record](${m.sourceUrl}) |`);
const table = '| Image | Licence | Credit | Source |\n|---|---|---|---|\n' + rows.join('\n');
const f = path.join(root, 'CONTENT_LICENSE.md');
let t = fs.readFileSync(f, 'utf8');
t = t.replace(/<!-- media-roll:start -->[\s\S]*<!-- media-roll:end -->/, `<!-- media-roll:start -->\n${table}\n<!-- media-roll:end -->`);
fs.writeFileSync(f, t);
console.log(`media roll: ${rows.length} rows`);
