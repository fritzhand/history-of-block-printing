#!/usr/bin/env node
/* reel/script.mjs — turn the reel's words into script.json (what the voice speaks, with a hash per line).
     node reel/script.mjs
   Then record the takes:
     node tools/demo-voice.mjs --script reel/script.json --out reel/voice --manifest reel/voice-manifest.json --bitrate 96k */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScript } from '../tools/lib/voice-script.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(fs.readFileSync(path.join(here, 'script.source.json'), 'utf8'));
const script = buildScript(source);
fs.writeFileSync(path.join(here, 'script.json'), JSON.stringify(script, null, 2) + '\n');
const words = script.steps.reduce((n, s) => n + s.say.split(/\s+/).length, 0);
console.log(`reel: ${script.steps.length} lines, ${words} words`);
