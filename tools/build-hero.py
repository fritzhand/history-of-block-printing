#!/usr/bin/env python3
"""
build-hero.py — assemble the hero video and its soundtrack bed.

    python3 tools/build-hero.py                    # cut assets/video/clips/shot-*.mp4
    python3 tools/build-hero.py --placeholder      # Blender sweep (3d/work/hero_stone + hero_printed)
    python3 tools/build-hero.py --audio-start 8    # where in the track the bed begins (seconds)

Outputs (assets/video/, assets/audio/):
  hero-shawl.mp4 / .webm     silent video, the page plays it muted, looping
  hero-poster.jpg            a frame for the poster
  hero-bed.mp3               the soundtrack trimmed to the video's length, faded, -16 LUFS
  hero-shawl-with-sound.mp4  video + bed muxed, for sharing outside the page (git-ignored)

The soundtrack is optional. The video file never contains it, so the page works if the track
is absent or its rights are not cleared. Needs ffmpeg and ffprobe on PATH.
"""
import argparse, glob, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)


def run(cmd):
    print('$', ' '.join(cmd[:6]), '…', flush=True)
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def duration(path):
    out = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    return float(out.decode().strip())


def build_video_from_clips(out, fade=0.5):
    clips = sorted(glob.glob(P('assets/video/clips/shot-*.mp4')))
    if not clips:
        sys.exit('no clips in assets/video/clips/ (shot-01.mp4 …). Use --placeholder for the Blender sweep.')
    durs = [duration(c) for c in clips]
    cmd = ['ffmpeg', '-y']
    for c in clips:
        cmd += ['-i', c]
    parts = [f'[{i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24,format=yuv420p,setsar=1[v{i}]'
             for i in range(len(clips))]
    acc, t = 'v0', durs[0]
    for i in range(1, len(clips)):
        off = t - fade
        parts.append(f'[{acc}][v{i}]xfade=transition=fade:duration={fade}:offset={off:.3f}[x{i}]')
        acc, t = f'x{i}', t + durs[i] - fade
    cmd += ['-filter_complex', ';'.join(parts), '-map', f'[{acc}]', '-an', '-c:v', 'libx264', '-crf', '20',
            '-preset', 'slow', '-movflags', '+faststart', out]
    run(cmd)
    return t


def build_video_from_placeholder(out, dissolve_at=6.5, dissolve=3.0):
    a, b = P('3d/work/hero_stone/f%04d.png'), P('3d/work/hero_printed/f%04d.png')
    cmd = ['ffmpeg', '-y', '-framerate', '24', '-i', a, '-framerate', '24', '-ss', str(dissolve_at), '-i', b,
           '-filter_complex', f'[0:v][1:v]xfade=transition=fade:duration={dissolve}:offset={dissolve_at},format=yuv420p[v]',
           '-map', '[v]', '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', out]
    run(cmd)
    return duration(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--placeholder', action='store_true')
    ap.add_argument('--audio', default=P('assets/audio/temple.mp3'))
    ap.add_argument('--audio-start', type=float, default=0.0)
    a = ap.parse_args()
    os.makedirs(P('assets/video'), exist_ok=True); os.makedirs(P('assets/audio'), exist_ok=True)
    mp4 = P('assets/video/hero-shawl.mp4')
    total = build_video_from_placeholder(mp4) if a.placeholder else build_video_from_clips(mp4)
    total = duration(mp4)
    run(['ffmpeg', '-y', '-i', mp4, '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', '-an', P('assets/video/hero-shawl.webm')])
    run(['ffmpeg', '-y', '-ss', '1.0', '-i', mp4, '-frames:v', '1', '-q:v', '3', P('assets/video/hero-poster.jpg')])
    print(f'video {total:.1f}s')
    if os.path.exists(a.audio):
        bed = P('assets/audio/hero-bed.mp3')
        af = (f'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=1.2,'
              f'afade=t=out:st={max(total - 2.5, 0):.2f}:d=2.5')
        run(['ffmpeg', '-y', '-ss', str(a.audio_start), '-t', f'{total:.3f}', '-i', a.audio, '-af', af,
             '-c:a', 'libmp3lame', '-b:a', '160k', bed])
        run(['ffmpeg', '-y', '-i', mp4, '-i', bed, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac',
             '-b:a', '160k', '-shortest', '-movflags', '+faststart', P('assets/video/hero-shawl-with-sound.mp4')])
        print('bed + with-sound written (rights for the track are unconfirmed: keep out of a public repo)')
    else:
        print('no soundtrack found at', a.audio, '- video only')


if __name__ == '__main__':
    main()
