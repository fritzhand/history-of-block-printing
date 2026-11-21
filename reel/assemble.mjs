#!/usr/bin/env node
/* reel/assemble.mjs — the recorded frames + the voice + the music -> reel/out/the-repeating-hand-reel.mp4

     node reel/assemble.mjs [--music FILE] [--no-check]

   Voice: each take is placed at the time storyboard.mjs gives it. Music: assets/audio/demo-bed.mp3, looped with a
   crossfade to the reel's length, quiet under speech (ducked by the voice), swelling at the end card.
   Loudness: the mix is measured, then matched to -14 LUFS integrated, true peak at most -1 dBTP (aimed at -1.5; two passes).
   Picture: 1080 x 1920, 30 fps, H.264 High, yuv420p, BT.709; sound AAC 48 kHz 192 kb/s; faststart.
   Also writes cover.jpg (the title card) and contact-sheet.jpg, and checks the picture for flashes. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FPS, ORDER, plan } from './storyboard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(here);
const argv = process.argv.slice(2), opt = (n, d = null) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const MUSIC = path.resolve(opt('--music', path.join(root, 'assets/audio/demo-bed.mp3')));
const VIDEO = path.join(here, 'build/video.mkv'), OUT_DIR = path.join(here, 'out'), OUT = path.join(OUT_DIR, 'the-repeating-hand-reel.mp4');
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of [VIDEO, MUSIC]) if (!fs.existsSync(f)) { console.error('✗ missing ' + f + (f === VIDEO ? ' — run node reel/record.mjs first' : '')); process.exit(1); }

const P = plan(), DUR = P.duration, voiceEnd = P.seg.open.start + P.seg.open.dur;
const ff = (args, opts = {}) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', maxBuffer: 1 << 28, ...opts }); if (r.status) { console.error(r.stderr); process.exit(1); } return r; };

/* ── sound ── */
const inputs = [], chains = [];
ORDER.forEach((id, i) => {
  inputs.push('-i', path.join(here, 'voice', id + '.mp3'));
  chains.push(`[${i}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=${Math.round(P.seg[id].start * 1000)}|${Math.round(P.seg[id].start * 1000)}[v${i}]`);
});
const n = ORDER.length;
inputs.push('-i', MUSIC, '-i', MUSIC);
const swell = `0.22+0.2*max(0,1-t/0.8)+0.3*clip((t-${voiceEnd.toFixed(2)}+0.2)/1.4,0,1)`;
const graph = [
  ...chains,
  `${ORDER.map((_, i) => `[v${i}]`).join('')}amix=inputs=${n}:normalize=0:duration=longest,apad=whole_dur=${DUR.toFixed(3)},atrim=0:${DUR.toFixed(3)}[voice]`,
  `[voice]asplit[vmix][vsc]`,
  `[${n}:a]aresample=48000,aformat=channel_layouts=stereo[m1]`, `[${n + 1}:a]aresample=48000,aformat=channel_layouts=stereo[m2]`,
  `[m1][m2]acrossfade=d=3:c1=tri:c2=tri,atrim=0:${DUR.toFixed(3)},asetpts=PTS-STARTPTS,volume='${swell}':eval=frame,afade=t=out:st=${(DUR - 2.4).toFixed(2)}:d=2.4[music]`,
  `[music][vsc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=500:makeup=1[ducked]`,
  `[vmix][ducked]amix=inputs=2:normalize=0:duration=first[mix]`,
];
const MIX = path.join(here, 'build/mix.wav');
ff(['-y', ...inputs, '-filter_complex', graph.join(';'), '-map', '[mix]', '-ar', '48000', '-c:a', 'pcm_s24le', MIX]);

// pass 1: measure. pass 2: match -14 LUFS / -1 dBTP with the measurement.
const meas = ff(['-i', MIX, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr;
const m = JSON.parse(meas.slice(meas.lastIndexOf('{'), meas.lastIndexOf('}') + 1));
const MASTER = path.join(here, 'build/master.wav');
ff(['-y', '-i', MIX, '-af', `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, '-ar', '48000', '-c:a', 'pcm_s24le', MASTER]);

/* ── picture + sound together ── */
ff(['-y', '-i', VIDEO, '-i', MASTER, '-map', '0:v', '-map', '1:a', '-t', DUR.toFixed(3),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-maxrate', '10M', '-bufsize', '20M', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p', '-g', '60', '-bf', '2',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', OUT]);

/* ── cover, contact sheet ── */
ff(['-y', '-ss', '0.4', '-i', OUT, '-frames:v', '1', '-q:v', '2', path.join(OUT_DIR, 'cover.jpg')]);      // the title card, before the first caption
ff(['-y', '-i', OUT, '-vf', `fps=${(12 / DUR).toFixed(5)},scale=270:-1,tile=6x2:padding=6:color=0x0e1019`, '-frames:v', '1', '-q:v', '3', path.join(OUT_DIR, 'contact-sheet.jpg')]);

/* ── report ── */
const probe = JSON.parse(spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', OUT], { encoding: 'utf8' }).stdout);
const v = probe.streams.find(s => s.codec_type === 'video'), a = probe.streams.find(s => s.codec_type === 'audio');
const lu = ff(['-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr, sum = lu.slice(lu.lastIndexOf('Summary:'));
const pick = re => (sum.match(re) || [])[1];
console.log(`${path.relative(root, OUT)}: ${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate} fps, ${a.codec_name} ${a.sample_rate} Hz, ${(+probe.format.duration).toFixed(2)} s, ${(probe.format.size / 1e6).toFixed(1)} MB`);
console.log(`loudness: ${pick(/I:\s+(-?[\d.]+) LUFS/)} LUFS integrated, true peak ${pick(/Peak:\s+(-?[\d.]+) dBFS/)} dBTP, range ${pick(/LRA:\s+([\d.]+) LU/)} LU`);

if (!argv.includes('--no-check')) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', OUT, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const ys = [...r.stdout.matchAll(/YAVG=([\d.]+)/g)].map(x => +x[1]), jumps = [];
  for (let i = 1; i < ys.length; i++) if (Math.abs(ys[i] - ys[i - 1]) > 14) jumps.push(`${(i / FPS).toFixed(2)} s (${ys[i - 1].toFixed(0)} → ${ys[i].toFixed(0)})`);
  console.log(jumps.length ? `flash check: ${jumps.length} sudden brightness change(s): ${jumps.join(', ')}` : `flash check: no frame changes brightness by more than 14 of 255 (${ys.length} frames)`);
}
