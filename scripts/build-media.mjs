#!/usr/bin/env node
/**
 * Deterministic media pipeline for PRIME.
 *
 *   source/*.mp4  ->  public/media/prime-walk.mp4  (+ poster frames)
 *
 * The three source clips are frame-continuous: the pixel difference across each
 * join is the same magnitude as an ordinary adjacent-frame difference (~5-6 MAD
 * on an 8-bit luma scale) versus ~32-41 for any other ordering. They are
 * therefore concatenated into a single master so the experience runs on one
 * decoder and one clock.
 *
 * Encoder settings were chosen from measurements, not preference - see README.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'source');
const outDir = path.join(root, 'public', 'media');
const tmpDir = path.join(root, '.work');

/** Chronological order, established by visual + numerical continuity analysis. */
const CLIPS = [
  '01-approach-and-first-gesture.mp4',
  '02-corridor-and-stop.mp4',
  '03-final-gestures-and-hold.mp4',
];

/** Chosen encode: visually indistinguishable from CRF 20, sustains 60 fps scrub. */
const CRF = 22;
const GOP = 8; // frames @ 24 fps -> a keyframe every 1/3 s

const posix = (p) => p.split(path.sep).join('/');
const run = (bin, args) => execFileSync(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

const probe = (file, entries) =>
  run('ffprobe', ['-v', 'error', '-show_entries', entries, '-of', 'default=noprint_wrappers=1', file]).trim();

mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

for (const clip of CLIPS) {
  if (!existsSync(path.join(srcDir, clip))) throw new Error(`missing source clip: ${clip}`);
}

// 1. Concatenate, dropping audio at the demux stage so no AAC track can survive.
const listFile = path.join(tmpDir, 'concat-build.txt');
writeFileSync(listFile, CLIPS.map((c) => `file '${posix(path.join(srcDir, c))}'`).join('\n'));

const lossless = path.join(tmpDir, 'master-lossless.mp4');
console.log('- concatenating source clips (audio dropped)');
run('ffmpeg', [
  '-v', 'error', '-y',
  '-f', 'concat', '-safe', '0', '-i', posix(listFile),
  '-an', '-c:v', 'copy', '-movflags', '+faststart', lossless,
]);

// 2. Delivery encode.
const master = path.join(outDir, 'prime-walk.mp4');
console.log(`- encoding delivery master (H.264, CRF ${CRF}, GOP ${GOP}, 1280x720)`);
run('ffmpeg', [
  '-v', 'error', '-y', '-i', lossless, '-an',
  '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p',
  '-preset', 'slower', '-crf', String(CRF),
  '-x264-params',
  `keyint=${GOP}:min-keyint=${GOP}:scenecut=0:open-gop=0:ref=3:bframes=2:rc-lookahead=${GOP}`,
  '-movflags', '+faststart', master,
]);

// 3. Poster: the first frame, so the stage never shows an empty or mis-scaled box.
console.log('- writing poster frames');
run('ffmpeg', ['-v', 'error', '-y', '-i', master, '-frames:v', '1',
  '-c:v', 'libwebp', '-quality', '80', path.join(outDir, 'poster.webp')]);
run('ffmpeg', ['-v', 'error', '-y', '-i', master, '-frames:v', '1',
  '-c:v', 'libaom-av1', '-still-picture', '1', '-crf', '34', '-cpu-used', '5',
  path.join(outDir, 'poster.avif')]);

// 4. Verification.
if (probe(master, 'stream=codec_type').includes('audio')) {
  throw new Error('delivery master still contains an audio stream');
}
const frames = probe(master, 'stream=nb_frames').split('=')[1];
const duration = probe(master, 'format=duration').split('=')[1];

console.log('');
console.log(`  master    ${posix(path.relative(root, master))}`);
console.log(`  size      ${(statSync(master).size / 1048576).toFixed(2)} MB`);
console.log(`  frames    ${frames} @ 24 fps`);
console.log(`  duration  ${Number(duration).toFixed(3)} s`);
console.log('  audio     none');
for (const p of ['poster.webp', 'poster.avif']) {
  console.log(`  ${p.padEnd(9)} ${(statSync(path.join(outDir, p)).size / 1024).toFixed(1)} kB`);
}
