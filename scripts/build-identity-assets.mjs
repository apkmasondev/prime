#!/usr/bin/env node
/**
 * Derives the shipped brand assets from `logo.png`.
 *
 * Two tones are produced from the same artwork: the original ink, and a paper
 * version for use over the film. The paper version keeps the gold - the dot on
 * the I and the rules under 2 3 5 7 - by recolouring only the pixels whose red
 * channel runs well ahead of their blue, which is exactly the gold.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'logo.png');
const outDir = path.join(root, 'public', 'brand');

/** Trim of the transparent margin in the source file, measured from its alpha. */
const CROP = { w: 1981, h: 614, x: 103, y: 37 };
const WIDTH = 1120;

const GOLD = { r: 224, g: 189, b: 133 };
const PAPER = { r: 250, g: 248, b: 243 };

const isGold = 'gt(r(X,Y)-b(X,Y),55)';
const recolour = [
  `r='if(${isGold},${String(GOLD.r)},${String(PAPER.r)})'`,
  `g='if(${isGold},${String(GOLD.g)},${String(PAPER.g)})'`,
  `b='if(${isGold},${String(GOLD.b)},${String(PAPER.b)})'`,
  `a='alpha(X,Y)'`,
].join(':');

const crop = `crop=${String(CROP.w)}:${String(CROP.h)}:${String(CROP.x)}:${String(CROP.y)}`;
const scale = `scale=${String(WIDTH)}:-1:flags=lanczos`;

const run = (args) => { execFileSync('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] }); };

mkdirSync(outDir, { recursive: true });

const variants = [
  { name: 'prime-wordmark', filter: `${crop},format=rgba,geq=${recolour},${scale}` },
  { name: 'prime-wordmark-ink', filter: `${crop},format=rgba,${scale}` },
];

// WebP only: the wordmark needs an alpha channel, and ffmpeg's AV1 encoder
// silently drops it, which would ship a solid rectangle instead of letters.
for (const variant of variants) {
  const file = path.join(outDir, `${variant.name}.webp`);
  run(['-v', 'error', '-y', '-i', source, '-vf', variant.filter,
    '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', '-preset', 'text', file]);
  console.log(`  ${path.basename(file).padEnd(28)} ${(statSync(file).size / 1024).toFixed(1)} kB`);
}

/*
 * The touch icon and the social card.
 *
 * Both are rendered through Chromium rather than drawn with ffmpeg primitives:
 * the icon is the shipped favicon, so rasterising the real file guarantees the
 * two never drift apart, and the card is laid out with the site's own faces.
 * Playwright is already a development dependency for the smoke tests, and the
 * results are committed, so nothing here runs in CI.
 */
const { chromium } = await import('playwright');
const { readFileSync } = await import('node:fs');

const publicDir = path.join(root, 'public');
const fonts = path.join(root, 'node_modules', '@fontsource-variable');
const b64 = (file) => readFileSync(file).toString('base64');

const face = (family, style, file) => `
@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: 400 900;
  src: url(data:font/woff2;base64,${b64(file)}) format('woff2-variations');
}`;

const FACES = [
  face('Playfair', 'normal', path.join(fonts, 'playfair-display/files/playfair-display-latin-wght-normal.woff2')),
  face('Playfair', 'italic', path.join(fonts, 'playfair-display/files/playfair-display-latin-wght-italic.woff2')),
  face('Plex', 'normal', path.join(fonts, 'ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2')),
].join('\n');

const browser = await chromium.launch();

// --- touch icon: the favicon itself, on its own ground -----------------------
{
  const svg = readFileSync(path.join(publicDir, 'favicon.svg')).toString('base64');
  const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await page.setContent(
    `<body style="margin:0"><img src="data:image/svg+xml;base64,${svg}" width="180" height="180"></body>`,
  );
  await page.screenshot({ path: path.join(publicDir, 'apple-touch-icon.png') });
  await page.close();
  console.log(`  ${'apple-touch-icon.png'.padEnd(28)} ${(statSync(path.join(publicDir, 'apple-touch-icon.png')).size / 1024).toFixed(1)} kB`);
}

// --- social card: the closing frame, the mark, the promise -------------------
{
  const still = path.join(root, '.work', 'og-still.png');
  const master = path.join(publicDir, 'media', 'prime-walk.mp4');
  mkdirSync(path.join(root, '.work'), { recursive: true });
  // Frame 712: the professor stationary at the end of the walk.
  run(['-v', 'error', '-y', '-i', master, '-vf',
    "select='eq(n,712)',scale=1200:675:flags=lanczos,crop=1200:630:0:34", '-frames:v', '1', still]);

  const shot = b64(still);
  const mark = b64(path.join(publicDir, 'brand', 'prime-wordmark.webp'));
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<style>${FACES}
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; position: relative; overflow: hidden; background: #0e1319; }
    .shot { position: absolute; inset: 0; background: url(data:image/png;base64,${shot}) center/cover; }
    .scrim { position: absolute; inset: 0;
      background: linear-gradient(100deg, #0e1319 30%, rgb(14 19 25 / 72%) 52%, rgb(14 19 25 / 10%) 78%); }
    .block { position: absolute; inset-block: 0; inset-inline-start: 78px; width: 560px;
      display: flex; flex-direction: column; justify-content: center; gap: 26px; }
    .mark { width: 470px; height: auto; }
    .sub { font-family: Playfair, serif; font-style: italic; font-size: 34px; color: #faf8f3; letter-spacing: 0.01em; }
    .rule { width: 92px; height: 1px; background: #c1954c; }
    .line { font-family: Plex, sans-serif; font-size: 17px; letter-spacing: 0.15em; text-transform: uppercase;
      color: rgb(250 248 243 / 62%); }
  </style>
  <div class="shot"></div><div class="scrim"></div>
  <div class="block">
    <img class="mark" src="data:image/webp;base64,${mark}">
    <p class="sub">A Short Walk Through Infinity</p>
    <div class="rule"></div>
    <p class="line">Six stops &middot; one idea that never ends</p>
  </div>`);
  // eslint-disable-next-line no-undef -- runs inside the page, not in Node
  await page.evaluate(() => document.fonts.ready);
  // JPEG: the card is a photograph with type over it, and every scraper reads
  // it. The same frame as PNG is six times the weight for no visible gain.
  await page.screenshot({ path: path.join(publicDir, 'og.jpg'), type: 'jpeg', quality: 86 });
  await page.close();
  console.log(`  ${'og.jpg'.padEnd(28)} ${(statSync(path.join(publicDir, 'og.jpg')).size / 1024).toFixed(1)} kB`);
}

await browser.close();
